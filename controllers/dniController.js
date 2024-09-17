const { PrismaClient } = require('@prisma/client');
const { analyzeImageWithTextract } = require('../utils/textractUtils');
const { verificarDatos } = require('../utils/verificationUtils');
const { uploadToS3 } = require('../utils/s3Utils');
const multer = require('multer');
const Queue = require('bull');

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });
const processingQueue = new Queue('dni-processing');

// Middleware para la subida de archivos
const uploadMiddleware = upload.fields([
  { name: 'dni_foto_delante', maxCount: 1 },
  { name: 'dni_foto_detras', maxCount: 1 }
]);

exports.uploadMiddleware = uploadMiddleware;

exports.processDNI = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la carga de archivos' });
    }

    try {
      const userId = req.user.id;

      const usuario = await prisma.usuario.findUnique({
        where: { id: userId }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const ticket = await prisma.tiqueteria.create({
        data: {
          usuarioId: usuario.id,
          estado: 'pendiente'
        }
      });

      processingQueue.add({
        ticketId: ticket.id,
        userId: usuario.id,
        files: req.files,
        bucketName: process.env.AWS_BUCKET_NAME
      });

      res.status(200).json({ message: 'Ticket creado y en proceso' });

    } catch (err) {
      console.error('Error en el proceso:', err);
      res.status(500).json({ error: 'Error en el proceso de creación del ticket' });
    }
  });
};

// Procesador de la cola
processingQueue.process(async (job) => {
  const { ticketId, userId, files, bucketName } = job.data;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (!usuario) throw new Error('Usuario no encontrado');

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
      dniFotoDelanteText = await analyzeImageWithTextract(bucketName, dniFotoDelanteFileName);
    }

    if (dniFotoDetrasFileName) {
      dniFotoDetrasText = await analyzeImageWithTextract(bucketName, dniFotoDetrasFileName);
    }

    const verificationResult = await verificarDatos(
      dniFotoDelanteText,
      dniFotoDetrasText,
      {
        nombre: usuario.nombre,
        dni: usuario.dni.toString(),
        cuil: usuario.cuil.toString()
      }
    );

    if (!verificationResult.success) {
      await prisma.tiqueteria.update({
        where: { id: ticketId },
        data: {
          estado: 'fallido',
          msqError: verificationResult.error,
        }
      });
      return;
    }

    const resTextract = {
      frente: dniFotoDelanteText,
      detras: dniFotoDetrasText
    };
    
    const nuevoDni = await prisma.dni.create({
      data: {
        fotoFrente: dniFotoDelanteFileName,
        fotoDetras: dniFotoDetrasFileName,
        resTextract: resTextract,
        tiqueteriaId: ticketId
      }
    });

    await prisma.tiqueteria.update({
      where: { id: ticketId },
      data: { estado: 'completado' }
    });

  } catch (err) {
    console.error('Error en el procesamiento:', err);

    await prisma.tiqueteria.update({
      where: { id: ticketId },
      data: { estado: 'fallido', msqError: err.message }
    });
  }
});
