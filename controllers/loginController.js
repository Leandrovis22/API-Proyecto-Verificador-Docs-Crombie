const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const { deleteFiles } = require('../utils/s3Utils');

// Configura Prisma
const prismaClient = new PrismaClient();

// Configura AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Función para subir un archivo a S3
const uploadToS3 = async (file, folder, dni) => {
  const fileExtension = path.extname(file.originalname); // Obtener la extensión del archivo
  const fileName = `${dni}-${Date.now()}${fileExtension}`; // Nombre único para el archivo
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    return fileName;
  } catch (err) {
    console.error('Error al subir el archivo a S3:', err);
    throw new Error('Error al subir el archivo a S3');
  }
};

// Configura Multer para manejar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Controlador para el registro
exports.register = async (req, res) => {
  // Manejo de archivos
  upload.fields([
    { name: 'dni_foto_delante', maxCount: 1 },
    { name: 'dni_foto_detras', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al procesar los archivos' });
    }

    // Validaciones
    const { nombre, dni, cuil, correo, password, telefono, fecha_nacimiento } = req.body;

    if (!dni || !correo || !password) {
      return res.status(400).json({ error: 'DNI, correo y contraseña son requeridos' });
    }

    const dniInt = parseInt(dni, 10);
    if (isNaN(dniInt)) {
      return res.status(400).json({ error: 'DNI debe ser un número entero' });
    }

    const telefonoInt = parseInt(telefono, 10);
    if (isNaN(telefonoInt)) {
      return res.status(400).json({ error: 'Teléfono debe ser un número entero' });
    }

    // Verificar si ya existe el DNI o el correo
    const existingUser = await prismaClient.usuario.findFirst({
      where: {
        OR: [{ dni: dniInt }, { correo }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El DNI o el correo ya están registrados' });
    }

    // Subir las imágenes a S3
    let dniFotoDelanteFileName = null;
    let dniFotoDetrasFileName = null;

    try {
      if (req.files) {
        if (req.files['dni_foto_delante'] && req.files['dni_foto_delante'][0]) {
          const file = req.files['dni_foto_delante'][0];
          dniFotoDelanteFileName = await uploadToS3(file, 'dni_foto_delante', dniInt);
        }

        if (req.files['dni_foto_detras'] && req.files['dni_foto_detras'][0]) {
          const file = req.files['dni_foto_detras'][0];
          dniFotoDetrasFileName = await uploadToS3(file, 'dni_foto_detras', dniInt);
        }
      }
    } catch (uploadErr) {
      return res.status(500).json({ error: 'Error al subir las imágenes a S3' });
    }

    // Crear el usuario
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prismaClient.usuario.create({
        data: {
          nombre,
          dni: dniInt,
          cuil,
          correo,
          password: hashedPassword,
          telefono: telefonoInt,
          fecha_nacimiento,
          dni_foto_delante: dniFotoDelanteFileName,
          dni_foto_detras: dniFotoDetrasFileName
        }
      });

      // Crear token JWT
      const token = jwt.sign(
        { id: newUser.id.toString(), dni: newUser.dni.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
      );

      res.status(201).json({ message: 'Registro exitoso', token });
    } catch (dbErr) {
      res.status(500).json({ error: 'Error al crear el usuario' });
    }
  });
};

exports.login = async (req, res) => {
  const { dni, password } = req.body;

  try {
    // Buscar usuario por DNI
    const user = await prismaClient.usuario.findUnique({
      where: { dni: BigInt(dni) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id.toString(), dni: user.dni.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Respuesta con los datos del usuario y el token
    res.json({
      message: 'Login exitoso',
      token: token
    });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error en el login' });
  }
};

exports.updateUser = [
  upload.fields([
    { name: 'dni_foto_delante', maxCount: 1 },
    { name: 'dni_foto_detras', maxCount: 1 }
  ]),
  async (req, res) => {
    const { nombre, dni, cuil, correo, telefono, fecha_nacimiento } = req.body;
    const userId = req.user.id;  // Obtener el id del usuario autenticado del token JWT
    const files = req.files;

    try {
      // Buscar el usuario existente
      const user = await prismaClient.usuario.findUnique({
        where: { id: parseInt(userId) }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar si el nuevo DNI ya está registrado
      if (dni && parseInt(dni) !== user.dni) {
        const existingUserWithDni = await prismaClient.usuario.findUnique({
          where: { dni: parseInt(dni) }
        });

        if (existingUserWithDni) {
          return res.status(400).json({ error: 'El DNI ya está registrado' });
        }
      }

      // Eliminar las fotos antiguas si se envían nuevas
      let dniFotoDelanteFileName = user.dni_foto_delante;
      let dniFotoDetrasFileName = user.dni_foto_detras;

      if (files) {
        console.log('Archivos recibidos:', files);

        if (files['dni_foto_delante'] && files['dni_foto_delante'][0]) {
          // Eliminar la foto antigua
          if (dniFotoDelanteFileName) {
            await deleteFiles([dniFotoDelanteFileName]);
          }

          const file = files['dni_foto_delante'][0];
          dniFotoDelanteFileName = await uploadToS3(file, 'dni_foto_delante', dni);
        }

        if (files['dni_foto_detras'] && files['dni_foto_detras'][0]) {
          // Eliminar la foto antigua
          if (dniFotoDetrasFileName) {
            await deleteFiles([dniFotoDetrasFileName]);
          }

          const file = files['dni_foto_detras'][0];
          dniFotoDetrasFileName = await uploadToS3(file, 'dni_foto_detras', dni);
        }
      }

      // Actualizar el usuario en la base de datos
      const updatedUser = await prismaClient.usuario.update({
        where: { id: parseInt(userId) },
        data: {
          nombre: nombre || user.nombre,
          dni: dni ? parseInt(dni) : user.dni,
          cuil: cuil || user.cuil,
          correo: correo || user.correo,
          telefono: telefono ? parseInt(telefono) : user.telefono,
          fecha_nacimiento: fecha_nacimiento || user.fecha_nacimiento,
          dni_foto_delante: dniFotoDelanteFileName,
          dni_foto_detras: dniFotoDetrasFileName
        }
      });

      const replacer = (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString(); // Convertir BigInt a String
        }
        return value;
      };

      // Serializar BigInt a String antes de enviar la respuesta
      const responseData = JSON.stringify({
        message: 'Usuario actualizado con éxito',
        user: updatedUser
      }, replacer);

      res.json(JSON.parse(responseData));
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
  }
];

exports.deleteUser = async (req, res) => {
  const userId = req.user.id; // Extraído del token JWT

  try {
    // Verificar si el usuario existe
    const user = await prismaClient.usuario.findUnique({
      where: { id: parseInt(userId) },
      include: { dniform: true } // Incluye dniform para obtener los archivos
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener los nombres de los archivos de S3
    const fileNames = [
      user.dni_foto_delante,
      user.dni_foto_detras,
      ...user.dniform.flatMap(form => [form.dni_foto_delante, form.dni_foto_detras])
    ].filter(Boolean); // Filtrar valores nulos o indefinidos

    // Eliminar todos los archivos asociados de S3
    await deleteFiles(fileNames);

    // Eliminar el usuario y sus dniform asociados
    await prismaClient.usuario.delete({
      where: { id: parseInt(userId) }
    });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// Controlador para obtener todos los usuarios y sus dniform asociados
exports.getUsers = async (req, res) => {
  try {
    const users = await prismaClient.usuario.findMany({
      include: {
        dniform: true, // Incluye dniform asociados a cada usuario
      },
    });

    // Función para reemplazar BigInt en JSON.stringify
    const replacer = (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString(); // Convertir BigInt a String
      }
      return value;
    };

    res.status(200).json(JSON.parse(JSON.stringify(users, replacer)));
  } catch (err) {
    console.error('Error al obtener los usuarios:', err);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};
