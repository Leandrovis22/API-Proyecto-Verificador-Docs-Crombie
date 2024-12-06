const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadMiddleware } = require("../config/multer");
const { ticketUpdateService } = require("../services/ticketUpdateService");

exports.Tiqueteria = async (req, res) => {
    try {
        const usuarioId = parseInt(req.user.id, 10)

        const usuario = await prisma.usuario.findUnique({
            where: {
                id: usuarioId
            }
        });

        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        let tiquets;

        if (usuario.rol === "admin") {
            tiquets = await prisma.tiqueteria.findMany({
                include: {
                    Usuario: true,
                }
            });
        } else if (usuario.rol === "usuario") {
            tiquets = await prisma.tiqueteria.findMany({
                where: {
                    usuarioId: usuarioId
                },
                include: {
                    Usuario: true
                }
            });
        } else {
            return res.status(403).json({ message: "Acceso denegado" });
        }

        if (tiquets.length === 0) {
            return res.status(404).json({ message: "No se encontraron tiquets" });
        }

        const response = tiquets.map(ticket => ({
            id: ticket.id,
            estado: ticket.estado,
            resultado: ticket.resultado,
            fecha: ticket.fecha,
            usuarioId: ticket.usuarioId,
            dni: ticket.Usuario.dni
        }));
        res.json(response);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};



exports.updateTicket = async (req, res) => {
    uploadMiddleware(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ error: "Error en la carga de archivos" });
        }

        try {
            const adminId = parseInt(req.user.id, 10);
            const ticketId = parseInt(req.params.ticketId, 10);

            const admin = await prisma.usuario.findUnique({
                where: { id: adminId }
            });

            if (!admin || admin.rol !== "admin") {
                return res.status(403).json({ message: "Acceso denegado" });
            }

            const ticketActual = await prisma.tiqueteria.findUnique({
                where: { id: ticketId },
                include: {
                    Dni: true,
                    Usuario: true
                }
            });

            if (!ticketActual) {
                return res.status(404).json({ message: "Ticket no encontrado" });
            }

            await prisma.tiqueteria.update({
                where: { id: ticketId },
                data: { estado: "pendiente" }
            });

            setImmediate(async () => {
                try {
                    await ticketUpdateService(ticketId, req);
                } catch (error) {
                    console.error("Background ticket processing error:", error);
                }
            });

            return res.json({
                message: "Datos recibidos, revalidación en progreso",
                ticketId: ticketId
            });

        } catch (error) {
            console.error("Error en updateTicket:", error);
            return res.status(500).json({
                error: "Error al procesar el ticket",
                details: error.message
            });
        }
    });
};


exports.getUserByTicket = async (req, res) => {
    const { ticketId } = req.params; 
  
    try {
      const ticket = await prisma.tiqueteria.findUnique({
        where: { id: parseInt(ticketId, 10) },
        include: {
          Usuario: true 
        }
      });
  
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket no encontrado' });
      }
  
      const user = ticket.Usuario;
  
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado para este ticket' });
      }
  
      return res.json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error al obtener el usuario por ticket' });
    }
  };
  