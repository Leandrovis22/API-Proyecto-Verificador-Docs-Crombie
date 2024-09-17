const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.processDNI = upload.fields([
  { name: 'dni_foto_delante', maxCount: 1 },
  { name: 'dni_foto_detras', maxCount: 1 }
])(async (req, res, next) => {
  try {
    const { nombre, dni, cuil, fecha_nacimiento, tiqueteriaId } = req.body;

    if (!dni || !nombre || !cuil || !fecha_nacimiento) {
      return res.status(400).json({ error: 'Faltan datos requeridos en el registro' });
    }

    let dniFotoDelanteFileName = null;
    let dniFotoDetrasFileName = null;

    if (req.files) {
      if (req.files['dni_foto_delante'] && req.files['dni_foto_delante'][0]) {
        const fileDelante = req.files['dni_foto_delante'][0];
        dniFotoDelanteFileName = await uploadToS3(fileDelante, dni);
      }

      if (req.files['dni_foto_detras'] && req.files['dni_foto_detras'][0]) {
        const fileDetras = req.files['dni_foto_detras'][0];
        dniFotoDetrasFileName = await uploadToS3(fileDetras, dni);
      }
    } else {
      return res.status(400).json({ error: 'No se encontraron imágenes para procesar' });
    }

    let dniFotoDelanteText = '';
    let dniFotoDetrasText = '';

    if (dniFotoDelanteFileName) {
      dniFotoDelanteText = await analyzeImageWithTextract(process.env.AWS_BUCKET_NAME, dniFotoDelanteFileName);
    }

    if (dniFotoDetrasFileName) {
      dniFotoDetrasText = await analyzeImageWithTextract(process.env.AWS_BUCKET_NAME, dniFotoDetrasFileName);
    }

    const verificationResult = await verificarDatos(
      dniFotoDelanteText,
      dniFotoDetrasText,
      { nombre, dni, cuil, fecha_nacimiento }
    );

    if (!verificationResult.success) {
      return res.status(400).json({ error: verificationResult.error });
    }

    // Guardar las fotos y la respuesta de Textract en la base de datos
    const nuevoDni = await prisma.dni.create({
      data: {
        fotoFrente: dniFotoDelanteFileName,
        fotoDetras: dniFotoDetrasFileName,
        resTextract: verificationResult.datos, 
        tiqueteriaId: parseInt(tiqueteriaId) 
      }
    });

    res.status(200).json({ message: 'Verificación exitosa', dni: nuevoDni });

  } catch (err) {
    console.error('Error en el proceso:', err);
    return res.status(500).json({ error: 'Error en el proceso de verificación' });
  }
});
