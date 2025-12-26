const db = require('../config/db');

const createAssignmentsTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS project_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT,
                person_id INT,
                start_date DATE,
                end_date DATE,
                role VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (person_id) REFERENCES personnel(id) ON DELETE CASCADE
            )
        `;
        await db.query(query);
        console.log('project_assignments table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
};

createAssignmentsTable();
