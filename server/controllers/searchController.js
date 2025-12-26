const db = require('../config/db');

// Advanced Search Personnel
exports.searchPersonnel = async (req, res) => {
    try {
        const { experience_level, skill, min_proficiency } = req.query;

        console.log('Search Query:', { experience_level, skill, min_proficiency });

        let query = `
      SELECT DISTINCT p.*, 
        GROUP_CONCAT(CONCAT(s.name, ' (', ps.proficiency_level, ')') SEPARATOR ', ') as skills
      FROM personnel p
      LEFT JOIN personnel_skills ps ON p.id = ps.person_id
      LEFT JOIN skills s ON ps.skill_id = s.id
    `;

        let conditions = [];
        let params = [];

        // Filter by Experience Level
        if (experience_level) {
            conditions.push('p.experience_level = ?');
            params.push(experience_level);
        }

        // Filter by Skill & Proficiency
        // Note: This requires a subquery or join condition to ensure the person has the SPECIFIC skill at the SPECIFIC level
        if (skill) {
            let skillCondition = 'p.id IN (SELECT person_id FROM personnel_skills ps_inner JOIN skills s_inner ON ps_inner.skill_id = s_inner.id WHERE s_inner.name LIKE ?';
            params.push(`%${skill}%`);

            if (min_proficiency) {
                // Map proficiency levels to weights for comparison
                const proficiencyMap = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 };
                const minWeight = proficiencyMap[min_proficiency] || 0;

                // We handle this logic in the WHERE clause by checking if the found skill has >= weight
                // Since SQL ENUM/TEXT comparison is tricky without a helper table, we'll use a CASE statement in the subquery or just fetch and filter in JS if implicit mapping is hard. 
                // For strictly explicit SQL as requested:
                skillCondition += ` AND CASE ps_inner.proficiency_level 
          WHEN 'Beginner' THEN 1 
          WHEN 'Intermediate' THEN 2 
          WHEN 'Advanced' THEN 3 
          WHEN 'Expert' THEN 4 
          ELSE 0 END >= ?)`;
                params.push(minWeight);
            } else {
                skillCondition += ')';
            }
            conditions.push(skillCondition);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY p.id';

        const [results] = await db.query(query, params);
        res.json(results);

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
