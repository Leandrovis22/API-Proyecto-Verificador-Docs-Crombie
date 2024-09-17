// utils/dniUtils.js

const { uploadToS3 } = require('./s3Utils');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function processDNI(req) {
  const { tiqueteriaId } = req.body;
  
  let dniFotoDelanteFileName = null;
  let dniFotoDetrasFileName = null;

  if (req.files) {
    if (req.files['dni_foto_delante'] && req.files['dni_foto_delante'][0]) {
      const fileDelante = req.files['dni_foto_delante'][0];
      dniFotoDelanteFileName = await uploadToS3(fileDelante, tiqueteriaId);
    }

    if (req.files['dni_foto_detras'] && req.files['dni_foto_detras'][0]) {
      const fileDetras = req.files['dni_foto_detras'][0];
      dniFotoDetrasFileName = await uploadToS3(fileDetras, tiqueteriaId);
    }
  } else {
    throw new Error('No se encontraron imágenes para procesar');
  }

  const nuevoDni = await prisma.dni.create({
    data: {
      fotoFrente: dniFotoDelanteFileName,
      fotoDetras: dniFotoDetrasFileName,
      tiqueteriaId: parseInt(tiqueteriaId)
    }
  });

  return nuevoDni;
}

module.exports = { processDNI };
