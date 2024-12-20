const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();  // Instancia PrismaClient
const { hashPassword } = require('../middlewares/authMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Config');


exports.register = async (req, res) => {

  const { nombre, apellido, dni, cuil, correo, password, telefono} = req.body;

  if (!dni || !correo || !password) {
    return res.status(400).json({ error: 'DNI, correo y contraseña son requeridos' });
  }

  const existingUser = await prisma.usuario.findFirst({
    where: {
      OR: [{ dni}, { correo }]
    }
  });

  if (existingUser) {
    return res.status(400).json({ error: 'El DNI o el correo ya están registrados' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        dni,
        cuil,
        correo,
        password: hashedPassword,
        telefono
      }
    });

    res.status(201).json({ message: 'Registro exitoso' });
  } catch (creationError) {
    console.error('Error al crear el usuario:', creationError);
    return res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

exports.login = async (req, res) => {
  const { dni, password } = req.body;

  try {

    const user = await prisma.usuario.findUnique({
      where: { dni: dni }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id.toString(), rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    let profilePictureUrl = null;
    if (user.profilePicture) {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: user.profilePicture
      });

      profilePictureUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 3600 
      });
    }

    const userData = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      correo: user.correo,
      dni: user.dni,
      cuil: user.cuil,
      telefono: user.telefono,
      rol: user.rol,
      profilePicture: profilePictureUrl
    };

    return res.json({
      message: 'Login exitoso',
      token: token,
      user: userData
    });

  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};