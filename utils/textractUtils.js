// textractUtils.js
const { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } = require('@aws-sdk/client-textract');

const textractClient = new TextractClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const analyzeImageWithTextract = async (bucketName, fileName) => {
  const startCommand = new StartDocumentTextDetectionCommand({
    DocumentLocation: {
      S3Object: {
        Bucket: bucketName,
        Name: fileName,
      },
    },
  });

  const startResponse = await textractClient.send(startCommand);
  const jobId = startResponse.JobId;

  let status = 'IN_PROGRESS';
  let blocks = [];

  while (status === 'IN_PROGRESS') {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const getResultCommand = new GetDocumentTextDetectionCommand({ JobId: jobId });
    const resultResponse = await textractClient.send(getResultCommand);

    status = resultResponse.JobStatus;
    if (status === 'SUCCEEDED') {
      blocks = resultResponse.Blocks;
    } else if (status === 'FAILED') {
      throw new Error('Text detection failed');
    }
  }

  // Process the blocks to extract text
  const extractTextFromBlocks = (blocks) => {
    let text = '';
    blocks.forEach(block => {
      if (block.BlockType === 'LINE' || block.BlockType === 'WORD') {
        text += block.Text + ' ';
      }
    });
    return text.trim();
  };

  const extractedText = extractTextFromBlocks(blocks);
  return extractedText;
};

module.exports = { analyzeImageWithTextract };
