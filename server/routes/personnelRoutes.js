const express = require('express');
const router = express.Router();
const personnelController = require('../controllers/personnelController');

router.post('/', personnelController.createPersonnel);
router.get('/', personnelController.getAllPersonnel);
router.put('/:id', personnelController.updatePersonnel);
router.delete('/:id', personnelController.deletePersonnel);
router.post('/:id/skills', personnelController.assignSkill);

module.exports = router;

