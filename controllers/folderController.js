const Folder = require("../models/Folder");

// Create folder
exports.createFolder = (req, res) => {
  const newFolder = new Folder({ name: req.body.name, userId: req.user.id });
  newFolder
    .save()
    .then((folder) => res.status(201).json(folder))
    .catch((err) => res.status(400).json({ message: err.message }));
};

// Get user folders
exports.getUserFolders = (req, res) => {
  Folder.find({ userId: req.user.id })
    .then((folders) => res.status(200).json(folders))
    .catch((err) => res.status(500).json({ message: err.message }));
};
