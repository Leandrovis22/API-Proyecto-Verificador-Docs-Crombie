const { PrismaClient } = require('@prisma/client');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const prisma = new PrismaClient();

exports.getImageTicket = async (req, res) => {
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

        if (!ticket || !ticket.Dni || !ticket.Dni.fotoFrente) {
            return res.status(404).json({ message: 'Ticket, DNI, o foto no encontrado' });
        }

        // Generar una URL firmada para la imagen de S3
        const commandFrente = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: ticket.Dni.fotoFrente,
        });

        const signedUrlFrente = await getSignedUrl(s3Client, commandFrente, { expiresIn: 3600 });

        return res.json({ fotoFrenteUrl: signedUrlFrente });
    } catch (error) {
        console.error('Error devolviendo ticket:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};
