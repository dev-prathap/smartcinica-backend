const express = require("express");
const {
  uploadMiddleware,
  uploadFile,
  deleteFile,
  getAllFiles,
} = require("../controllers/fileController");
const authenticateToken = require("../middleware/auth");
const { getUploadURL, saveFile, getFiles, getAllFilesFromBucket } = require("../controllers/Fileurl");
const router = express.Router();

router.get("/upload", getUploadURL);
router.post("/files", authenticateToken, saveFile);
router.get('/files', getAllFilesFromBucket);
router.post("/upload", authenticateToken, uploadMiddleware, uploadFile);
router.get("/", authenticateToken, getAllFilesFromBucket);
router.delete("/:id", authenticateToken, deleteFile);

module.exports = router;
