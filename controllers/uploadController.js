// controllers/uploadController.js
const ragService = require('../services/ragService');

const uploadController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        await ragService.processExcelFile(req.file.buffer);
        res.status(200).send({ message: 'File processed successfully!' });

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error processing file.');
    }
};

module.exports = uploadController;