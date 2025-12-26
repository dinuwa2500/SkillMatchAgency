const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('SkillMatch Agency API is running');
});

const personnelRoutes = require('./routes/personnelRoutes');
const skillsRoutes = require('./routes/skillsRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const assignmentsRoutes = require('./routes/assignmentsRoutes');

app.use('/api/personnel', personnelRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/match', matchingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assignments', assignmentsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
