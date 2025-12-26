const db = require('../config/db');

// Create Project
exports.createProject = async (req, res) => {
    try {
        const { name, description, start_date, end_date, requirements } = req.body;
        // requirements: [{ skill_id, min_proficiency_level }]

        if (!name) {
            return res.status(400).json({ message: 'Project Name is required' });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [result] = await connection.execute(
                'INSERT INTO projects (name, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
                [name, description, start_date, end_date, 'Planning']
            );

            const projectId = result.insertId;

            if (requirements && requirements.length > 0) {
                const values = requirements.map(req => [projectId, req.skill_id, req.min_proficiency_level]);
                // Bulk insert requirements
                // Note: mysql2/promise execute doesn't support bulk insert with ? placeholders easily like query
                // Using query for bulk insert
                await connection.query(
                    'INSERT INTO project_requirements (project_id, skill_id, min_proficiency_level) VALUES ?',
                    [values]
                );
            }

            await connection.commit();

            const [newProject] = await connection.execute('SELECT * FROM projects WHERE id = ?', [projectId]);
            res.status(201).json(newProject[0]);

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get All Projects
exports.getAllProjects = async (req, res) => {
    try {
        // Fetch projects with their requirements
        const query = `
      SELECT p.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT('skill_id', s.id, 'skill_name', s.name, 'min_level', pr.min_proficiency_level)
        ) as requirements
      FROM projects p
      LEFT JOIN project_requirements pr ON p.id = pr.project_id
      LEFT JOIN skills s ON pr.skill_id = s.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
        const [rows] = await db.query(query); // Use query for clean JSON aggregation
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Update Project Status
exports.updateProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await db.execute('UPDATE projects SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Project status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Project Details (Full Update)
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, start_date, end_date, requirements, status } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Update Project Basic Info
            const updateFields = [name, description, start_date, end_date];
            let query = 'UPDATE projects SET name = ?, description = ?, start_date = ?, end_date = ?';

            if (status) {
                query += ', status = ?';
                updateFields.push(status);
            }

            query += ' WHERE id = ?';
            updateFields.push(id);

            await connection.execute(query, updateFields);

            // 2. Update Requirements if provided
            if (requirements) {
                // Delete existing requirements
                await connection.execute('DELETE FROM project_requirements WHERE project_id = ?', [id]);

                // Insert new requirements
                if (requirements.length > 0) {
                    const values = requirements.map(req => [id, req.skill_id, req.min_proficiency_level]);
                    await connection.query(
                        'INSERT INTO project_requirements (project_id, skill_id, min_proficiency_level) VALUES ?',
                        [values]
                    );
                }
            }

            await connection.commit();
            res.json({ message: 'Project updated successfully' });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Delete Project
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            await connection.execute('DELETE FROM project_requirements WHERE project_id = ?', [id]);
            await connection.execute('DELETE FROM projects WHERE id = ?', [id]);
            await connection.commit();
            res.json({ message: 'Project deleted successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
