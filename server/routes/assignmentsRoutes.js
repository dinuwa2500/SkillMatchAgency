const express = require('express');
const router = express.Router();
const assignmentsController = require('../controllers/assignmentsController');

router.get('/', assignmentsController.getAssignments);
router.post('/', assignmentsController.createAssignment);
router.delete('/:id', assignmentsController.deleteAssignment);

module.exports = router;
