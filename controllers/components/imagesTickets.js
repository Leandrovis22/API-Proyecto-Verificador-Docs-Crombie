const { PrismaClient } = require('@prisma/client');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = require('../../config/s3Config');

const prisma = new PrismaClient();

exports.getImagesTicket = async (req, res) => {
    const ticketId = parseInt(req.params.ticketId, 10); 

    try {
        const ticket = await prisma.tiqueteria.findFirst({
            where: {
                id: ticketId,
            },
            include: {
                Dni: true,
            },
        });

        if (!ticket || !ticket.Dni || !ticket.Dni.fotoFrente || !ticket.Dni.fotoDetras) {
            return res.status(404).json({ message: 'Ticket, DNI, o fotos no encontrados' });
        }

        const commandFrente = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: ticket.Dni.fotoFrente,
        });
        const signedUrlFrente = await getSignedUrl(s3Client, commandFrente, { expiresIn: 3600 });

        const commandDetras = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: ticket.Dni.fotoDetras,
        });
        const signedUrlDetras = await getSignedUrl(s3Client, commandDetras, { expiresIn: 3600 });

        return res.json({
            fotoFrenteUrl: signedUrlFrente,
            fotoDetrasUrl: signedUrlDetras,
        });
    } catch (error) {
        console.error('Error devolviendo ticket:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
