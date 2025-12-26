import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PersonnelList from './pages/PersonnelList';
import SkillCatalog from './pages/SkillCatalog';
import ProjectList from './pages/ProjectList';
import ResourceScheduler from './pages/ResourceScheduler';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="personnel" element={<PersonnelList />} />
          <Route path="skills" element={<SkillCatalog />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="schedule" element={<ResourceScheduler />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
