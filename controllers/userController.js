const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


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
