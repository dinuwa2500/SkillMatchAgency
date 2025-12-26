const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');

router.get('/:projectId', matchingController.matchPersonnelToProject);

module.exports = router;
