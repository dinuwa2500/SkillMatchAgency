const db = require('../config/db');

// Get All Assignments
// Returns flat list of assignments with project and personnel names
exports.getAssignments = async (req, res) => {
    try {
        const query = `
            SELECT pa.id,
                   pa.project_id, p.name as project_name,
                   pa.person_id, per.name as person_name,
                   pa.start_date, pa.end_date, pa.role, pa.status
            FROM project_assignments pa
            JOIN projects p ON pa.project_id = p.id
            JOIN personnel per ON pa.person_id = per.id
            ORDER BY pa.start_date ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Create Assignment
exports.createAssignment = async (req, res) => {
    try {
        const { project_id, person_id, start_date, end_date, role } = req.body;

        if (!project_id || !person_id || !start_date || !end_date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const query = `
            INSERT INTO project_assignments (project_id, person_id, start_date, end_date, role)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [project_id, person_id, start_date, end_date, role]);

        res.status(201).json({ id: result.insertId, message: 'Assignment created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Update Assignment
exports.updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_date, end_date, role, status } = req.body;

        const query = `
            UPDATE project_assignments 
            SET start_date = ?, end_date = ?, role = ?, status = ?
            WHERE id = ?
        `;
        await db.execute(query, [start_date, end_date, role, status, id]);
        res.json({ message: 'Assignment updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Delete Assignment
exports.deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM project_assignments WHERE id = ?', [id]);
        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
