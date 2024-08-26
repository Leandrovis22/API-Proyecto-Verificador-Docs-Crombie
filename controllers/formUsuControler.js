
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const { deleteFiles } = require('../utils/s3Utils');
const { analyzeImageWithTextract } = require('../utils/textractUtils');
const { verificarDatos } = require('../utils/verificationUtils');

const { PrismaClient } = require('@prisma/client');
const prismaClient = new PrismaClient();

// Configura AWS S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Función para subir un archivo a S3
const uploadToS3 = async (file, dni) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${dni}-${Date.now()}${fileExtension}`;
    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        return fileName;
    } catch (err) {
        console.error('Error al subir el archivo a S3:', err);
        throw new Error('Error al subir el archivo a S3');
    }
};


exports.formUsuario = async (req, res) => {
    try {
        const userId = req.user.id; // Suponiendo que usas JWT para autenticar y obtener el ID del usuario
        let dniFotoDelanteFileName = null;
        let dniFotoDetrasFileName = null;

        // Subir imágenes a S3
        if (req.files['dni_foto_delante'] && req.files['dni_foto_delante'][0]) {
            const file = req.files['dni_foto_delante'][0];
            dniFotoDelanteFileName = await uploadToS3(file, userId);
        }

        if (req.files['dni_foto_detras'] && req.files['dni_foto_detras'][0]) {
            const file = req.files['dni_foto_detras'][0];
            dniFotoDetrasFileName = await uploadToS3(file, userId);
        }

        let dniFotoDelanteText = '';
        let dniFotoDetrasText = '';

        // Enviar imágenes a Textract y obtener el texto
        if (dniFotoDelanteFileName) {
            dniFotoDelanteText = await analyzeImageWithTextract(process.env.AWS_BUCKET_NAME, dniFotoDelanteFileName);
        }

        if (dniFotoDetrasFileName) {
            dniFotoDetrasText = await analyzeImageWithTextract(process.env.AWS_BUCKET_NAME, dniFotoDetrasFileName);
        }

        // Verificar los datos extraídos
        const user = await prismaClient.usuarios.findUnique({
            where: { id: parseInt(userId) }
        });

        const verificationResult = await verificarDatos(
            dniFotoDelanteText,
            dniFotoDetrasText,
            {
                nombre: user.nombre,
                dni: user.dni,
                cuil: user.cuil,
                fecha_nacimiento: user.fecha_nacimiento
            }
        );

        if (!verificationResult.success) {
            await deleteFiles(process.env.AWS_BUCKET_NAME, [dniFotoDelanteFileName, dniFotoDetrasFileName]);
            return res.status(400).json({ error: verificationResult.error });
        }

        // Actualizar el usuario con las imágenes y el texto extraído
        await prismaClient.usuarios.update({
            where: { id: parseInt(userId) },
            data: {
                dni_foto_delante: dniFotoDelanteFileName,
                dni_foto_detras: dniFotoDetrasFileName,
                textextract: {
                    frente: dniFotoDelanteText,
                    detras: dniFotoDetrasText
                }
            }
        });
        


        res.status(200).json({ message: 'Verificación exitosa' });
    } catch (error) {
        console.error('Error en formUsuario:', error);
        res.status(500).json({ error: 'Error en el procesamiento del formulario' });
    }
};
