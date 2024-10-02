const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient();

exports.Tiqueteria = async (req, res) => {
    try {
        const usuarioId = Number(req.params.usuarioId);
        const id = Number(req.params.id);
        const cantsTiquets = await prisma.tiqueteria.count({
            where: {
                usuarioId: usuarioId
            }
        });
        for(i = 0; i < cantsTiquets; i++){
            const tiquets = await prisma.tiqueteria.findMany({
                where: {
                    usuarioId: usuarioId
                }
            });
            if (tiquets.length === 0) {
                return res.status(404).json({ message: "No se encontraron tiquets para este usuario" });
            }
            const response = {
                cantidad: tiquets.length,
                tiquets: tiquets.map(tiqueteria => ({
                    estado: tiqueteria.estado,
                    resultado: tiqueteria.resultado,
                    fecha: tiqueteria.fecha
                }))
            };
            res.json(response)
        }
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

