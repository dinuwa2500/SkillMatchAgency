import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Plus, Trash, Edit, Search, Filter, X } from 'lucide-react';
import Swal from 'sweetalert2';
import Toast from '../utils/toast';

const SkillCatalog = () => {
    const [skills, setSkills] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState(new Set()); // Track selected IDs
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSkill, setCurrentSkill] = useState(null);

    const [formData, setFormData] = useState({ name: '', category: '', description: '' });

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Derived Data (Filtered + Sorted + Paginated)
    const filteredSortedSkills = React.useMemo(() => {
        let result = [...skills];

        // 1. Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(skill =>
                skill.name.toLowerCase().includes(lowerQuery) ||
                skill.description?.toLowerCase().includes(lowerQuery)
            );
        }

        if (filterCategory) {
            result = result.filter(skill => skill.category === filterCategory);
        }

        // 2. Sort
        if (sortConfig.key) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return result;
    }, [skills, sortConfig, searchQuery, filterCategory]);

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredSortedSkills.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSortedSkills.length / ITEMS_PER_PAGE);

    // Unique Categories for Dropdown
    const categories = React.useMemo(() => {
        return [...new Set(skills.map(s => s.category).filter(Boolean))].sort();
    }, [skills]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchSkills();
    }, []);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterCategory]);

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
        try {
            if (currentSkill) {
                await axios.put(`${API_URL}/skills/${currentSkill.id}`, formData);
                Toast.fire({ icon: 'success', title: 'Skill updated successfully' });
            } else {
                await axios.post(`${API_URL}/skills`, formData);
                Toast.fire({ icon: 'success', title: 'Skill added successfully' });
            }
            setIsModalOpen(false);
            resetForm();
            fetchSkills();
        } catch (error) {
            console.error('Error saving skill:', error);
            Toast.fire({ icon: 'error', title: 'Failed to save skill' });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete this skill?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/skills/${id}`);
                fetchSkills();
                Toast.fire({ icon: 'success', title: 'Skill deleted' });
            } catch (error) {
                console.error('Error deleting skill:', error);
                Toast.fire({ icon: 'error', title: 'Failed to delete skill' });
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedSkills.size === 0) return;

        const result = await Swal.fire({
            title: `Delete ${selectedSkills.size} skills?`,
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!'
        });

        if (result.isConfirmed) {
            try {
                // Execute all deletes in parallel
                await Promise.all(Array.from(selectedSkills).map(id => axios.delete(`${API_URL}/skills/${id}`)));
                setSelectedSkills(new Set()); // Clear selection
                fetchSkills();
                Toast.fire({ icon: 'success', title: 'Selected skills deleted' });
            } catch (error) {
                console.error('Error deleting skills:', error);
                Toast.fire({ icon: 'error', title: 'Failed to delete some skills' });
            }
        }
    };

    const toggleSelectAll = () => {
        // Check if all CURRENT items are selected
        const allCurrentSelected = currentItems.every(item => selectedSkills.has(item.id));

        const newSelection = new Set(selectedSkills);

        if (allCurrentSelected) {
            // Deselect active page items
            currentItems.forEach(item => newSelection.delete(item.id));
        } else {
            // Select active page items
            currentItems.forEach(item => newSelection.add(item.id));
        }
        setSelectedSkills(newSelection);
    };

    const toggleSelectSkill = (id) => {
        const newSelection = new Set(selectedSkills);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedSkills(newSelection);
    };

    const openEditModal = (skill) => {
        setCurrentSkill(skill);
        setFormData({ name: skill.name, category: skill.category, description: skill.description });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setCurrentSkill(null);
        setFormData({ name: '', category: '', description: '' });
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Skill Catalog</h1>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {selectedSkills.size > 0 && (
                        <Button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 w-full sm:w-auto">
                            <Trash size={18} />
                            Delete ({selectedSkills.size})
                        </Button>
                    )}
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} variant="primary" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                        <Plus size={18} />
                        Add Skill
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-8 transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Filter size={20} className="text-indigo-500" />
                        Filter Skills
                    </h2>
                    {(searchQuery || filterCategory) && (
                        <button
                            onClick={() => { setSearchQuery(''); setFilterCategory(''); }}
                            className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-all bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full group"
                        >
                            <X size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search skills..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <div className="relative">
                            <select
                                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm outline-none bg-white cursor-pointer"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <Filter size={16} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white shadow overflow-hidden sm:rounded-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        {/* ... Table Header ... */}
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        checked={currentItems.length > 0 && currentItems.every(item => selectedSkills.has(item.id))}
                                        onChange={toggleSelectAll}
                                        title="Select all on this page"
                                    />
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Name
                                        {sortConfig.key === 'name' && (
                                            <span className="text-gray-400">
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-1">
                                        Category
                                        {sortConfig.key === 'category' && (
                                            <span className="text-gray-400">
                                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentItems.map((skill) => (
                                <tr key={skill.id} className={selectedSkills.has(skill.id) ? 'bg-indigo-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            checked={selectedSkills.has(skill.id)}
                                            onChange={() => toggleSelectSkill(skill.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{skill.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{skill.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${skill.personnel_count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {skill.personnel_count}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{skill.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openEditModal(skill)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(skill.id)} className="text-red-600 hover:text-red-900">
                                            <Trash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {currentItems.map((skill) => (
                    <div
                        key={skill.id}
                        className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 ${selectedSkills.has(skill.id) ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={selectedSkills.has(skill.id)}
                                    onChange={() => toggleSelectSkill(skill.id)}
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                        {skill.category || 'Uncategorized'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEditModal(skill)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(skill.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                                    <Trash size={18} />
                                </button>
                            </div>
                        </div>

                        {skill.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{skill.description}</p>
                        )}

                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                            <span>Assigned: <strong className="text-gray-800">{skill.personnel_count}</strong></span>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentSkill ? 'Edit Skill' : 'Add New Skill'}
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Skill Name"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Category"
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default SkillCatalog;
