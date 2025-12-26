import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Plus, Trash, Edit, Award, Search, Filter, X } from 'lucide-react';
import Swal from 'sweetalert2';
import Toast from '../utils/toast';

const PersonnelList = () => {
    const [personnel, setPersonnel] = useState([]);
    const [skills, setSkills] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [currentPerson, setCurrentPerson] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: '', experience_level: 'Junior' });
    const [skillData, setSkillData] = useState({ skill_id: '', proficiency_level: 'Beginner' });

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [expFilter, setExpFilter] = useState('');
    const [skillFilter, setSkillFilter] = useState('');

    // Derived Data for Dropdowns
    const uniqueRoles = [...new Set(personnel.map(p => p.role).filter(Boolean))];

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchPersonnel();
        fetchSkills();
    }, []);

    const fetchPersonnel = async () => {
        try {
            const res = await axios.get(`${API_URL}/personnel`);
            setPersonnel(res.data);
        } catch (error) {
            console.error('Error fetching personnel:', error);
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
        try {
            if (currentPerson) {
                await axios.put(`${API_URL}/personnel/${currentPerson.id}`, formData);
                Toast.fire({ icon: 'success', title: 'Personnel updated successfully' });
            } else {
                await axios.post(`${API_URL}/personnel`, formData);
                Toast.fire({ icon: 'success', title: 'Personnel added successfully' });
            }
            setIsModalOpen(false);
            resetForm();
            fetchPersonnel();
        } catch (error) {
            console.error('Error saving personnel:', error);
            Toast.fire({ icon: 'error', title: 'Failed to save personnel' });
        }
    };

    const handleSkillSubmit = async (e) => {
        e.preventDefault();
        if (!currentPerson) return;
        try {
            await axios.post(`${API_URL}/personnel/${currentPerson.id}/skills`, skillData);
            setIsSkillModalOpen(false);
            setSkillData({ skill_id: '', proficiency_level: 'Beginner' });
            fetchPersonnel(); // Refresh to see new skills
            Toast.fire({ icon: 'success', title: 'Skill assigned successfully' });
        } catch (error) {
            console.error('Error assigning skill:', error);
            Toast.fire({ icon: 'error', title: 'Failed to assign skill' });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/personnel/${id}`);
                fetchPersonnel();
                Toast.fire({ icon: 'success', title: 'Personnel removed' });
            } catch (error) {
                console.error('Error deleting personnel:', error);
                Toast.fire({ icon: 'error', title: 'Failed to delete personnel' });
            }
        }
    };

    const openEditModal = (person) => {
        setCurrentPerson(person);
        setFormData({
            name: person.name,
            email: person.email,
            role: person.role,
            experience_level: person.experience_level
        });
        setIsModalOpen(true);
    };

    const openSkillModal = (person) => {
        setCurrentPerson(person);
        setSkillData({ skill_id: '', proficiency_level: 'Beginner' });
        setIsSkillModalOpen(true);
    };

    const resetForm = () => {
        setCurrentPerson(null);
        setFormData({ name: '', email: '', role: '', experience_level: 'Junior' });
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Personnel Management</h1>
                <Button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    variant="primary"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
                >
                    <Plus size={18} />
                    Add Personnel
                </Button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Filter size={20} className="text-indigo-500" />
                        Filter Personnel
                    </h2>
                    {(searchTerm || roleFilter || expFilter || skillFilter) && (
                        <button
                            onClick={() => { setSearchTerm(''); setRoleFilter(''); setExpFilter(''); setSkillFilter(''); }}
                            className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full"
                        >
                            <X size={14} />
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Name or Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="relative group">
                        <select
                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer transition-all text-gray-700"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">All Roles</option>
                            {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Experience Filter */}
                    <div className="relative group">
                        <select
                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer transition-all text-gray-700"
                            value={expFilter}
                            onChange={(e) => setExpFilter(e.target.value)}
                        >
                            <option value="">All Experience Levels</option>
                            <option value="Junior">Junior</option>
                            <option value="Mid-Level">Mid-Level</option>
                            <option value="Senior">Senior</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Skill Filter */}
                    <div className="relative group">
                        <select
                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer transition-all text-gray-700"
                            value={skillFilter}
                            onChange={(e) => setSkillFilter(e.target.value)}
                        >
                            <option value="">All Skills</option>
                            {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personnel.filter(person => {
                    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        person.email.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesRole = roleFilter ? person.role === roleFilter : true;
                    const matchesExp = expFilter ? person.experience_level === expFilter : true;
                    // Check if person has the selected skill (skillFilter is string ID)
                    const matchesSkill = skillFilter ? person.skills?.some(s => s.skill_id === parseInt(skillFilter)) : true;

                    return matchesSearch && matchesRole && matchesExp && matchesSkill;
                }).map((person) => (
                    <div key={person.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4 sm:p-6 border border-gray-100 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{person.name}</h3>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">{person.role}</p>
                            </div>
                            <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide
                ${person.experience_level === 'Senior' ? 'bg-purple-100 text-purple-700' :
                                    person.experience_level === 'Mid-Level' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {person.experience_level}
                            </span>
                        </div>

                        <div className="mb-3 sm:mb-4 flex-grow">
                            <p className="text-gray-600 text-xs sm:text-sm mb-3 break-all">{person.email}</p>

                            <div>
                                <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skills</h4>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {person.skills && person.skills.length > 0 && person.skills[0].skill_id ? (
                                        person.skills.map((skill, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                {skill.skill_name} <span className="ml-1 text-gray-400">({skill.level?.substring(0, 3)})</span>
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">No skills assigned</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-auto pt-3 sm:pt-4 border-t border-gray-100">
                            <div className="text-xs text-gray-400 font-medium">Actions</div>
                            <div className="flex gap-1 sm:gap-2">
                                <button onClick={() => openSkillModal(person)} className="p-1.5 sm:p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Assign Skill">
                                    <Award size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                </button>
                                <button onClick={() => openEditModal(person)} className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                    <Edit size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                </button>
                                <button onClick={() => handleDelete(person.id)} className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                    <Trash size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Personnel Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentPerson ? 'Edit Personnel' : 'Add New Personnel'}
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Name"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Email"
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        label="Role"
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g. Frontend Developer"
                    />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.experience_level}
                            onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                        >
                            <option value="Junior">Junior</option>
                            <option value="Mid-Level">Mid-Level</option>
                            <option value="Senior">Senior</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </Modal>

            {/* Assign Skill Modal */}
            <Modal
                isOpen={isSkillModalOpen}
                onClose={() => setIsSkillModalOpen(false)}
                title="Assign Skill"
            >
                <form onSubmit={handleSkillSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Skill</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={skillData.skill_id}
                            onChange={(e) => setSkillData({ ...skillData, skill_id: e.target.value })}
                            required
                        >
                            <option value="">-- Select a Skill --</option>
                            {skills.map(skill => (
                                <option key={skill.id} value={skill.id}>{skill.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={skillData.proficiency_level}
                            onChange={(e) => setSkillData({ ...skillData, proficiency_level: e.target.value })}
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsSkillModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Assign</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PersonnelList;
