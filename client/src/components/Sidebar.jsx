import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
    dashboard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    submit: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
            <rect x="3" y="3" width="18" height="18" rx="3" />
        </svg>
    ),
    requests: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
        </svg>
    ),
    approvals: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    ),
    users: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    logout: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    brand: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#6a7681" />
            <path d="M12 3.19L5 6.3v4.7c0 4.56 3.15 8.82 7 9.88 3.85-1.06 7-5.32 7-9.88V6.3L12 3.19z" fill="#8f9ba5" />
            <path d="M11 16l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" fill="#ffffff" />
        </svg>
    )
};

export default function Sidebar({ isOpen = false, onClose = () => { } }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        onClose();
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        return name
            ?.split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'principal';
    const getNavClass = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`;

    return (
        <>
            <button
                type="button"
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
                aria-label="Close navigation"
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">{icons.brand}</div>
                    <div>
                        <h1>ApprovalIQ</h1>
                        <span>Intelligence System</span>
                    </div>
                </div>

                <div className="sidebar-user">
                    <div className="sidebar-avatar">{getInitials(user?.name)}</div>
                    <div className="sidebar-user-info">
                        <h3>{user?.name}</h3>
                        <div className="sidebar-user-role">
                            <span className="role-dot"></span>
                            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">Workspace</div>

                    <NavLink to="/dashboard" className={getNavClass} id="nav-dashboard" onClick={onClose}>
                        <span className="sidebar-link-icon">{icons.dashboard}</span>
                        Dashboard
                    </NavLink>

                    <NavLink to="/submit-request" className={getNavClass} id="nav-submit" onClick={onClose}>
                        <span className="sidebar-link-icon">{icons.submit}</span>
                        Submit Request
                    </NavLink>

                    <NavLink to="/my-requests" className={getNavClass} id="nav-my-requests" onClick={onClose}>
                        <span className="sidebar-link-icon">{icons.requests}</span>
                        My Requests
                    </NavLink>

                    {isAdmin && (
                        <>
                            <div className="sidebar-section-title">Administration</div>

                            <NavLink to="/manage-approvals" className={getNavClass} id="nav-manage" onClick={onClose}>
                                <span className="sidebar-link-icon">{icons.approvals}</span>
                                Manage Approvals
                            </NavLink>

                            <NavLink to="/user-management" className={getNavClass} id="nav-users" onClick={onClose}>
                                <span className="sidebar-link-icon">{icons.users}</span>
                                User Management
                            </NavLink>
                        </>
                    )}

                    <div className="sidebar-ambient">
                        <span className="sidebar-ambient-label">Focus note</span>
                        <p>Clear requests, concise remarks, and steady follow-through create the fastest approvals.</p>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-signout" onClick={handleLogout} id="btn-signout">
                        <span className="sidebar-link-icon">{icons.logout}</span>
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
