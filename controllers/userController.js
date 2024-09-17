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


exports.register = async (req, res) => {
  upload.fields([
    { name: 'dni_foto_delante', maxCount: 1 },
    { name: 'dni_foto_detras', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al procesar los archivos' });
    }

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

    const existingUser = await prismaClient.usuario.findFirst({
      where: {
        OR: [{ dni: dniInt }, { correo }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El DNI o el correo ya están registrados' });
    }

    let dniFotoDelanteFileName = null;
    let dniFotoDetrasFileName = null;

    try {
      if (req.files) {
        if (req.files['dni_foto_delante'] && req.files['dni_foto_delante'][0]) {
          const file = req.files['dni_foto_delante'][0];
          dniFotoDelanteFileName = await uploadToS3(file, dniInt);
        }

        if (req.files['dni_foto_detras'] && req.files['dni_foto_detras'][0]) {
          const file = req.files['dni_foto_detras'][0];
          dniFotoDetrasFileName = await uploadToS3(file, dniInt);
        }
      }
    } catch (uploadErr) {
      return res.status(500).json({ error: 'Error al subir las imágenes a S3' });
    }

    let dniFotoDelanteText = '';
    let dniFotoDetrasText = '';

    try {
      if (dniFotoDelanteFileName) {
        dniFotoDelanteText = await analyzeImageWithTextract(process.env.AWS_BUCKET_NAME, dniFotoDelanteFileName);
      }

      if (dniFotoDetrasFileName) {
        dniFotoDetrasText = await analyzeImageWithTextract(process.env.AWS_BUCKET_NAME, dniFotoDetrasFileName);
      }
    } catch (textractError) {
      console.error('Error al procesar las imágenes con Textract:', textractError);
      return res.status(500).json({ error: 'Error al procesar las imágenes con Textract' });
    }

    const verificationResult = await verificarDatos(
      dniFotoDelanteText,
      dniFotoDetrasText,
      { nombre, dni, cuil, fecha_nacimiento }
    );

    if (!verificationResult.success) {
      // Eliminar las imágenes subidas a S3 si falla la verificación, sin esperar a que termine la eliminación
      deleteFiles(process.env.AWS_BUCKET_NAME, [dniFotoDelanteFileName, dniFotoDetrasFileName]);

      return res.status(400).json({ error: verificationResult.error });
    }

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
          dni_foto_detras: dniFotoDetrasFileName,
          textextract: {
            frente: dniFotoDelanteText,
            detras: dniFotoDetrasText,
          }
        }
      });

      const token = jwt.sign(
        { id: newUser.id.toString(), dni: newUser.dni.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
      );

      res.status(201).json({ message: 'Registro exitoso', token });
    } catch (creationError) {
      console.error('Error al crear el usuario:', creationError);
      return res.status(500).json({ error: 'Error al crear el usuario' });
    }
  });
};

