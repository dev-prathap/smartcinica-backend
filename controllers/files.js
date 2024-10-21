const { s3 } = require("../config/AWS");

// Start Multipart Upload
const startUpload = async (req, res) => {
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: "fileName and fileType are required" });
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName, // This will be the file name in S3
    ContentType: fileType, // File type, e.g., 'image/jpeg'
  };

  try {
    const upload = await s3.createMultipartUpload(params).promise();
    res.json({ uploadId: upload.UploadId });
  } catch (err) {
    console.error("Error initiating multipart upload:", err);
    res.status(500).json({ error: "Error initiating multipart upload" });
  }
};

// Get Signed URL for Each Part
const getUploadUrl = async (req, res) => {
  const { uploadId, fileName, partNumber } = req.body;

  if (!uploadId || !fileName || !partNumber) {
    return res.status(400).json({ error: "uploadId, fileName, and partNumber are required" });
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    PartNumber: partNumber, // Part number for this chunk
    UploadId: uploadId, // UploadId from the multipart upload initiation
    Expires: 60 * 5, // URL expires in 5 minutes
  };

  try {
    const signedUrl = await s3.getSignedUrlPromise("uploadPart", params);
    res.json({ signedUrl });
  } catch (err) {
    console.error("Error getting signed URL:", err);
    res.status(500).json({ error: "Error getting signed URL for part" });
  }
};

// Complete Multipart Upload
const completeUpload = async (req, res) => {
  const { fileName, uploadId, parts } = req.body;

  if (!uploadId || !fileName || !parts || parts.length === 0) {
    return res.status(400).json({ error: "uploadId, fileName, and parts are required" });
  }

  // Validate that parts array has necessary ETags and PartNumbers
  const validatedParts = parts.map((part) => ({
    ETag: part.ETag, // The ETag of the uploaded part
    PartNumber: part.PartNumber, // Part number in sequence
  }));

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: validatedParts, // Array of parts with PartNumber and ETag
    },
  };

  try {
    const data = await s3.completeMultipartUpload(params).promise();
    res.json({ location: data.Location });
  } catch (err) {
    console.error("Error completing multipart upload:", err);
    res.status(500).json({ error: "Error completing multipart upload" });
  }
};

module.exports = {
  startUpload,
  getUploadUrl,
  completeUpload,
};
