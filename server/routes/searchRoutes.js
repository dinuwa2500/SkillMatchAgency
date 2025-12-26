const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// GET /api/search?experience_level=Senior&skill=React&min_proficiency=Intermediate
router.get('/', searchController.searchPersonnel);

module.exports = router;
