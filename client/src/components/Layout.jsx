import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';

    return (
        <nav className="bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 text-white font-bold text-xl">SkillMatch Agency</Link>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}>Dashboard</Link>
                                <Link to="/personnel" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/personnel')}`}>Personnel</Link>
                                <Link to="/skills" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/skills')}`}>Skills</Link>
                                <Link to="/projects" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/projects')}`}>Projects</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
