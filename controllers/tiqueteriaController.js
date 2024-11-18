const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { uploadMiddleware } = require("../config/multer");
const { deleteFile, uploadImage } = require("../services/aws/s3Service");
const { verificarDatos } = require("../services/verifyService");
const { analyzeImageWithTextract } = require("../services/aws/textractService");

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
                data: {
                    estado: "pendiente"
                }
            });

            let nuevaFotoDelante = ticketActual.Dni?.fotoFrente;
            let nuevaFotoDetras = ticketActual.Dni?.fotoDetras;
            let nuevoResTextract = ticketActual.Dni?.resTextract;

            if (req.files) {

                if (req.files.dni_foto_delante && req.files.dni_foto_delante[0]) {

                    if (ticketActual.Dni?.fotoFrente) {
                        await deleteFile(ticketActual.Dni.fotoFrente);
                    }

                    nuevaFotoDelante = await uploadImage(
                        req.files.dni_foto_delante[0],
                        ticketActual.Usuario.dni
                    );
                }

                if (req.files.dni_foto_detras && req.files.dni_foto_detras[0]) {

                    if (ticketActual.Dni?.fotoDetras) {
                        await deleteFile(ticketActual.Dni.fotoDetras);
                    }

                    nuevaFotoDetras = await uploadImage(
                        req.files.dni_foto_detras[0],
                        ticketActual.Usuario.dni
                    );
                }


                let dniFotoDelanteText = nuevoResTextract?.frente || "";
                let dniFotoDetrasText = nuevoResTextract?.detras || "";

                if (req.files.dni_foto_delante) {
                    dniFotoDelanteText = await analyzeImageWithTextract(
                        process.env.AWS_BUCKET_NAME,
                        nuevaFotoDelante
                    );
                }

                if (req.files.dni_foto_detras) {
                    dniFotoDetrasText = await analyzeImageWithTextract(
                        process.env.AWS_BUCKET_NAME,
                        nuevaFotoDetras
                    );
                }

                nuevoResTextract = {
                    frente: dniFotoDelanteText,
                    detras: dniFotoDetrasText
                };
            }


            const datosUsuario = {};
            const camposUsuario = ['nombre', 'apellido', 'dni', 'cuil', 'correo', 'telefono'];
            camposUsuario.forEach(campo => {
                if (req.body[campo]) {
                    datosUsuario[campo] = req.body[campo];
                }
            });

            if (Object.keys(datosUsuario).length > 0) {
                await prisma.usuario.update({
                    where: { id: ticketActual.usuarioId },
                    data: datosUsuario
                });
            }


            if (ticketActual.Dni) {
                await prisma.dni.update({
                    where: { tiqueteriaId: ticketId },
                    data: {
                        fotoFrente: nuevaFotoDelante,
                        fotoDetras: nuevaFotoDetras,
                        resTextract: nuevoResTextract
                    }
                });
            } else if (nuevaFotoDelante || nuevaFotoDetras) {
                await prisma.dni.create({
                    data: {
                        fotoFrente: nuevaFotoDelante,
                        fotoDetras: nuevaFotoDetras,
                        resTextract: nuevoResTextract,
                        tiqueteriaId: ticketId
                    }
                });
            }

            const usuarioActualizado = await prisma.usuario.findUnique({
                where: { id: ticketActual.usuarioId }
            });

            const resultadoVerificacion = await verificarDatos(
                nuevoResTextract.frente,
                nuevoResTextract.detras,
                {
                    nombre: usuarioActualizado.nombre,
                    apellido: usuarioActualizado.apellido,
                    dni: usuarioActualizado.dni.toString(),
                    cuil: usuarioActualizado.cuil
                }
            );

            const ticketActualizado = await prisma.tiqueteria.update({
                where: { id: ticketId },
                data: {
                    estado: resultadoVerificacion.valido ? "completado" : "fallido",
                    resultado: resultadoVerificacion,
                    msqError: null
                }
            });

            return res.json({
                message: "Ticket actualizado correctamente",
                ticket: ticketActualizado
            });

        } catch (error) {
            console.error("Error en updateTicket:", error);

            await prisma.tiqueteria.update({
                where: { id: ticketId },
                data: { estado: "fallido", msqError: error.message },
            });

            return res.status(500).json({
                error: "Error al actualizar el ticket",
                details: error.message
            });
        }
    });
};


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
