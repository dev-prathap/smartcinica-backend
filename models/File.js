
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }, // Optional folder reference
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to user
});

const File = mongoose.model('File', fileSchema);
module.exports = File;
