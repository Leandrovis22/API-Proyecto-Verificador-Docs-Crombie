const { PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const path = require("path");
const s3Client = require("./config/s3");
const { deleteFile, deleteFiles } = require("./s3Utils");

class S3Service {
  async uploadImage(file, dni) {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${dni}-${Date.now()}${fileExtension}`;

    const compressedImageBuffer = await sharp(file.buffer)
      .resize(600)
      .jpeg({ quality: 80 })
      .toBuffer();

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: compressedImageBuffer,
      ContentType: file.mimetype,
    };

    try {
      await s3Client.send(new PutObjectCommand(uploadParams));
      return fileName;
    } catch (err) {
      console.error("Error al subir el archivo a S3:", err);
      throw new Error("Error al subir el archivo a S3");
    }
  }

  async deleteFile(fileName) {
    return await deleteFile(fileName);
  }

  async deleteFiles(bucketName, fileNames) {
    return await deleteFiles(bucketName, fileNames);
  }
}

module.exports = new S3Service();