const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const prisma = require('../config/prisma');
const path = require('path');
const { deleteFile, deleteFiles } = require('../utils/s3Utils');

// Configuración de Multer para manejar archivos
const storage = multer.memoryStorage();  // Guardar en memoria para luego subir a S3
const upload = multer({ storage });

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

// Controlador para crear un nuevo formulario con hasta 3 dniform
exports.createForm = [
  upload.fields([
    { name: 'dni_foto_delante_1', maxCount: 1 },
    { name: 'dni_foto_detras_1', maxCount: 1 },
    { name: 'dni_foto_delante_2', maxCount: 1 },
    { name: 'dni_foto_detras_2', maxCount: 1 },
    { name: 'dni_foto_delante_3', maxCount: 1 },
    { name: 'dni_foto_detras_3', maxCount: 1 },
  ]),
  async (req, res) => {
    const { dniform } = req.body; // Arreglo de datos para dniform

    if (!dniform || dniform.length === 0 || dniform.length > 3) {
      return res.status(400).json({ error: 'Debe enviar entre 1 y 3 dniform' });
    }

    const id_usuario = req.user.id; // ID del usuario autenticado
    let forms = [];

    try {
      // Iterar sobre los dniform enviados
      for (let i = 0; i < dniform.length; i++) {
        const form = dniform[i];
        const { dni_form, cuil, nombre, fecha_nacimiento, correo } = form;

        // Subir las imágenes a S3
        let dniFotoDelanteFileName = null;
        let dniFotoDetrasFileName = null;

        if (req.files[`dni_foto_delante_${i + 1}`] && req.files[`dni_foto_delante_${i + 1}`][0]) {
          const file = req.files[`dni_foto_delante_${i + 1}`][0];
          dniFotoDelanteFileName = await uploadToS3(file, 'dni_foto_delante', dni_form);
        }

        if (req.files[`dni_foto_detras_${i + 1}`] && req.files[`dni_foto_detras_${i + 1}`][0]) {
          const file = req.files[`dni_foto_detras_${i + 1}`][0];
          dniFotoDetrasFileName = await uploadToS3(file, 'dni_foto_detras', dni_form);
        }

        // Crear el registro en la tabla dniform
        const newForm = await prismaClient.dniform.create({
          data: {
            dni_form: BigInt(dni_form),
            cuil,
            nombre,
            fecha_nacimiento,
            correo,
            dni_foto_delante: dniFotoDelanteFileName,
            dni_foto_detras: dniFotoDetrasFileName,
            id_usuario: id_usuario
          }
        });

        forms.push(newForm);
      }

      res.status(201).json({ message: 'Formularios creados exitosamente', forms });
    } catch (error) {
      console.error('Error al crear los formularios:', error);
      res.status(500).json({ error: 'Error al crear los formularios' });
    }
  }
];
