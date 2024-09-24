const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();  // Instancia PrismaClient
const { hashPassword } = require('../middlewares/authMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register 
exports.register = async (req, res) => {

  const { nombre,apellido, dni, cuil, correo, password, telefono} = req.body;

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

  const existingUser = await prisma.usuario.findFirst({
    where: {
      OR: [{ dni: dniInt }, { correo }]
    }
  });

  if (existingUser) {
    return res.status(400).json({ error: 'El DNI o el correo ya están registrados' });
  }

  try {
    const hashedPassword = await hashPassword(password);  // Asegúrate de que esta función devuelva el hash
    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        dni: dniInt,
        cuil,
        correo,
        password: hashedPassword,  // Usar el password hasheado
        telefono: telefonoInt
      }
    });

    res.status(201).json({ message: 'Registro exitoso' });
  } catch (creationError) {
    console.error('Error al crear el usuario:', creationError);
    return res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

// Controlador para el login
exports.login = async (req, res) => {
  const { dni, password } = req.body;

  try {
    const user = await prisma.usuario.findUnique({
      where: { dni: BigInt(dni) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id.toString(), dni: user.dni.toString() },  // Usar `user` aquí
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    res.json({
      message: 'Login exitoso',
      token: token
    });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error en el login' });
  }
};
