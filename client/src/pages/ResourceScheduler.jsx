
import React, { useState, useEffect, useMemo } from 'react';
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
    const [editingTask, setEditingTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [formData, setFormData] = useState({
        project_id: '',
        person_id: '',
        start_date: '',
        end_date: '',
        role: '',
        status: 'Active'
    });

    const API_URL = 'http://localhost:5000/api';

    // Actually, to support "Highlight", we need to re-calc tasks when selectedTask changes.
    // Let's add 'assignments' state.
    const [assignments, setAssignments] = useState([]);

    useEffect(() => {
        fetchData(); // Initial Load
        fetchProjectsAndPersonnel();
    }, []);

    // Re-process tasks whenever assignments map (simulated by refetch or local state) or selectedTask changes
    // Since we don't store raw assignments in state separately from 'tasks' in the previous code,
    // we need to refactor slightly to store 'assignments' or just fetch them.
    // For now, let's just make fetchData return them or store them.
    // simpler: Let's modify fetchData to update state, and a separate effect to formatting.
    // But to avoid big refactor, let's just use the fact that we call fetchData on updates.

    // Actually, to support "Highlight", we need to re-calc tasks when selectedTask changes.
    // Let's add 'assignments' state.

    useEffect(() => {
        const updateTasks = () => {
            const newTasks = assignments.map(a => {
                const isSelected = selectedTask?.id === a.id.toString();
                return {
                    start: new Date(a.start_date),
                    end: new Date(a.end_date),
                    name: `${a.person_name} (${a.role || 'Member'})`,
                    id: a.id.toString(),
                    type: 'task',
                    progress: a.status === 'Completed' ? 100 : 0,
                    isDisabled: false,
                    styles: {
                        progressColor: a.status === 'Completed' ? '#10b981' : (isSelected ? '#4338ca' : '#6366f1'),
                        progressSelectedColor: a.status === 'Completed' ? '#059669' : '#4f46e5',
                        backgroundColor: a.status === 'Completed' ? '#d1fae5' : (isSelected ? '#e0e7ff' : '#eef2ff'),
                        // We can attempt to style the text via the bar style if the library inherits, but usually it doesn't.
                        // However, the bar background change is a good indicator.
                    },
                    project: a.project_name,
                    data: a
                };
            });
            setTasks(newTasks);
        };
        updateTasks();
    }, [assignments, selectedTask]); // Re-run when assignments or selection changes

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/assignments`);
            setAssignments(res.data);
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

    const handleSelect = (task) => {
        setSelectedTask(task);
    };

    const handleTaskChange = (task) => {
        // Optional: Implement drag-and-drop update logic here if needed
        console.log("On date change Id:" + task.id);
    };

    const handleDblClick = (task) => {
        const assignment = task.data;
        if (!assignment) return;

        setEditingTask(assignment);
        setFormData({
            project_id: assignment.project_id,
            person_id: assignment.person_id,
            start_date: new Date(assignment.start_date).toISOString().split('T')[0],
            end_date: new Date(assignment.end_date).toISOString().split('T')[0],
            role: assignment.role || '',
            status: assignment.status || 'Active'
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (task) => {
        if (!window.confirm("Delete assignment?")) return; // Using native for now within library context if needed
        try {
            await axios.delete(`${API_URL}/assignments/${task.id}`);
            fetchData();
            setSelectedTask(null); // Clear selection on delete
            Toast.fire({ icon: 'success', title: 'Assignment removed' });
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: 'error', title: 'Failed to delete assignment' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await axios.put(`${API_URL}/assignments/${editingTask.id}`, formData);
                Toast.fire({ icon: 'success', title: 'Assignment updated' });
            } else {
                await axios.post(`${API_URL}/assignments`, formData);
                Toast.fire({ icon: 'success', title: 'Assignment created' });
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: 'error', title: 'Failed to save assignment' });
        }
    };

    const resetForm = () => {
        setEditingTask(null);
        setFormData({ project_id: '', person_id: '', start_date: '', end_date: '', role: '', status: 'Active' });
    };

    const handleToggleStatus = async () => {
        if (!selectedTask) return;
        const assignment = selectedTask.data;
        const newStatus = assignment.status === 'Active' ? 'Completed' : 'Active';

        try {
            await axios.put(`${API_URL}/assignments/${assignment.id}`, {
                ...assignment,
                start_date: new Date(assignment.start_date).toISOString().split('T')[0],
                end_date: new Date(assignment.end_date).toISOString().split('T')[0],
                status: newStatus
            });
            Toast.fire({ icon: 'success', title: `Marked as ${newStatus}` });
            fetchData();
            setSelectedTask(prev => ({ ...prev, data: { ...prev.data, status: newStatus } })); // Optimistic-ish update
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: 'error', title: 'Failed to update status' });
        }
    };

    // --- Custom Task List Implementation ---
    // Handles the "First Column Click" requirement robustly
    const handleNameClick = (task) => {
        // 1. Select the task ONLY
        setSelectedTask(task);
        // Requirement: Do NOT update status here. Selection only.
    };

    const CustomTaskList = useMemo(() => {
        return ({ rowHeight, tasks, fontFamily, fontSize }) => {
            return (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                    {/* Header-ish Labels (Optional, if we want headers inside the list area, but usually Gantt header handles it. 
                        We'll just make the rows authoritative.) */}

                    {tasks.map((t, index) => {
                        const isSelected = selectedTask?.id === t.id;
                        const isCompleted = t.data?.status === 'Completed';
                        const personName = t.data?.person_name || 'Unknown';
                        const role = t.data?.role || 'Member';
                        const project = t.data?.project_name || 'No Project';
                        const startDate = new Date(t.data.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        const endDate = new Date(t.data.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                        // Generate Initials
                        const initials = personName
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                        return (
                            <div
                                key={t.id}
                                onClick={() => handleNameClick(t)}
                                style={{
                                    height: rowHeight,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #e5e7eb',
                                    backgroundColor: isSelected
                                        ? '#eef2ff'
                                        : (index % 2 === 0 ? 'white' : '#f9fafb'), // Zebra Striping
                                    borderLeft: isSelected ? '4px solid #6366f1' : '4px solid transparent',
                                    transition: 'background-color 0.15s ease',
                                }}
                                className="group flex items-center px-4 hover:bg-gray-100"
                            >
                                <div className="flex items-center gap-3 w-full overflow-hidden">
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-black/5 shadow-sm transition-colors ${isCompleted
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-white text-gray-700 border border-gray-200'
                                        }`}>
                                        {isCompleted ? '✓' : initials}
                                    </div>

                                    {/* Content Grid */}
                                    <div className="flex-1 min-w-0 grid grid-cols-1 gap-0.5">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                {personName}
                                            </span>
                                            {/* Status Badge */}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide border ${isCompleted
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                }`}>
                                                {t.data?.status || 'Active'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span className="truncate max-w-[120px]" title={project}>
                                                {project} • {role}
                                            </span>
                                            <span className="flex-shrink-0 ml-2 font-mono text-[10px]">
                                                {startDate} - {endDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        };
    }, [selectedTask]); // Re-create when selection changes to update highlighting

    // Custom Header to match the "Card" layout (removes the misleading "Name | From | To" columns)
    const CustomTaskHeader = useMemo(() => {
        return ({ headerHeight, fontFamily, fontSize }) => {
            return (
                <div
                    style={{
                        height: headerHeight,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '16px'
                    }}
                >
                    Resource Details
                </div>
            );
        }
    }, []);

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
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} variant="primary" className="flex items-center gap-2">
                        <Plus size={18} />
                        Add Assignment
                    </Button>
                </div>
            </div>

            {selectedTask && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mb-4 flex justify-between items-center animate-pulse-once bg-gradient-to-r from-indigo-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${selectedTask.data.status === 'Completed' ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
                        <div>
                            <p className="font-semibold text-gray-800">{selectedTask.name}</p>
                            <p className="text-xs text-gray-500">
                                {new Date(selectedTask.start).toLocaleDateString()} - {new Date(selectedTask.end).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleToggleStatus}
                            className={`${selectedTask.data.status === 'Completed' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'} text-white border-none`}
                        >
                            {selectedTask.data.status === 'Completed' ? 'Mark Active' : 'Mark Completed'}
                        </Button>
                        <Button onClick={() => handleDblClick(selectedTask)} variant="secondary">Edit</Button>
                        <Button onClick={() => handleDelete(selectedTask)} className="bg-red-100 text-red-600 hover:bg-red-200 border-red-200">Delete</Button>
                    </div>
                </div>
            )}

            {/* Removed brittle CSS styles in favor of CustomTaskList */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {tasks.length > 0 ? (
                    <Gantt
                        tasks={tasks}
                        viewMode={viewMode}
                        onDateChange={handleTaskChange}
                        onDelete={handleDelete}
                        onDoubleClick={handleDblClick}
                        onClick={handleSelect}
                        onClick={handleSelect}
                        TaskListTable={CustomTaskList}
                        TaskListHeader={CustomTaskHeader}
                        listCellWidth="350px" // Wider to fit the richer data grid
                        columnWidth={viewMode === ViewMode.Month ? 300 : 65}
                        barFill={60}
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
                title={editingTask ? 'Edit Assignment' : 'Schedule Resource'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={formData.project_id}
                            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                            required
                            disabled={!!editingTask} // Prevent moving to another project/person for simplicity during edit
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
                            disabled={!!editingTask}
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

                    {editingTask && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Completion Status</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'Active' })}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border ${formData.status === 'Active' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Active
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'Completed' })}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border ${formData.status === 'Completed' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Completed
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">{editingTask ? 'Save Changes' : 'Schedule'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ResourceScheduler;
