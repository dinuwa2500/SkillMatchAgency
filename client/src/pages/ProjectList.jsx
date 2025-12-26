import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import {
    Plus, Eye, Users, Trash2, Search, Filter,
    Download, Save, X, Edit2, AlertCircle, CheckCircle,
    MoreVertical, ChevronDown, ChevronUp
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const ProjectList = () => {
    // Data State
    const [projects, setProjects] = useState([]);
    const [skills, setSkills] = useState([]);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    // Bulk Project State
    const [selectedProjects, setSelectedProjects] = useState(new Set());

    // Modal Form State (Create & Edit)
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', status: 'Planning', start_date: '', end_date: '', requirements: []
    });
    const [requirementsData, setRequirementsData] = useState([{ skill_id: '', min_proficiency_level: 'Intermediate' }]);

    // Match Modal State
    const [matches, setMatches] = useState([]);
    const [matchProject, setMatchProject] = useState(null);

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchProjects();
        fetchSkills();
    }, []);

    // Derived Data: Filtered & Sorted Projects
    const filteredProjects = useMemo(() => {
        let result = [...projects];

        // Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                p.description?.toLowerCase().includes(lowerQuery)
            );
        }
        if (statusFilter !== 'All') {
            result = result.filter(p => p.status === statusFilter);
        }

        // Sort
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Handle Dates
                if (['start_date', 'end_date', 'created_at'].includes(sortConfig.key)) {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [projects, searchQuery, statusFilter, sortConfig]);

    // Derived Data: Chart Data
    const chartData = useMemo(() => {
        return filteredProjects.map(p => ({
            name: p.name,
            requirements: p.requirements ? p.requirements.length : 0,
            // Mocking 'assigned' count as we don't have a direct table for it yet, 
            // but we can assume 'Active' projects might have some personnel logic later.
            // For now, let's visualize Requirements count vs a static capacity or just Requirements.
            // Or better, let's just show Requirements Distribution.
            personnel_needed: p.requirements ? p.requirements.length : 0
        })).slice(0, 10); // Top 10 for chart clarity
    }, [filteredProjects]);

    // Handlers
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const toggleSelectProject = (id) => {
        const newSet = new Set(selectedProjects);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedProjects(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedProjects.size === filteredProjects.length) setSelectedProjects(new Set());
        else setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedProjects.size} projects?`)) return;
        try {
            await Promise.all(Array.from(selectedProjects).map(id => axios.delete(`${API_URL}/projects/${id}`)));
            setSelectedProjects(new Set());
            fetchProjects();
        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Failed to delete some projects');
        }
    };

    // Form Handlers
    const openCreateModal = () => {
        setIsEditMode(false);
        setCurrentProjectId(null);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (project) => {
        setIsEditMode(true);
        setCurrentProjectId(project.id);

        // Format dates for input[type="date"]
        const formatForInput = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';

        setFormData({
            name: project.name,
            description: project.description || '',
            status: project.status || 'Planning',
            start_date: formatForInput(project.start_date),
            end_date: formatForInput(project.end_date)
        });

        // Map requirements
        if (project.requirements && project.requirements.length > 0) {
            setRequirementsData(project.requirements.map(r => ({
                skill_id: r.skill_id,
                min_proficiency_level: r.min_proficiency_level
            })));
        } else {
            setRequirementsData([{ skill_id: '', min_proficiency_level: 'Intermediate' }]);
        }

        setIsModalOpen(true);
    };

    const exportData = () => {
        const headers = ['Name', 'Description', 'Status', 'Start Date', 'End Date'];
        const csvContent = [
            headers.join(','),
            ...filteredProjects.map(p => [
                `"${p.name}"`,
                `"${p.description || ''}"`,
                p.status,
                p.start_date?.split('T')[0],
                p.end_date?.split('T')[0]
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'projects_export.csv';
        a.click();
    };

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${API_URL}/projects`);
            setProjects(res.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchSkills = async () => {
        try {
            const res = await axios.get(`${API_URL}/skills`);
            setSkills(res.data);
        } catch (error) {
            console.error('Error fetching skills:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            requirements: requirementsData.filter(r => r.skill_id) // Filter empty rows
        };

        try {
            if (isEditMode) {
                await axios.put(`${API_URL}/projects/${currentProjectId}`, payload);
            } else {
                await axios.post(`${API_URL}/projects`, payload);
            }
            setIsModalOpen(false);
            resetForm();
            fetchProjects();
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Failed to save project');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', status: 'Planning', start_date: '', end_date: '', requirements: [] });
        setRequirementsData([{ skill_id: '', min_proficiency_level: 'Intermediate' }]);
    };

    const addRequirementRow = () => {
        setRequirementsData([...requirementsData, { skill_id: '', min_proficiency_level: 'Intermediate' }]);
    };

    const handleRequirementChange = (index, field, value) => {
        const newReqs = [...requirementsData];
        newReqs[index][field] = value;
        setRequirementsData(newReqs);
    };

    const viewMatches = async (project) => {
        setMatchProject(project);
        try {
            const res = await axios.get(`${API_URL}/match/${project.id}`);
            setMatches(res.data);
            setIsMatchModalOpen(true);
        } catch (error) {
            console.error('Error processing matching:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await axios.delete(`${API_URL}/projects/${id}`);
            fetchProjects();
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
                    <p className="text-gray-500 mt-1">Manage, track, and assign personnel to your active projects.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={exportData} variant="secondary" className="flex items-center gap-2">
                        <Download size={16} /> Export
                    </Button>
                    <Button onClick={openCreateModal} variant="primary" className="flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                        <Plus size={18} /> New Project
                    </Button>
                </div>
            </div>

            {/* Utilization Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Project Load Overview</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" height={60} />
                            <YAxis />
                            <RechartsTooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="name" fill="#6366f1" radius={[4, 4, 0, 0]} name="Skill Requirements" barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#818cf8' : '#6366f1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-1 gap-4 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-48">
                        <div className="relative">
                            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none appearance-none bg-white"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Planning">Planning</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {selectedProjects.size > 0 && (
                    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-100 text-red-700 animate-in fade-in slide-in-from-right-4">
                        <span className="text-sm font-medium">{selectedProjects.size} Selected</span>
                        <div className="h-4 w-px bg-red-200 mx-2"></div>
                        <button onClick={handleBulkDelete} className="text-sm hover:underline flex items-center gap-1">
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Projects Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={filteredProjects.length > 0 && selectedProjects.size === filteredProjects.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th onClick={() => handleSort('name')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group">
                                    <div className="flex items-center gap-1">Project Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                </th>
                                <th onClick={() => handleSort('status')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                    <div className="flex items-center gap-1">Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                </th>
                                <th onClick={() => handleSort('start_date')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                    <div className="flex items-center gap-1">Timeline {sortConfig.key === 'start_date' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Requirements
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProjects.map((project) => {
                                return (
                                    <tr key={project.id} className={`hover:bg-gray-50 transition-colors ${selectedProjects.has(project.id) ? 'bg-indigo-50 hover:bg-indigo-100' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={selectedProjects.has(project.id)}
                                                onChange={() => toggleSelectProject(project.id)}
                                            />
                                        </td>

                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${project.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                    project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {project.status}
                                            </span>
                                        </td>

                                        {/* Timeline */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                <div>{new Date(project.start_date).toLocaleDateString()}</div>
                                                <div className="text-xs text-gray-400">to {new Date(project.end_date).toLocaleDateString()}</div>
                                            </div>
                                        </td>

                                        {/* Requirements (Count) */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {project.requirements && project.requirements.length > 0 && project.requirements[0].skill_id ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                        {project.requirements.length} Skills
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => viewMatches(project)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Find Matches"><Users size={18} /></button>
                                                <button onClick={() => openEditModal(project)} className="text-gray-400 hover:text-gray-600 p-1" title="Edit"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDelete(project.id)} className="text-red-400 hover:text-red-600 p-1" title="Delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Project Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Project" : "Create New Project"}>
                <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-2">
                    <Input label="Project Name" id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-white"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Planning">Planning</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Start Date" id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                        <Input label="End Date" id="end_date" type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                    </div>

                    <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Required Skills</h4>
                        {requirementsData.map((req, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <select className="flex-1 px-2 py-1 border rounded text-sm" value={req.skill_id} onChange={(e) => handleRequirementChange(index, 'skill_id', e.target.value)}>
                                    <option value="">Select Skill</option>
                                    {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <select className="w-32 px-2 py-1 border rounded text-sm" value={req.min_proficiency_level} onChange={(e) => handleRequirementChange(index, 'min_proficiency_level', e.target.value)}>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>
                        ))}
                        <button type="button" onClick={addRequirementRow} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Requirement</button>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">{isEditMode ? "Save Changes" : "Create Project"}</Button>
                    </div>
                </form>
            </Modal>

            {/* Match Results Modal */}
            <Modal isOpen={isMatchModalOpen} onClose={() => setIsMatchModalOpen(false)} title={`Matches for ${matchProject?.name}`}>
                {matches.length > 0 ? (
                    <div className="space-y-4">
                        {matches.map((match, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-green-50 rounded-md border border-green-200">
                                <div>
                                    <p className="font-semibold text-green-900">{match.name}</p>
                                    <p className="text-sm text-green-700">{match.role}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-bold">100% Match</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No personnel found who meet all requirements.</p>
                    </div>
                )}
                <div className="mt-6 flex justify-end">
                    <Button onClick={() => setIsMatchModalOpen(false)}>Close</Button>
                </div>
            </Modal>
        </div>
    );
};

export default ProjectList;
