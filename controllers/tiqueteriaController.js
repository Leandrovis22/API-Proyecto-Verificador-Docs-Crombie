const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
            // Si es admin traer todos los tiquets junto con la información del usuario (incluyendo el DNI
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
            resultado: ticket.msqError,
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
