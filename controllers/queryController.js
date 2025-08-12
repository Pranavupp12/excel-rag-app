// controllers/queryController.js
const ragService = require('../services/ragService');

const queryController = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).send('Query not provided.');
        }

        const answer = await ragService.getAnswer(query);

        if (!answer) {
            return res.status(400).send('No Excel data has been uploaded yet.');
        }

        res.status(200).send({ answer });

    } catch (error) {
        console.error('Error querying data:', error);
        res.status(500).send('Error querying data.');
    }
};

module.exports = queryController;