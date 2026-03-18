import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const routeMeta = {
    '/dashboard': {
        title: 'Command Center',
        subtitle: 'Live visibility into every approval moving through the system.'
    },
    '/submit-request': {
        title: 'Compose Request',
        subtitle: 'Create a clear request that is easy to review and approve.'
    },
    '/my-requests': {
        title: 'My Request Timeline',
        subtitle: 'Review statuses, remarks, and everything you have submitted.'
    },
    '/manage-approvals': {
        title: 'Approval Desk',
        subtitle: 'Filter, review, and action incoming requests with confidence.'
    },
    '/user-management': {
        title: 'Team Access Control',
        subtitle: 'Manage accounts, roles, and the people behind each workflow.'
    }
};

export default function Layout() {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const currentMeta = routeMeta[location.pathname] || {
        title: 'ApprovalIQ Workspace',
        subtitle: 'A softer, more focused place to manage approvals.'
    };

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

                    <div className="topbar-copy">
                        <span className="topbar-eyebrow">Approval intelligence workspace</span>
                        <strong>{currentMeta.title}</strong>
                    </div>

                    <div className="topbar-meta">
                        <span className="topbar-chip">{currentMeta.subtitle}</span>
                    </div>
                </header>

                <div className="page-shell">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
