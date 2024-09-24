// /controllers/dniController.js

const { PrismaClient } = require('@prisma/client');
const { analyzeImageWithTextract } = require('../utils/textractUtils');
const multer = require('multer');
const { verificarDatos } = require('../utils/verificationUtils');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

const uploadMiddleware = upload.fields([
  { name: 'dni_foto_delante', maxCount: 1 },
  { name: 'dni_foto_detras', maxCount: 1 }
]);

// Configura AWS para S3
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


exports.processDNI = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la carga de archivos' });
    }

    try {
      // const userId = parseInt(req.user.id, 10); // Comentado esta linea remover temporalmente verificacion jwt

      const userId = parseInt(req.body.userId, 10); // Se obtiene el id del body del request quitar y descomentar arriba para reactivar jwt

      const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const ticket = await prisma.tiqueteria.create({
        data: {
          usuarioId: usuario.id,
          estado: 'pendiente'
        }
      });

      // Inicia el procesamiento de imágenes sin bloquear
      setImmediate(() => processImages(ticket.id, usuario, req.files));

      res.status(200).json({ message: 'Ticket creado y en proceso' });

    } catch (err) {
      console.error('Error en el proceso:', err);
      res.status(500).json({ error: 'Error en el proceso de creación del ticket' });
    }
  });
};

const processImages = async (ticketId, usuario, files) => {

  try {
    let dniFotoDelanteFileName = null;
    let dniFotoDetrasFileName = null;

    if (files) {
      if (files['dni_foto_delante'] && files['dni_foto_delante'][0]) {
        const fileDelante = files['dni_foto_delante'][0];
        dniFotoDelanteFileName = await uploadToS3(fileDelante, usuario.dni.toString());
      }

      if (files['dni_foto_detras'] && files['dni_foto_detras'][0]) {
        const fileDetras = files['dni_foto_detras'][0];
        dniFotoDetrasFileName = await uploadToS3(fileDetras, usuario.dni.toString());
      }
    } else {
      throw new Error('No se encontraron imágenes para procesar');
    }

    let dniFotoDelanteText = '';
    let dniFotoDetrasText = '';

    if (dniFotoDelanteFileName) {
      dniFotoDelanteText = await analyzeImageWithTextract(process.env.AWS_BUCKET_NAME, dniFotoDelanteFileName);
    }

    if (dniFotoDetrasFileName) {
      dniFotoDetrasText = await analyzeImageWithTextract(process.env.AWS_BUCKET_NAME, dniFotoDetrasFileName);
    }

    const resTextract = {
      frente: dniFotoDelanteText,
      detras: dniFotoDetrasText
    };

    await prisma.dni.create({
      data: {
        fotoFrente: dniFotoDelanteFileName,
        fotoDetras: dniFotoDetrasFileName,
        resTextract: resTextract,
        tiqueteriaId: ticketId
      }
    });

    const resultadoVerificacion = await verificarDatos(dniFotoDelanteText, dniFotoDetrasText, {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni.toString(),
      cuil: usuario.cuil
    });

    await prisma.tiqueteria.update({
      where: { id: ticketId },
      data: {
        estado: resultadoVerificacion.valido ? 'completado' : 'fallido',
        resultado: resultadoVerificacion
      }
    });

  } catch (err) {
    console.error('Error en el procesamiento:', err);
    await prisma.tiqueteria.update({
      where: { id: ticketId },
      data: { estado: 'fallido', msqError: err.message }
    });
  }
};
