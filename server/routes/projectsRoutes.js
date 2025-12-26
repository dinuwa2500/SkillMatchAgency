const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');

router.post('/', projectsController.createProject);
router.get('/', projectsController.getAllProjects);
router.patch('/:id/status', projectsController.updateProjectStatus);
router.put('/:id', projectsController.updateProject);

router.delete('/:id', projectsController.deleteProject);

module.exports = router;
