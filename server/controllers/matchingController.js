const db = require('../config/db');

/**
 * 6. Matching Algorithm (CRITICAL RESOURCE)
 * 
 * Logic to find the perfect candidate match for a project.
 * 
 * Rules:
 * 1. Candidate must possess ALL required skills for the project.
 * 2. Candidate's proficiency in EACH skill must >= Project's required level.
 *    (Mapping: Beginner=1, Intermediate=2, Advanced=3, Expert=4)
 */
exports.matchPersonnelToProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // 1. Fetch Project Requirements
        // We get the list of skill_ids and their minimum proficiency levels required.
        const [requirements] = await db.query(
            'SELECT skill_id, min_proficiency_level FROM project_requirements WHERE project_id = ?',
            [projectId]
        );

        if (requirements.length === 0) {
            return res.json([]); // No requirements = anyone could match, but usually implies bad setup. Returning empty.
        }

        // 2. Fetch All Candidates with their Skills
        // We intentionally fetch all relevant data to process logic explicitly in code for readability,
        // rather than a single complex nested SQL query which might be hard to debug.
        const [candidates] = await db.query(`
      SELECT p.id, p.name, p.role, p.email,
             ps.skill_id, ps.proficiency_level
      FROM personnel p
      JOIN personnel_skills ps ON p.id = ps.person_id
    `);

        // Helper map for proficiency weight
        const proficiencyWeight = {
            'Beginner': 1,
            'Intermediate': 2,
            'Advanced': 3,
            'Expert': 4
        };

        // 3. Process Matching Logic
        // Group skills by candidate first
        const candidatesMap = {};
        candidates.forEach(row => {
            if (!candidatesMap[row.id]) {
                candidatesMap[row.id] = {
                    id: row.id,
                    name: row.name,
                    role: row.role,
                    email: row.email,
                    skills: {} // Map skill_id -> proficiency_level
                };
            }
            candidatesMap[row.id].skills[row.skill_id] = row.proficiency_level;
        });

        const matchedPersonnel = [];

        // Check each candidate against requirements
        Object.values(candidatesMap).forEach(person => {
            let isMatch = true;
            let matchScore = 0; // Optional: Calculate a score based on how much they exceed requirements

            for (const req of requirements) {
                const personSkillLevel = person.skills[req.skill_id];

                // Rule 1: Must have the skill
                if (!personSkillLevel) {
                    isMatch = false;
                    break;
                }

                // Rule 2: Must meet minimum proficiency
                const personWeight = proficiencyWeight[personSkillLevel];
                const reqWeight = proficiencyWeight[req.min_proficiency_level];

                if (personWeight < reqWeight) {
                    isMatch = false;
                    break;
                }

                // Bonus: Calc match score
                matchScore += (personWeight - reqWeight);
            }

            if (isMatch) {
                person.matchScore = matchScore; // Add explicit score
                matchedPersonnel.push(person);
            }
        });

        // Sort by best match (highest score)
        matchedPersonnel.sort((a, b) => b.matchScore - a.matchScore);

        res.json(matchedPersonnel);

    } catch (error) {
        console.error('Matching Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
