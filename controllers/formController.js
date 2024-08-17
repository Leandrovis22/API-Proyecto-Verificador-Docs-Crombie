const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const prisma = require('../config/prisma');
const path = require('path');
const { deleteFile, deleteFiles } = require('../utils/s3Utils');


// Configuración de AWS S3
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Configuración de Multer para manejar archivos
const storage = multer.memoryStorage();  // Guardar en memoria para luego subir a S3
const upload = multer({ storage });

// Controlador para createForm
exports.createForm = [
  upload.single('documento'),  // Espera un archivo con el campo 'documento'
  async (req, res) => {
    const { dni_ref, nombre, cuil, json_dni } = req.body;
    const id_login = req.user.id;  // Extraer id del token JWT
    const file = req.file;

    try {
      // Subir el archivo a S3
      const fileExtension = path.extname(file.originalname); // Obtener la extensión del archivo
      const fileName = `${id_login}-${Date.now()}${fileExtension}`;  // Nombre único para el archivo

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Guardar los datos del formulario y el nombre del archivo en la base de datos
      const newForm = await prisma.form.create({
        data: {
          dni_ref,
          nombre,
          cuil,
          json_dni: JSON.parse(json_dni),
          id_login,
          documento: fileName,  // Guardar solo el nombre del archivo en la base de datos
        }
      });

      res.status(201).json({ message: 'Formulario creado con éxito', form: newForm });
    } catch (error) {
      console.error('Error en createForm:', error);
      res.status(500).json({ error: 'Error al crear el formulario' });
    }
  }
];

exports.getForms = async (req, res) => {
  const userId = req.user.id;  // Extraer id del token JWT

  try {
    // Obtener todos los formularios del usuario
    const forms = await prisma.form.findMany({
      where: { id_login: userId }
    });

    if (forms.length === 0) {
      return res.status(404).json({ error: 'No se encontraron formularios para este usuario' });
    }

    // Obtener los enlaces firmados para cada documento
    const formsWithLinks = await Promise.all(forms.map(async (form) => {
      const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: form.documento
      }), { expiresIn: 3600 });  // URL válida por una hora

      return {
        ...form,
        documentoUrl: signedUrl
      };
    }));

    res.json(formsWithLinks);
  } catch (error) {
    console.error('Error al obtener los formularios:', error);
    res.status(500).json({ error: 'Error al obtener los formularios' });
  }
};

exports.updateForm = [
  upload.single('documento'),  // Opcionalmente, permite actualizar el archivo
  async (req, res) => {
    const { id } = req.params;
    const { dni_ref, nombre, cuil, json_dni } = req.body;
    const userId = req.user.id;  // Obtener el id del usuario autenticado del token JWT
    const file = req.file;

    try {
      // Buscar el formulario existente
      const form = await prisma.form.findUnique({
        where: { id: parseInt(id) }
      });

      // Verificar si el formulario existe
      if (!form) {
        return res.status(404).json({ error: 'Formulario no encontrado' });
      }

      // Verificar si el formulario pertenece al usuario autenticado
      if (form.id_login !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para actualizar este formulario' });
      }

      // Si se envía un archivo, se sube a S3 y se actualiza el nombre
      let updatedFileName = form.documento;  // Mantener el archivo actual si no se sube uno nuevo

      if (file) {
        const fileExtension = path.extname(file.originalname); // Obtener la extensión del archivo
        updatedFileName = `${userId}-${Date.now()}${fileExtension}`;  // Nuevo nombre de archivo

        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: updatedFileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        // Eliminar el archivo anterior de S3
        if (form.documento) {
          await deleteFile(form.documento);
        }
      }

      // Actualizar el formulario en la base de datos
      const updatedForm = await prisma.form.update({
        where: { id: parseInt(id) },
        data: {
          dni_ref: dni_ref || form.dni_ref,  // Mantener el valor anterior si no se actualiza
          nombre: nombre || form.nombre,
          cuil: cuil || form.cuil,
          json_dni: json_dni ? JSON.parse(json_dni) : form.json_dni,
          documento: updatedFileName
        }
      });

      res.json({ message: 'Formulario actualizado con éxito', form: updatedForm });
    } catch (error) {
      console.error('Error al actualizar el formulario:', error);
      res.status(500).json({ error: 'Error al actualizar el formulario' });
    }
  }
];


exports.getSignedUrl = async (req, res) => {
  const { fileName } = req.params;  // Recibir el nombre del archivo como parámetro

  try {
    const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName
    }), { expiresIn: 3600 });  // URL válida por una hora

    res.json({ signedUrl });
  } catch (error) {
    console.error('Error al generar la URL firmada:', error);
    res.status(500).json({ error: 'Error al generar la URL firmada' });
  }
};


// Controlador para eliminar un formulario por ID
exports.deleteForm = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;  // Obtener el id del usuario del token JWT

  try {
    // Buscar el formulario a eliminar
    const form = await prisma.form.findUnique({
      where: { id: parseInt(id) }
    });

    // Verificar si el formulario existe
    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    // Verificar si el formulario pertenece al usuario autenticado
    if (form.id_login !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este formulario' });
    }

    // Eliminar el archivo asociado de S3
    await deleteFile(form.documento);

    // Eliminar el formulario de la base de datos
    await prisma.form.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Formulario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar formulario:', error);
    res.status(500).json({ error: 'Error al eliminar formulario' });
  }
};


// Controlador para eliminar todos los formularios de un usuario
exports.deleteFormsByUser = async (req, res) => {
  // Obtener el userId del token
  const userId = req.user.id;

  try {
    // Buscar todos los formularios del usuario
    const forms = await prisma.form.findMany({
      where: { id_login: parseInt(userId) }
    });

    if (forms.length === 0) {
      return res.status(404).json({ error: 'No se encontraron formularios para este usuario' });
    }

    // Obtener los nombres de los archivos
    const fileNames = forms.map(form => form.documento);

    // Eliminar todos los archivos asociados de S3
    await deleteFiles(fileNames);

    // Eliminar todos los formularios del usuario de la base de datos
    await prisma.form.deleteMany({
      where: { id_login: parseInt(userId) }
    });

    res.json({ message: 'Todos los formularios del usuario han sido eliminados correctamente' });
  } catch (error) {
    console.error('Error al eliminar formularios de usuario:', error);
    res.status(500).json({ error: 'Error al eliminar formularios de usuario' });
  }
};