const db = require('../config/db');

// Create Personnel
exports.createPersonnel = async (req, res) => {
    try {
        const { name, email, role, experience_level } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and Email are required' });
        }

        const [result] = await db.execute(
            'INSERT INTO personnel (name, email, role, experience_level) VALUES (?, ?, ?, ?)',
            [name, email, role, experience_level || 'Junior']
        );

        const newPersonId = result.insertId;
        const [newPerson] = await db.execute('SELECT * FROM personnel WHERE id = ?', [newPersonId]);

        res.status(201).json(newPerson[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get All Personnel
exports.getAllPersonnel = async (req, res) => {
    try {
        const query = `
      SELECT p.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT('skill_id', s.id, 'skill_name', s.name, 'level', ps.proficiency_level)
        ) as skills
      FROM personnel p
      LEFT JOIN personnel_skills ps ON p.id = ps.person_id
      LEFT JOIN skills s ON ps.skill_id = s.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
        const [rows] = await db.query(query);
        // Handle case where skills is [null] if no skills (JSON_ARRAYAGG behavior with LEFT JOIN varies, usually check if skill_id is null)
        // But basic JSON_ARRAYAGG is fine for now, or clean up in frontend.
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Assign Skill to Personnel
exports.assignSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const { skill_id, proficiency_level } = req.body;

        if (!skill_id || !proficiency_level) {
            return res.status(400).json({ message: 'Skill ID and Proficiency Level are required' });
        }

        await db.execute(
            'INSERT INTO personnel_skills (person_id, skill_id, proficiency_level) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE proficiency_level = ?',
            [id, skill_id, proficiency_level, proficiency_level]
        );

        res.json({ message: 'Skill assigned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Update Personnel
exports.updatePersonnel = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, experience_level } = req.body;

        const [result] = await db.execute(
            'UPDATE personnel SET name = ?, email = ?, role = ?, experience_level = ? WHERE id = ?',
            [name, email, role, experience_level, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Personnel not found' });
        }

        const [updatedPerson] = await db.execute('SELECT * FROM personnel WHERE id = ?', [id]);
        res.json(updatedPerson[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Delete Personnel
exports.deletePersonnel = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM personnel WHERE id = ?', [id]);
        res.json({ message: 'Personnel deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
