const db = require('../config/db');

const addStatusColumn = async () => {
    try {
        const query = `
            ALTER TABLE project_assignments
            ADD COLUMN status ENUM('Active', 'Completed') DEFAULT 'Active';
        `;
        await db.query(query);
        console.log('Status column added to project_assignments successfully');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists');
            process.exit(0);
        }
        console.error('Error adding column:', error);
        process.exit(1);
    }
};

addStatusColumn();
