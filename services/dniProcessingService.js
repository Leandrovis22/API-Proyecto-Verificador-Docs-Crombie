const { PrismaClient } = require("@prisma/client");
const { analyzeImageWithTextract } = require("./aws/textractUtils");
const { uploadImage } = require("./aws/s3Service");
const { verificarDatos } = require("./verificationUtils");

const prisma = new PrismaClient();

async function processImages(ticketId, usuario, files) {
    try {
        let dniFotoDelanteFileName = null;
        let dniFotoDetrasFileName = null;

        if (files) {
            if (files.dni_foto_delante && files.dni_foto_delante[0]) {
                const fileDelante = files.dni_foto_delante[0];
                dniFotoDelanteFileName = await uploadImage(
                    fileDelante,
                    usuario.dni.toString()
                );
            }

            if (files.dni_foto_detras && files.dni_foto_detras[0]) {
                const fileDetras = files.dni_foto_detras[0];
                dniFotoDetrasFileName = await uploadImage(
                    fileDetras,
                    usuario.dni.toString()
                );
            }
        } else {
            throw new Error("No se encontraron imágenes para procesar");
        }

        let dniFotoDelanteText = "";
        let dniFotoDetrasText = "";

        if (dniFotoDelanteFileName) {
            dniFotoDelanteText = await analyzeImageWithTextract(
                process.env.AWS_BUCKET_NAME,
                dniFotoDelanteFileName
            );
        }

        if (dniFotoDetrasFileName) {
            dniFotoDetrasText = await analyzeImageWithTextract(
                process.env.AWS_BUCKET_NAME,
                dniFotoDetrasFileName
            );
        }

        const resTextract = {
            frente: dniFotoDelanteText,
            detras: dniFotoDetrasText,
        };

        await prisma.dni.create({
            data: {
                fotoFrente: dniFotoDelanteFileName,
                fotoDetras: dniFotoDetrasFileName,
                resTextract: resTextract,
                tiqueteriaId: ticketId,
            },
        });

        const resultadoVerificacion = await verificarDatos(
            dniFotoDelanteText,
            dniFotoDetrasText,
            {
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                dni: usuario.dni.toString(),
                cuil: usuario.cuil,
            }
        );

        await prisma.tiqueteria.update({
            where: { id: ticketId },
            data: {
                estado: resultadoVerificacion.valido ? "completado" : "fallido",
                resultado: resultadoVerificacion,
            },
        });
    } catch (err) {
        console.error("Error en el procesamiento:", err);
        await prisma.tiqueteria.update({
            where: { id: ticketId },
            data: { estado: "fallido", msqError: err.message },
        });
    }
}

module.exports = {
    processImages
};