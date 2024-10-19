// controllers/fileController.js
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const File = require("../models/File");
require("dotenv").config();

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Generate pre-signed URL
const getUploadURL = async (req, res) => {
  const { fileName, fileType } = req.query;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    ContentType: fileType,
  };

  try {
    // Create a new PutObjectCommand instance
    const command = new PutObjectCommand(params);

    // Get the pre-signed URL
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });

    res.status(200).json({ url });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ message: "Error generating pre-signed URL" });
  }
};

const saveFile = async (req, res) => {
  // Log incoming request body for debugging
  console.log("Incoming request body:", req.body);

  // Destructure necessary properties from the request body
  const { filename, path, size, folderId } = req.body; // Ensure you include size and optional folderId

  // Check for required fields
  if (!filename || !path || !size) {
    return res
      .status(400)
      .json({ message: "Filename, path, and size are required." });
  }

  // Assuming user authentication middleware is implemented and user ID is available in req.user
  const userId = req.user?.id;
  if (!userId) {
    return res.status(403).json({ message: "User not authenticated." });
  }

  // Create a new file instance
  const newFile = new File({
    filename,
    path,
    size,
    folderId, // Optional
    userId,
  });

  try {
    const savedFile = await newFile.save(); // Save the document
    res.status(201).json(savedFile); // Respond with the saved file
  } catch (error) {
    console.error("Error saving file:", error);
    res
      .status(500)
      .json({ message: "Error saving file", error: error.message });
  }
};

// Get all files from S3 bucket
const getAllFilesFromBucket = async (req, res) => {
  const bucketName = process.env.S3_BUCKET_NAME; // Set your bucket name in .env file

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    const response = await s3.send(command);

    // Check if the response contains contents
    if (response.Contents) {
      const files = await Promise.all(
        response.Contents.map(async (file) => {
          // Get the file's content type using HeadObjectCommand
          const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: file.Key,
          });
          const headResponse = await s3.send(headCommand);

          return {
            key: file.Key,
            lastModified: file.LastModified,
            size: file.Size,
            etag: file.ETag,
            contentType: headResponse.ContentType, // Add the content type
            filename: file.Key.split("/").pop(), // Extract the filename from the key
          };
        })
      );

      res.status(200).json(files);
    } else {
      res.status(404).json({ message: "No files found." });
    }
  } catch (error) {
    console.error("Error retrieving files:", error);
    res
      .status(500)
      .json({ message: "Error retrieving files", error: error.message });
  }
};
// Get All Files
const getFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id });
    res.status(200).json(files);
  } catch (error) {
    console.error("Error getting files:", error);
    res.status(500).json({ message: "Error getting files" });
  }
};

module.exports = { getUploadURL, saveFile, getFiles, getAllFilesFromBucket };
