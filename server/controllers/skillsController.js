const db = require('../config/db');

// Create Skill
exports.createSkill = async (req, res) => {
    try {
        const { name, category, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Skill Name is required' });
        }

        const [result] = await db.execute(
            'INSERT INTO skills (name, category, description) VALUES (?, ?, ?)',
            [name, category, description]
        );

        const [newSkill] = await db.execute('SELECT * FROM skills WHERE id = ?', [result.insertId]);
        res.status(201).json(newSkill[0]);
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Skill already exists' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get All Skills
exports.getAllSkills = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT s.*, COUNT(ps.person_id) as personnel_count 
            FROM skills s
            LEFT JOIN personnel_skills ps ON s.id = ps.skill_id
            GROUP BY s.id
            ORDER BY s.name ASC
        `);
        console.log('Skills fetched with count:', rows[0]); // Debug log
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Skill
exports.updateSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description } = req.body;

        const [result] = await db.execute(
            'UPDATE skills SET name = ?, category = ?, description = ? WHERE id = ?',
            [name, category, description, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        const [updatedSkill] = await db.execute('SELECT * FROM skills WHERE id = ?', [id]);
        res.json(updatedSkill[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete Skill
exports.deleteSkill = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM skills WHERE id = ?', [id]);
        res.json({ message: 'Skill deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
