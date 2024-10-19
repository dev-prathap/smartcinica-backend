const {
  S3,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer");
const { PassThrough } = require("stream");
const File = require("../models/File");
const { NodeHttpHandler } = require("@aws-sdk/node-http-handler");
require("dotenv").config();

// Configure AWS SDK
const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 300000, // Connection timeout (5 minutes)
    socketTimeout: 1200000, // Socket timeout (18 minutes)
    maxSockets: 200,
  }),
});

// Set up multer to store files temporarily in memory (improved version)
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for initial processing
  limits: { fileSize: Infinity }, // No file size limit enforced in multer
});

// Upload file handler using S3 multipart upload for large files
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${Date.now()}-${req.file.originalname}`, // Unique key (filename)
    ContentType: req.file.mimetype,
  };

  let uploadId;

  try {
    // Step 1: Initiate the multipart upload
    const createMultipartUpload = await s3.send(
      new CreateMultipartUploadCommand(params)
    );
    uploadId = createMultipartUpload.UploadId; // Store the UploadId

    const fileSize = req.file.size;
    const partSize = 10 * 1024 * 1024; // 10 MB per part
    const numParts = Math.ceil(fileSize / partSize);
    const uploadPromises = [];

    // Stream each part of the file to S3 to avoid memory overload
    for (let partNumber = 1; partNumber <= numParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, fileSize);

      const bufferStream = new PassThrough(); // Stream file buffer for memory efficiency
      bufferStream.end(req.file.buffer.slice(start, end));

      const partParams = {
        Bucket: params.Bucket,
        Key: params.Key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: bufferStream, // Stream the file part
      };

      // Upload each part concurrently
      const uploadPart = s3.send(new UploadPartCommand(partParams));
      uploadPromises.push(uploadPart);
    }

    // Step 2: Wait for all parts to finish uploading
    const uploadedParts = await Promise.all(uploadPromises);

    // Step 3: Complete the multipart upload
    const completeParams = {
      Bucket: params.Bucket,
      Key: params.Key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: uploadedParts.map((part, index) => ({
          ETag: part.ETag, // Store the ETag for each part
          PartNumber: index + 1, // Part numbers start from 1
        })),
      },
    };

    await s3.send(new CompleteMultipartUploadCommand(completeParams));

    // Step 4: Save the file metadata to MongoDB
    const file = new File({
      filename: req.file.originalname,
      userId: req.user.id,
      path: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`,
      size: req.file.size,
    });

    await file.save();
    res.status(201).json(file); // File uploaded successfully
  } catch (error) {
    console.error("Error during S3 multipart upload:", error);

    // Abort multipart upload in case of failure
    if (uploadId) {
      await s3.send(
        new AbortMultipartUploadCommand({
          Bucket: params.Bucket,
          Key: params.Key,
          UploadId: uploadId,
        })
      );
    }

    res.status(500).json({ message: error.message });
  }
};

// Get files uploaded by the user
const getFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id });
    res.status(200).json(files); // Return the list of files
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Files
const getAllFiles = async (req, res) => {
  try {
    const files = await File.find(); // Get all files from MongoDB
    res.status(200).json(files); // Return the list of files
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a file from S3 and MongoDB
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: file.path.split("/").pop(), // Extract the file key from S3 URL
    };

    await s3.deleteObject(params); // Delete the file from S3
    await File.findByIdAndDelete(req.params.id); // Remove file from MongoDB

    res.status(204).send(); // No content response
  } catch (error) {
    console.error("Failed to delete file from S3:", error);
    res.status(500).json({ message: error.message });
  }
};

// Middleware for file upload
const uploadMiddleware = upload.single("file");

module.exports = {
  uploadFile,
  getFiles,
  deleteFile,
  getAllFiles,
  uploadMiddleware,
};
