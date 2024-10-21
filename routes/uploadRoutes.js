// routes/uploadRoutes.js
const express = require("express");
const {
  startUpload,
  getUploadUrl,
  completeUpload,
} = require("../controllers/files");
const router = express.Router();

router.post("/start-upload", startUpload);
router.post("/get-upload-url", getUploadUrl);
router.post("/complete-upload", completeUpload);

module.exports = router;
