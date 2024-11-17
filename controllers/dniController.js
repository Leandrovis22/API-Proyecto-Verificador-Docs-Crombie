// controllers/dniController.js

const { PrismaClient } = require("@prisma/client");
const { uploadMiddleware } = require("../config/multer");
const { processImages } = require("../services/dniProcessingService");

const prisma = new PrismaClient();

exports.processDNI = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Error en la carga de archivos" });
    }

    try {
      const userId = parseInt(req.user.id, 10);

      const usuario = await prisma.usuario.findUnique({
        where: {
          id: userId,
        },
      });

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const inProcessTicket = await prisma.tiqueteria.findFirst({
        where: {
          usuarioId: usuario.id,
          estado: {
            in: ["pendiente"],
          },
        },
      });

      if (inProcessTicket) {
        return res.status(400).json({
          error: "Ya existe un ticket en curso para este usuario. Espera a que finalice.",
        });
      }

      const ticket = await prisma.tiqueteria.create({
        data: {
          usuarioId: usuario.id,
          estado: "pendiente",
        },
      });

      console.log(ticket.id, usuario, req.files);

      setImmediate(() => processImages(ticket.id, usuario, req.files));

      res.status(200).json({ message: "Ticket creado y en proceso" });
    } catch (err) {
      console.error("Error en el proceso:", err);
      res
        .status(500)
        .json({ error: "Error en el proceso de creación del ticket" });
    }
  });
};