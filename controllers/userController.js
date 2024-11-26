const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadProfile } = require('../config/multer');
const { uploadImage, deleteFile } = require('../services/aws/s3Service');
const multer = require('multer');

const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Config');

exports.getUser = async (req, res) => {
  const userId = parseInt(req.user.id, 10)

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        Tiqueterias: {
          include: {
            Dni: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener el usuario' });
  }
};

exports.updateUserImage = async (req, res) => {

  uploadProfile(req, res, async (err) => {

    if (err) {
      if (err instanceof multer.MulterError) {

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'El archivo es demasiado grande' });
        }
        return res.status(400).json({ message: 'Error al subir el archivo' });
      } else if (err) {
        return res.status(400).json({ message: err.message || 'Error desconocido' });
      }
    }

    const userId = parseInt(req.user.id, 10);

    try {

      const profilePictureFile = req.files?.profilePicture?.[0];
      if (!profilePictureFile) {
        return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
      }

      const user = await prisma.usuario.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const fileName = await uploadImage(
        {
          buffer: profilePictureFile.buffer,
          originalname: profilePictureFile.originalname,
          mimetype: profilePictureFile.mimetype
        },
        user.dni,
        'profile/'
      );

      if (user.profilePicture) {
        await deleteFile(user.profilePicture);
      }

      const updatedUser = await prisma.usuario.update({
        where: { id: userId },
        data: { profilePicture: fileName }
      });

      let profilePictureUrl = null;

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName
      });

      profilePictureUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600
      });


      return res.json({
        message: 'Imagen de perfil actualizada exitosamente',
        profilePicture: profilePictureUrl
      });
    } catch (error) {
      console.error('Error al actualizar imagen de perfil:', error);
      return res.status(500).json({ message: 'Error al actualizar la imagen de perfil' });
    }
  });
};

module.exports = exports;