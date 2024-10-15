const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.actualizarUsuario = async (req, res) => {
    try {
        const adminId = 2; //o 3.
        const { usuarioId, nombre, email, fotos } = req.body; 
        const admin = await prisma.usuario.findUnique({
            where: {
                id: adminId
            }
        });
        if (!admin || admin.rol !== "admin") {
            return res.status(403).json({ message: "Acceso denegado" });
        }

        
        const usuario = await prisma.usuario.findUnique({
            where: {
                id: usuarioId
            }
        });

        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        const usuarioActualizado = await prisma.usuario.update({
            where: {
                id: usuarioId
            },
            data: {
                nombre: nombre || usuario.nombre, 
                email: email || usuario.email,
                fotos: fotos || usuario.fotos 
            }
        });
        return res.json({
            message: "Usuario actualizado correctamente",
            usuario: usuarioActualizado
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Error al actualizar el usuario" });
    }
};
