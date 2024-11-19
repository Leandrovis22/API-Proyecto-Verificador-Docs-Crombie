const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.checkData = async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);

    const ultimoTicket = await prisma.tiqueteria.findFirst({
      where: {
        usuarioId: userId,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!ultimoTicket) {
      return res
        .status(404)
        .json({ message: "No se encontraron tickets para este usuario" });
    }

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
