const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.checkData = async (req, res) => {
  try {
    // Obtener el ID del usuario (ya sea desde el cuerpo de la solicitud o del token de autenticación)
    //const userId = parseInt(req.body.userId, 10);

    const userId = parseInt(req.user.id, 10);

    // Buscar el último ticket del usuario
    const ultimoTicket = await prisma.tiqueteria.findFirst({
      where: {
        usuarioId: userId,
      },
      orderBy: {
        id: "desc",
      },
    });

    // Si no se encuentra ningún ticket, devolver un mensaje de error
    if (!ultimoTicket) {
      return res
        .status(404)
        .json({ message: "No se encontraron tickets para este usuario" });
    }

    // Devolver el resultado JSON del último ticket
    return res.status(200).json({
      estado: ultimoTicket.estado,
      resultado: ultimoTicket.resultado,
      id: ultimoTicket.id,
    });
  } catch (error) {
    console.error("Error al obtener los datos del ticket:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener los datos del ticket" });
  }
};
