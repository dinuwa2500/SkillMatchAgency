import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Search, UserCheck } from 'lucide-react';

const AdvancedSearch = () => {
    // Search Filters
    const [filters, setFilters] = useState({
        experience_level: '',
        skill: '',
        min_proficiency: ''
    });

    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            // Build query string explicitly
            const params = new URLSearchParams();
            if (filters.experience_level) params.append('experience_level', filters.experience_level);
            if (filters.skill) params.append('skill', filters.skill);
            if (filters.min_proficiency) params.append('min_proficiency', filters.min_proficiency);

            const res = await axios.get(`http://localhost:5000/api/search?${params.toString()}`);
            setResults(res.data);
            setHasSearched(true);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Advanced Personnel Search</h1>

            {/* Search Form Panel */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={filters.experience_level}
                            onChange={e => setFilters({ ...filters, experience_level: e.target.value })}
                        >
                            <option value="">Any Level</option>
                            <option value="Junior">Junior</option>
                            <option value="Mid-Level">Mid-Level</option>
                            <option value="Senior">Senior</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Has Skill</label>
                        <Input
                            id="skill"
                            placeholder="e.g. React"
                            value={filters.skill}
                            onChange={e => setFilters({ ...filters, skill: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Proficiency</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={filters.min_proficiency}
                            onChange={e => setFilters({ ...filters, min_proficiency: e.target.value })}
                            disabled={!filters.skill} // Constraint: Can only set min proficiency if a skill is selected
                        >
                            <option value="">Any Proficiency</option>
                            {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    <Button type="submit" variant="primary" className="flex justify-center items-center gap-2">
                        <Search size={18} />
                        Find Candidates
                    </Button>
                </form>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
                {hasSearched && (
                    <h2 className="text-xl font-semibold text-gray-700">
                        Found {results.length} candidate{results.length !== 1 ? 's' : ''}
                    </h2>
                )}

                {results.map(person => (
                    <div key={person.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-gray-900">{person.name}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${person.experience_level === 'Senior' ? 'bg-purple-100 text-purple-800' :
                                        person.experience_level === 'Mid-Level' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                    }`}>
                                    {person.experience_level}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">{person.role} • {person.email}</p>
                            <div className="mt-2 text-sm text-gray-600">
                                <span className="font-semibold">Skills: </span>
                                {person.skills ? person.skills : <span className="italic text-gray-400">None listed</span>}
                            </div>
                        </div>

                        <div className="text-right">
                            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                                <UserCheck size={16} /> View Profile
                            </button>
                        </div>
                    </div>
                ))}

                {hasSearched && results.length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p>No candidates found matching criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedSearch;
