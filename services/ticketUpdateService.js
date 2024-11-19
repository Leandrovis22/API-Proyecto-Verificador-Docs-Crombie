const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { deleteFile, uploadImage } = require("../services/aws/s3Service");
const { verificarDatos } = require("../services/verifyService");
const { analyzeImageWithTextract } = require("../services/aws/textractService");

async function ticketUpdateService(ticketId, req) {
    try {
        const ticketActual = await prisma.tiqueteria.findUnique({
            where: { id: ticketId },
            include: {
                Dni: true,
                Usuario: true
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

        await prisma.tiqueteria.update({
            where: { id: ticketId },
            data: {
                estado: resultadoVerificacion.valido ? "completado" : "fallido",
                resultado: resultadoVerificacion,
                msqError: null
            }
        });

    } catch (error) {
        console.error("Error en processTicketVerification:", error);

        await prisma.tiqueteria.update({
            where: { id: ticketId },
            data: { 
                estado: "fallido", 
                msqError: error.message 
            },
        });
    }
}

module.exports = { ticketUpdateService };