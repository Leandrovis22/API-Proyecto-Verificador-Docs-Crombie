const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const { deleteFiles } = require('../utils/s3Utils');
const { analyzeImageWithTextract } = require('../utils/textractUtils');
const { verificarDatos } = require('../utils/verificationUtils');

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
const uploadToS3 = async (file, dni) => {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${dni}-${Date.now()}${fileExtension}`;
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


// Controlador para el login
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

    res.json({
      message: 'Login exitoso',
      token: token
    });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error en el login' });
  }
};

// Controlador para obtener los datos de un usuario específico
exports.getUser = async (req, res) => {
  const userId = req.user.id;  // El ID del usuario se obtiene del token de autenticación

  try {
    // Buscar el usuario en la base de datos por su ID
    const user = await prismaClient.usuario.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Serializar los valores de BigInt como strings
    const replacer = (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    };

    // Convertir el usuario en un objeto JSON, serializando los BigInt como strings
    const userJson = JSON.parse(JSON.stringify(user, replacer));

    res.json(userJson);
  } catch (error) {
    console.error('Error al obtener los datos del usuario:', error);
    res.status(500).json({ error: 'Error al obtener los datos del usuario' });
  }
};

const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

exports.getDniImages = async (req, res) => {
  const userId = req.user.id; // Asume que el ID del usuario está en el token JWT

  try {
    // Buscar el usuario por ID
    const user = await prismaClient.usuario.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si existen las imágenes
    if (!user.dni_foto_delante && !user.dni_foto_detras) {
      return res.status(404).json({ error: 'Imágenes del DNI no encontradas' });
    }

    // Crear las URLs firmadas para las imágenes
    const urls = {};

    if (user.dni_foto_delante) {
      const commandDelante = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: user.dni_foto_delante,
      });
      const signedUrlDelante = await getSignedUrl(s3Client, commandDelante, { expiresIn: 3600 });
      urls.dni_foto_delante = signedUrlDelante;
    }

    if (user.dni_foto_detras) {
      const commandDetras = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: user.dni_foto_detras,
      });
      const signedUrlDetras = await getSignedUrl(s3Client, commandDetras, { expiresIn: 3600 });
      urls.dni_foto_detras = signedUrlDetras;
    }

    res.json(urls);
  } catch (error) {
    console.error('Error al obtener las imágenes del DNI:', error);
    res.status(500).json({ error: 'Error al obtener las imágenes del DNI' });
  }
};

// Controlador para actualizar usuario
exports.updateUser = [
  upload.fields([
    { name: 'dni_foto_delante', maxCount: 1 },
    { name: 'dni_foto_detras', maxCount: 1 }
  ]),
  async (req, res) => {
    const { nombre, dni, cuil, correo, telefono, fecha_nacimiento } = req.body;
    const userId = req.user.id;
    const files = req.files;

    try {
      // Buscar el usuario existente
      const user = await prismaClient.usuario.findUnique({
        where: { id: parseInt(userId) }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar si el nuevo DNI ya está registrado en otro usuario
      if (dni && parseInt(dni) !== user.dni) {
        const existingUserWithDni = await prismaClient.usuario.findFirst({
          where: {
            dni: parseInt(dni),
            id: { not: parseInt(userId) }
          }
        });

        if (existingUserWithDni) {
          return res.status(400).json({ error: 'El DNI ya está registrado en otro usuario' });
        }
      }

      // Verificar si el nuevo correo ya está registrado en otro usuario
      if (correo && correo !== user.correo) {
        const existingUserWithEmail = await prismaClient.usuario.findFirst({
          where: {
            correo: correo,
            id: { not: parseInt(userId) }
          }
        });

        if (existingUserWithEmail) {
          return res.status(400).json({ error: 'El correo ya está registrado en otro usuario' });
        }
      }

      // Eliminar las fotos antiguas si se envían nuevas
      let dniFotoDelanteFileName = user.dni_foto_delante;
      let dniFotoDetrasFileName = user.dni_foto_detras;

      if (files) {
        //console.log('Archivos recibidos:', files);

        if (files['dni_foto_delante'] && files['dni_foto_delante'][0]) {
          if (dniFotoDelanteFileName) {
            await deleteFiles([dniFotoDelanteFileName]);
          }

          const file = files['dni_foto_delante'][0];
          dniFotoDelanteFileName = await uploadToS3(file, dni);
        }

        if (files['dni_foto_detras'] && files['dni_foto_detras'][0]) {
          if (dniFotoDetrasFileName) {
            await deleteFiles([dniFotoDetrasFileName]);
          }

          const file = files['dni_foto_detras'][0];
          dniFotoDetrasFileName = await uploadToS3(file, dni);
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

      // Serializar BigInt como string
      const replacer = (key, value) => (typeof value === 'bigint' ? value.toString() : value);
      const updatedUserJson = JSON.parse(JSON.stringify(updatedUser, replacer));

      res.json({
        message: 'Usuario actualizado correctamente',
        user: updatedUserJson
      });
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
  }
];

// Controlador para eliminar usuario
exports.deleteUser = async (req, res) => {
  const userId = req.user.id;

  try {
    // Buscar el usuario existente
    const user = await prismaClient.usuario.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Eliminar las fotos del DNI del usuario
    const filesToDelete = [];
    if (user.dni_foto_delante) {
      filesToDelete.push(user.dni_foto_delante);
    }
    if (user.dni_foto_detras) {
      filesToDelete.push(user.dni_foto_detras);
    }

    if (filesToDelete.length > 0) {
      const bucketName = process.env.AWS_BUCKET_NAME;
      await deleteFiles(bucketName, filesToDelete);
    }

    // Eliminar el usuario
    await prismaClient.usuario.delete({
      where: { id: parseInt(userId) }
    });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};


// Controlador para obtener todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const users = await prismaClient.usuario.findMany();

    // Serializar los valores de BigInt como strings
    const replacer = (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    };

    const usersJson = JSON.parse(JSON.stringify(users, replacer));

    res.json(usersJson);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};
