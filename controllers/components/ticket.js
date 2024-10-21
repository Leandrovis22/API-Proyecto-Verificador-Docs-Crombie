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

exports.getTicket = async (req, res) => {
    const userId = parseInt(req.user.id, 10);

    try {
        // Obtener el ticket con el id más alto para el usuario dado
        const ticket = await prisma.tiqueteria.findFirst({
            where: {
                usuarioId: userId,
            },
            orderBy: {
                id: 'desc', // Ordena por id de manera descendente
            },
            include: {
                Dni: true,
            },
        });

        if (!ticket || !ticket.Dni || !ticket.Dni.fotoFrente) {
            return res.status(404).json({ message: 'Ticket, DNI, o foto no encontrado' });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: ticket.Dni.fotoFrente,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          // Generar las URLs firmadas para las dos imágenes
          const commandFrente = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: ticket.Dni.fotoFrente,
        });
        return res.json({ fotoFrenteUrl: signedUrl });
    } catch (error) {
        console.error('Error devolviendo ticket:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


