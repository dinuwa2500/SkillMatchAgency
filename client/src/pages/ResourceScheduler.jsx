import React, { useEffect, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import axios from 'axios';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Toast from '../utils/toast';
import { Calendar, Plus } from 'lucide-react';

const ResourceScheduler = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [personnel, setPersonnel] = useState([]);
    const [viewMode, setViewMode] = useState(ViewMode.Month);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        project_id: '',
        person_id: '',
        start_date: '',
        end_date: '',
        role: ''
    });

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
        fetchProjectsAndPersonnel();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch assignments and transform to Gantt format
            const res = await axios.get(`${API_URL}/assignments`);
            const assignments = res.data;

            const newTasks = assignments.map(a => ({
                start: new Date(a.start_date),
                end: new Date(a.end_date),
                name: `${a.person_name} (${a.role || 'Member'})`,
                id: a.id.toString(),
                type: 'task',
                progress: 100, // Static for now
                isDisabled: false,
                styles: { progressColor: '#6366f1', progressSelectedColor: '#4f46e5' },
                project: a.project_name
            }));

            // Add Project headers (Gantt library expects hierarchical data or we can just list them)
            // For simplicity, we just list assignments. Improved UX would group by project.
            setTasks(newTasks);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            Toast.fire({ icon: 'error', title: 'Failed to load schedule' });
        }
    };

    const fetchProjectsAndPersonnel = async () => {
        try {
            const [pRes, perRes] = await Promise.all([
                axios.get(`${API_URL}/projects`),
                axios.get(`${API_URL}/personnel`)
            ]);
            setProjects(pRes.data);
            setPersonnel(perRes.data);
        } catch (error) {
            console.error('Error fetching lists:', error);
        }
    };

    const handleTaskChange = (task) => {
        console.log("On date change Id:" + task.id);
    };

    const handleDblClick = (task) => {
        alert("On Double Click event Id:" + task.id);
    };

    const handleDelete = async (task) => {
        if (!window.confirm("Delete assignment?")) return; // Using native for now within library context if needed
        try {
            await axios.delete(`${API_URL}/assignments/${task.id}`);
            fetchData();
            Toast.fire({ icon: 'success', title: 'Assignment removed' });
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: 'error', title: 'Failed to delete assignment' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/assignments`, formData);
            setIsModalOpen(false);
            setFormData({ project_id: '', person_id: '', start_date: '', end_date: '', role: '' });
            fetchData();
            Toast.fire({ icon: 'success', title: 'Assignment created' });
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: 'error', title: 'Failed to create assignment' });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Resource Scheduler</h1>
                <div className="flex gap-2">
                    <select
                        className="border rounded-md px-2 py-1 text-sm bg-white"
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                    >
                        <option value={ViewMode.Day}>Day</option>
                        <option value={ViewMode.Week}>Week</option>
                        <option value={ViewMode.Month}>Month</option>
                    </select>
                    <Button onClick={() => setIsModalOpen(true)} variant="primary" className="flex items-center gap-2">
                        <Plus size={18} />
                        Add Assignment
                    </Button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {tasks.length > 0 ? (
                    <Gantt
                        tasks={tasks}
                        viewMode={viewMode}
                        onDateChange={handleTaskChange}
                        onDelete={handleDelete}
                        onDoubleClick={handleDblClick}
                        listCellWidth="155px"
                        columnWidth={viewMode === ViewMode.Month ? 300 : 65}
                    />
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <p>No assignments yet. Click "Add Assignment" to schedule resources.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Schedule Resource"
            >
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={formData.project_id}
                            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                            required
                        >
                            <option value="">Select Project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Personnel</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={formData.person_id}
                            onChange={(e) => setFormData({ ...formData, person_id: e.target.value })}
                            required
                        >
                            <option value="">Select Person</option>
                            {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <Input
                        label="Role (Optional)"
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g. Lead Developer"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Schedule</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ResourceScheduler;
