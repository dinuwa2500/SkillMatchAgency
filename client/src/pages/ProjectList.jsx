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
import * as XLSX from 'xlsx'; // Import SheetJS
import Swal from 'sweetalert2';
import Toast from '../utils/toast';

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
        return filteredProjects
            .filter(p => p.status === 'Active' || p.status === 'Planning') // Optional: Focus on relevant projects
            .map(p => ({
                name: p.name,
                requirements: p.requirements ? p.requirements.length : 0,
                // Add a color property if we wanted per-bar static logic, but we'll do it in render
            }))
            .sort((a, b) => b.requirements - a.requirements) // Show busiest projects first
            .slice(0, 8); // Limit to top 8 for space
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
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedProjects.size} projects. This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!'
        });

        if (result.isConfirmed) {
            try {
                await Promise.all(Array.from(selectedProjects).map(id => axios.delete(`${API_URL}/projects/${id}`)));
                setSelectedProjects(new Set());
                fetchProjects();
                Toast.fire({
                    icon: 'success',
                    title: 'Selected projects deleted'
                });
            } catch (error) {
                console.error('Bulk delete error:', error);
                Toast.fire({
                    icon: 'error',
                    title: 'Failed to delete some projects'
                });
            }
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
        // Helper to safely escape CSV fields
        const escapeCsvCell = (data) => {
            if (data === null || data === undefined) return '';
            const str = String(data);
            // If data contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // Define Headers
        const headers = [
            'Project Name',
            'Description',
            'Status',
            'Start Date',
            'End Date',
            'Required Skills (Level)',
            'Skill Count'
        ];

        // Format Rows
        const rows = filteredProjects.map(p => {
            // Format Requirements: "Java (Expert); Python (Intermediate)"
            const reqsString = p.requirements
                ? p.requirements.map(r => {
                    // Find skill name from skills list if available, otherwise just ID (though backend usually populates name)
                    // Assuming requirements might need name lookup if not populated, but verify with data. 
                    // If p.requirements has joined names, great. If not, we might need to lookup in 'skills' state.
                    // Based on previous code, requirements seem to be objects. Let's assume we need to lookup or it's already there.
                    // Safe fallback:
                    const skillName = skills.find(s => s.id === r.skill_id)?.name || 'Unknown Skill';
                    return `${skillName} (${r.min_proficiency_level})`;
                }).join('; ')
                : '';

            return [
                escapeCsvCell(p.name),
                escapeCsvCell(p.description),
                escapeCsvCell(p.status),
                escapeCsvCell(p.start_date ? p.start_date.split('T')[0] : ''),
                escapeCsvCell(p.end_date ? p.end_date.split('T')[0] : ''),
                escapeCsvCell(reqsString),
                escapeCsvCell(p.requirements ? p.requirements.length : 0)
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                Toast.fire({
                    icon: 'success',
                    title: 'Project updated successfully'
                });
            } else {
                await axios.post(`${API_URL}/projects`, payload);
                Toast.fire({
                    icon: 'success',
                    title: 'Project created successfully'
                });
            }
            setIsModalOpen(false);
            resetForm();
            fetchProjects();
        } catch (error) {
            console.error('Error saving project:', error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to save project'
            });
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
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/projects/${id}`);
                fetchProjects();
                Toast.fire({
                    icon: 'success',
                    title: 'Project deleted'
                });
            } catch (error) {
                console.error('Error deleting project:', error);
                Toast.fire({
                    icon: 'error',
                    title: 'Failed to delete project'
                });
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Projects</h1>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">Manage, track, and assign personnel.</p>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <Button
                        onClick={exportData}
                        variant="secondary"
                        className="flex-1 md:flex-none justify-center items-center gap-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all duration-200 rounded-lg"
                    >
                        <Download size={18} className="text-gray-500" />
                        <span>Export</span>
                    </Button>
                    <Button
                        onClick={openCreateModal}
                        variant="primary"
                        className="flex-1 md:flex-none justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md hover:shadow-lg shadow-indigo-500/20 border-0 transition-all duration-200 transform hover:-translate-y-0.5 rounded-lg font-semibold"
                    >
                        <Plus size={18} />
                        <span>New Project</span>
                    </Button>
                </div>
            </div>

            {/* Utilization Chart */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">Project Requirements</h3>
                    <span className="text-xs text-gray-400">Top 8</span>
                </div>
                <div className="h-64 md:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                interval={0}
                            />
                            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                            <RechartsTooltip
                                cursor={{ fill: '#f3f4f6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="requirements" name="Required Skills" radius={[4, 4, 0, 0]} barSize={50}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col md:flex-row gap-4 w-full">
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
                    <div className="w-full md:w-48">
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

            {/* Desktop Projects Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

            {/* Mobile Projects Card View */}
            <div className="md:hidden space-y-4">
                {filteredProjects.map((project) => (
                    <div key={project.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 ${selectedProjects.has(project.id) ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={selectedProjects.has(project.id)}
                                    onChange={() => toggleSelectProject(project.id)}
                                />
                                <div>
                                    <div className="font-semibold text-gray-900">{project.name}</div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1
                                            ${project.status === 'Active' ? 'bg-green-100 text-green-800' :
                                            project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'}`}>
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => viewMatches(project)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"><Users size={18} /></button>
                                <button onClick={() => openEditModal(project)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Edit2 size={18} /></button>
                                <button onClick={() => handleDelete(project.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                            </div>
                        </div>

                        {project.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                        )}

                        <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                            <div>
                                <span className="block font-medium text-gray-700">Timeline</span>
                                {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                            </div>
                            <div className="text-right">
                                <span className="block font-medium text-gray-700">Needs</span>
                                {project.requirements && project.requirements.length > 0 && project.requirements[0].skill_id ? (
                                    <span className="text-indigo-600 font-semibold">{project.requirements.length} Skills</span>
                                ) : (
                                    <span>None</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
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
