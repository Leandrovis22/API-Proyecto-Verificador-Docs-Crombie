const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { deleteFiles } = require('../utils/s3Utils');

const JWT_SECRET = process.env.JWT_SECRET;


// Login de usuario
exports.login = async (req, res) => {
  const { dni, pass } = req.body;

  try {
    // Buscar usuario por DNI
    const user = await prisma.login.findUnique({
      where: { dni: dni }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(pass, user.pass);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    const token = jwt.sign({ id: user.id, dni: user.dni }, JWT_SECRET, { expiresIn: '1h' });

    // Respuesta con los datos del usuario y el token
    res.json({
      message: 'Login exitoso',
      token: token
    });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error en el login' });
  }
};

// Registro de usuario
exports.register = async (req, res) => {
  const { dni, correo, nombre, pass } = req.body;

  try {
    // Verificar si ya existe el dni o el correo
    const existingUser = await prisma.login.findFirst({
      where: {
        OR: [{ dni }, { correo }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El DNI o el correo ya están registrados' });
    }

    // Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(pass, 10);

    // Crear nuevo usuario
    const newLogin = await prisma.login.create({
      data: { dni, correo, nombre, pass: hashedPassword }
    });

    // Crear token JWT
    const token = jwt.sign({ id: newLogin.id, dni: newLogin.dni }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'Registro exitoso', token });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Controlador para actualizar los datos del usuario (dni, correo, nombre y contraseña)
exports.updateLogin = async (req, res) => {
  const userId = req.user.id; // ID del usuario extraído del token JWT
  const { dni, correo, nombre, pass } = req.body; // Nuevos valores a actualizar

  try {
    // Verificar si el dni ya está en uso por otro usuario
    if (dni) {
      const existingDniUser = await prisma.login.findFirst({
        where: {
          dni,
          id: { not: parseInt(userId) }, // Excluir al usuario actual
        },
      });

      if (existingDniUser) {
        return res.status(400).json({ error: 'El DNI ya está registrado por otro usuario' });
      }
    }

    // Verificar si el correo ya está en uso por otro usuario
    if (correo) {
      const existingEmailUser = await prisma.login.findFirst({
        where: {
          correo,
          id: { not: parseInt(userId) }, // Excluir al usuario actual
        },
      });

      if (existingEmailUser) {
        return res.status(400).json({ error: 'El correo ya está registrado por otro usuario' });
      }
    }

    // Crear un objeto con los campos a actualizar
    const updatedData = {};

    if (dni) updatedData.dni = dni;
    if (correo) updatedData.correo = correo;
    if (nombre) updatedData.nombre = nombre;
    if (pass) {
      const hashedPassword = await bcrypt.hash(pass, 10); // Hashear la nueva contraseña
      updatedData.pass = hashedPassword;
    }

    // Actualizar los datos del usuario en la base de datos
    const updatedLogin = await prisma.login.update({
      where: { id: parseInt(userId) },
      data: updatedData,
    });

    res.json({
      message: 'Datos actualizados correctamente',
      login: updatedLogin,
    });
  } catch (error) {
    console.error('Error al actualizar los datos del usuario:', error);
    res.status(500).json({ error: 'Error al actualizar los datos del usuario' });
  }
};


// Controlador para eliminar un usuario
exports.deleteLogin = async (req, res) => {
  const userId = req.user.id; // Extraído del token JWT

  try {
    // Verificar si el usuario existe
    const user = await prisma.login.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener todos los formularios del usuario
    const forms = await prisma.form.findMany({
      where: { id_login: parseInt(userId) }
    });

    // Obtener los nombres de los archivos
    const fileNames = forms.map(form => form.documento);

    // Eliminar todos los archivos asociados de S3
    await deleteFiles(fileNames);

    // Eliminar el usuario, se deberia eliminar sus form tambien
    await prisma.login.delete({
      where: { id: parseInt(userId) }
    });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// Obtener todos los usuarios con sus formularios asociados
exports.getLogins = async (req, res) => {
  try {
    const logins = await prisma.login.findMany({
      include: {
        Form: true,  // Incluir los forms asociados a cada login
      },
    });
    res.json(logins);
  } catch (error) {
    console.error('Error al obtener logins:', error);
    res.status(500).json({ error: 'Error al obtener logins' });
  }
};
