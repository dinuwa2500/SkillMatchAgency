const express = require('express');
const router = express.Router();
const assignmentsController = require('../controllers/assignmentsController');

router.get('/', assignmentsController.getAssignments);
router.post('/', assignmentsController.createAssignment);
router.put('/:id', assignmentsController.updateAssignment);
router.delete('/:id', assignmentsController.deleteAssignment);

module.exports = router;
