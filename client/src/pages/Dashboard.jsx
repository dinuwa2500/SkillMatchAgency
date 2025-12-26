import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Book, Briefcase, Activity } from 'lucide-react';

const Dashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [previewMatches, setPreviewMatches] = useState([]);

    // Filters State
    const [skillCategory, setSkillCategory] = useState('All');
    const [popFilter, setPopFilter] = useState('All Personnel');

    useEffect(() => {
        fetchAnalytics(); // Initial fetch
        fetchProjects();
    }, []);

    // Re-fetch when filters change
    useEffect(() => {
        fetchAnalytics();
    }, [skillCategory, popFilter]);

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/analytics?skill_category=${skillCategory}&pop_filter=${popFilter}`);
            console.log("Analytics Data:", res.data); // Debug log
            setAnalytics(res.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/projects');
            setProjects(res.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleProjectChange = async (e) => {
        const projectId = e.target.value;
        setSelectedProjectId(projectId);
        if (projectId) {
            try {
                const res = await axios.get(`http://localhost:5000/api/match/${projectId}`);
                setPreviewMatches(res.data.slice(0, 5)); // Limit to top 5
            } catch (error) {
                console.error('Error fetching matches:', error);
            }
        } else {
            setPreviewMatches([]);
        }
    };

    if (!analytics) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Strategic Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
                <StatsCard title="Total Personnel" value={analytics.counts.personnel} icon={<Users className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />} color="bg-blue-50" />
                <StatsCard title="Total Skills" value={analytics.counts.skills} icon={<Book className="text-purple-500 w-5 h-5 md:w-6 md:h-6" />} color="bg-purple-50" />
                <StatsCard title="Total Projects" value={analytics.counts.projects} icon={<Briefcase className="text-orange-500 w-5 h-5 md:w-6 md:h-6" />} color="bg-orange-50" />
                <StatsCard title="Active Projects" value={analytics.counts.activeProjects} icon={<Activity className="text-green-500 w-5 h-5 md:w-6 md:h-6" />} color="bg-green-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Top Skills Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <h2 className="text-xl font-semibold text-gray-800">Top Available Skills</h2>
                        <select
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
                            value={skillCategory}
                            onChange={(e) => setSkillCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {analytics.categories && analytics.categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-4">
                        {analytics.topSkills.map((skill, idx) => (
                            <div key={idx} className="group relative">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{skill.name}</span>
                                    <span className="text-gray-500">{skill.count} people</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5" title={`${skill.count} people have this skill`}>
                                    <div
                                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${(skill.count / analytics.counts.personnel) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {analytics.topSkills.length === 0 && <p className="text-gray-400 italic">No skills data available.</p>}
                    </div>
                </div>

                {/* Experience Distribution */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                        <h2 className="text-xl font-semibold text-gray-800">Experience Distribution</h2>
                        <select
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
                            value={popFilter}
                            onChange={(e) => setPopFilter(e.target.value)}
                        >
                            <option value="All Personnel">All Personnel</option>
                            <option value="Market Ready">Market Ready (Matched)</option>
                        </select>
                    </div>
                    {/* Chart Area */}
                    <div className="flex items-end justify-around h-48 border-b border-gray-200 pb-0 relative">
                        {['Junior', 'Mid-Level', 'Senior'].map(level => {
                            const count = analytics.experienceLevels.find(l => l.experience_level === level)?.count || 0;
                            const max = Math.max(...analytics.experienceLevels.map(l => l.count), 1);
                            const height = (count / max) * 100;

                            // Color coding
                            let barColor = "bg-green-500";
                            if (level === 'Mid-Level') barColor = "bg-blue-500";
                            if (level === 'Senior') barColor = "bg-purple-600";

                            // Prevent 0 height from looking like missing data (use minimal 2px if count > 0, or just 0)
                            // If count is 0, height is 0.

                            return (
                                <div key={level} className="h-full flex flex-col justify-end items-center px-2 w-1/3">
                                    <div
                                        className={`w-full max-w-[60px] ${barColor} rounded-t-sm transition-all duration-500 hover:opacity-90 relative group`}
                                        style={{ height: `${height}%` }}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                            {count} {level} Personnel
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Labels Area */}
                    <div className="flex justify-around mt-3">
                        {['Junior', 'Mid-Level', 'Senior'].map(level => {
                            const count = analytics.experienceLevels.find(l => l.experience_level === level)?.count || 0;
                            return (
                                <div key={level} className="text-center w-1/3">
                                    <p className="text-sm font-medium text-gray-700">{level}</p>
                                    <p className="text-xs text-gray-500 font-semibold">{count}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>


            {/* Quick Matching Preview Widget */}
            <div className="grid grid-cols-1 gap-4 sm:gap-8 mb-8 mt-6 sm:mt-8">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Quick Matching Preview</h2>
                        <select
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto"
                            value={selectedProjectId}
                            onChange={handleProjectChange}
                        >
                            <option value="">Select a Project to Preview Matches</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedProjectId ? (
                        previewMatches.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm sm:text-base">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase">
                                            <th className="py-2 px-4">Candidate</th>
                                            <th className="py-2 px-4">Role</th>
                                            <th className="py-2 px-4 text-center">Match %</th>
                                            <th className="py-2 px-4 text-center">Skills</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {previewMatches.map((match, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium text-gray-900">{match.name}</td>
                                                <td className="py-3 px-4 text-gray-600">{match.role}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        100%
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex flex-wrap justify-center gap-1">
                                                        {match.message ? (
                                                            <span className="text-xs text-gray-500">{match.message}</span>
                                                        ) : (
                                                            // Note: The match API currently returns simple personnel objects. 
                                                            // If we wanted matched skills specifically, we'd need to parse them from the full skill list if available
                                                            // For now, let's assume 'skills' is a map or we show a generic "Qualified" badge
                                                            // Actually, the current controller returns `skills` as a map {skill_id: level}.
                                                            // Converting that to badges is tricky without skill names mapping.
                                                            // I will stick to a 'Qualified' text or count for now to be safe, 
                                                            // OR I can use the 'Top Personnel' logic if I had the skill names.
                                                            // Controller doesn't return skill names in the skills map, only IDs.
                                                            // So I will display "All Requirements Met" for simplicity and correctness.
                                                            <span className="text-xs text-gray-500 italic">All Requirements Met</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p>No candidates found who meet all strict requirements for this project.</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p>Select a project from the dropdown to see potential matches.</p>
                        </div>
                    )}
                </div>
            </div>

            {analytics.topPersonnel && <TopPersonnelTable data={analytics.topPersonnel} />}
        </div>
    );
};

const TopPersonnelTable = ({ data }) => (
    <div className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Top Personnel</h2>

        {/* Mobile View: Compact List */}
        <div className="block sm:hidden space-y-3">
            {data.map(person => (
                <div key={person.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between items-center">
                    <div>
                        <div className="font-semibold text-gray-900 text-sm">{person.name}</div>
                        <div className="text-xs text-gray-500">{person.role}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            {person.total_skills} Skills
                        </span>
                        <span className="text-xs text-gray-500">
                            {person.active_projects} Projects
                        </span>
                    </div>
                </div>
            ))}
            {(!data || data.length === 0) && (
                <div className="text-center text-gray-400 text-sm py-4 italic">No personnel data available</div>
            )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase">
                        <th className="py-2 px-4">Name</th>
                        <th className="py-2 px-4">Role</th>
                        <th className="py-2 px-4 text-center">Total Skills</th>
                        <th className="py-2 px-4 text-center">Active Projects</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map(person => (
                        <tr key={person.id} className="hover:bg-gray-50 group cursor-default">
                            <td className="py-3 px-4 font-medium text-gray-900">{person.name}</td>
                            <td className="py-3 px-4 text-gray-600">{person.role}</td>
                            <td className="py-3 px-4 text-center relative">
                                <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                                    {person.total_skills}
                                </span>
                                {/* Tooltip */}
                                {person.skill_names && (
                                    <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                                        {person.skill_names}
                                    </div>
                                )}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-600">{person.active_projects}</td>
                        </tr>
                    ))}
                    {(!data || data.length === 0) && (
                        <tr>
                            <td colSpan="4" className="py-4 text-center text-gray-400 italic">No personnel data available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const StatsCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-3 md:p-6 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <div className={`p-2 md:p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs md:text-sm font-medium text-gray-500">{title}</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

export default Dashboard;
