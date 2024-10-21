const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); 


exports.actualizarUsuario = async (req, res) => {
    try {
        const adminId = 3; // o 3
        const { usuarioId, nombre, apellido, dni, cuil, correo, telefono, rol } = req.body;

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
                apellido: apellido || usuario.apellido,
                dni: dni || usuario.dni,
                cuil: cuil || usuario.cuil,
                correo: correo || usuario.correo,
                telefono: telefono || usuario.telefono,
                rol: rol || usuario.rol,
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


exports.obtenerUsuarios = async (req, res) => {
    try {
        const adminId = 2; // o 3

        const admin = await prisma.usuario.findUnique({
            where: {
                id: adminId
            }
        });

        if (!admin || admin.rol !== "admin") {
            return res.status(403).json({ message: "Acceso denegado" });
        }

        const usuarios = await prisma.usuario.findMany();

        return res.json({
            message: "Usuarios obtenidos correctamente",
            usuarios: usuarios
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Error al obtener los usuarios" });
    }
};
