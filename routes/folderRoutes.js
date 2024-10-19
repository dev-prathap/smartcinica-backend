const express = require("express");
const folderController = require("../controllers/folderController");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticateToken, folderController.createFolder);
router.get("/", authenticateToken, folderController.getUserFolders);

module.exports = router;
