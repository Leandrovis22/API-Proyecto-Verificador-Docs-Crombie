const { PrismaClient } = require('@prisma/client');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Configura AWS S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const prisma = new PrismaClient();
exports.getTickets = async (req, res) => {
    const { id = 21 } = req.params;
    try {
        const ticket = await prisma.tiqueteria.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                Dni: true
            }
        });

        console.log('Ticket devuelto:', ticket);
        if (!ticket || !ticket.Dni || !ticket.Dni.fotoFrente || !ticket.Dni.fotoDetras) {
            return res.status(404).json({ message: 'Ticket, DNI, o fotos no encontrados' });
        }

        const commandFrente = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: ticket.Dni.fotoFrente
        });
        const signedUrlFrente = await getSignedUrl(s3Client, commandFrente, { expiresIn: 3600 });

      
        const commandDetras = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: ticket.Dni.fotoDetras
        });
        const signedUrlDetras = await getSignedUrl(s3Client, commandDetras, { expiresIn: 3600 });

        return res.json({ fotoFrenteUrl: signedUrlFrente, fotoDetrasUrl: signedUrlDetras });
    } catch (error) {
        console.error('Error devolviendo ticket:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
