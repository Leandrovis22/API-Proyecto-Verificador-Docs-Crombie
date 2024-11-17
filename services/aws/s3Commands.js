// API/services/aws/s3Commands.js
const { DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../config/s3Config');
const sharp = require('sharp');

class S3Commands {
  static async deleteObject(bucketName, fileName) {
    const params = { 
      Bucket: bucketName, 
      Key: fileName 
    };
    return await s3Client.send(new DeleteObjectCommand(params));
  }

  static async putObject(bucketName, fileName, body, contentType) {
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: body,
      ContentType: contentType
    };
    return await s3Client.send(new PutObjectCommand(params));
  }

  static async compressImage(buffer) {
    return await sharp(buffer)
      .resize(600)
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}

module.exports = S3Commands;