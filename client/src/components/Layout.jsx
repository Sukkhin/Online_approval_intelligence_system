import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="app-layout">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="main-content">
                <header className="app-topbar">
                    <button
                        type="button"
                        className="topbar-menu"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Open navigation"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </header>

                <div className="page-shell">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
