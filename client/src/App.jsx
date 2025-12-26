import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PersonnelList from './pages/PersonnelList';
import SkillCatalog from './pages/SkillCatalog';
import ProjectList from './pages/ProjectList';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/personnel" element={<PersonnelList />} />
          <Route path="/skills" element={<SkillCatalog />} />
          <Route path="/projects" element={<ProjectList />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
