// /controller/dniController.js

const { PrismaClient } = require('@prisma/client');
const { analyzeImageWithTextract } = require('../utils/textractUtils');
const { verificarDatos } = require('../utils/verificationUtils');
const { uploadToS3 } = require('../utils/s3Utils'); // Suponiendo que tienes esta función en utils
const multer = require('multer');
const Queue = require('bull'); // Ejemplo usando Bull para una cola de trabajo

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });
const processingQueue = new Queue('dni-processing'); // Crear una cola para procesamiento de imágenes

exports.processDNI = upload.fields([
  { name: 'dni_foto_delante', maxCount: 1 },
  { name: 'dni_foto_detras', maxCount: 1 }
])(async (req, res, next) => {
  try {
    // Obtener el ID del usuario del token
    const userId = req.user.id;

    // Buscar los datos del usuario en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: userId,
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Crear el ticket en la tabla Tiqueteria
    const ticket = await prisma.tiqueteria.create({
      data: {
        usuarioId: usuario.id,
        estado: 'pendiente'
      }
    });

    // Enviar el trabajo a la cola para procesamiento
    processingQueue.add({
      ticketId: ticket.id,
      userId: usuario.id,
      files: req.files,
      bucketName: process.env.AWS_BUCKET_NAME
    });

    // Responder inmediatamente
    res.status(200).json({ message: 'Ticket creado y en proceso' });

  } catch (err) {
    console.error('Error en el proceso:', err);
    res.status(500).json({ error: 'Error en el proceso de creación del ticket' });
  }
});

// Trabajador de la cola para procesar imágenes y verificar datos
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
