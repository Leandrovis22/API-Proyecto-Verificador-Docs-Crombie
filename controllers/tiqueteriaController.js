const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.Tiqueteria = async (req, res) => {
    try {
        //cambiar por los parametros de la web para obtener 
        const usuarioId = 17
        const cantsTiquets = await prisma.tiqueteria.count({
            where: {
                usuarioId: usuarioId
            }
        });
        const tiquets = await prisma.tiqueteria.findMany({
            where: {
                usuarioId: usuarioId
            }
        });
        if (tiquets.length === 0) {
            return res.status(404).json({ message: "No se encontraron tiquets para este usuario" });
        }
        const response = {
            cantidad: cantsTiquets,
            tiquets: tiquets.map(tiqueteria => ({
                estado: tiqueteria.estado,
                resultado: tiqueteria.msqError,
                fecha: tiqueteria.fecha
            }))
        };
        res.json(response);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};