import { useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [userStats, setUserStats] = useState({ total: 0, admins: 0, principals: 0, users: 0 });
    const [search, setSearch] = useState('');
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
    const [addLoading, setAddLoading] = useState(false);

    const { addToast, ToastContainer } = useToast();
    const { user: currentUser } = useAuth();
    const roleOptions = currentUser?.role === 'principal' ? ['user', 'admin'] : ['user'];

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (search.trim()) {
            const query = search.toLowerCase();
            setFiltered(users.filter((user) =>
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
            ));
        } else {
            setFiltered(users);
        }
    }, [search, users]);

    useEffect(() => {
        setNewUser((prev) => (
            roleOptions.includes(prev.role)
                ? prev
                : { ...prev, role: roleOptions[0] }
        ));
    }, [currentUser?.role]);

    const loadData = async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                API.get('/users'),
                API.get('/users/stats')
            ]);
            setUsers(usersRes.data);
            setUserStats(statsRes.data);
        } catch (err) {
            console.error('Load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const canManageAccount = (targetUser) => {
        if (!currentUser || currentUser._id === targetUser._id) return false;
        if (currentUser.role === 'principal') return ['admin', 'user'].includes(targetUser.role);
        if (currentUser.role === 'admin') return targetUser.role === 'user';
        return false;
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUser.name || !newUser.email || !newUser.password) {
            addToast('Please fill in all fields', 'error');
            return;
        }

        setAddLoading(true);
        try {
            await API.post('/users', newUser);
            addToast('User created successfully!', 'success');
            setShowAddModal(false);
            setNewUser({ name: '', email: '', password: '', role: roleOptions[0] });
            loadData();
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to create user', 'error');
        } finally {
            setAddLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteModal) return;
        try {
            await API.delete(`/users/${deleteModal}`);
            addToast('User deleted successfully', 'success');
            setDeleteModal(null);
            loadData();
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to delete user', 'error');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const getInitials = (name) => {
        return name?.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2) || '?';
    };

    if (loading) {
        return (
            <div>
                <div className="page-header"><div className="skeleton skeleton-title"></div></div>
                <div className="stats-grid">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton skeleton-card" style={{ height: '80px' }}></div>)}</div>
            </div>
        );
    }

    return (
        <div>
            <ToastContainer />

            <div className="user-management-header page-header">
                <div>
                    <h1>User Management</h1>
                    <p>{currentUser?.role === 'principal' ? 'Create admins and users.' : 'Create user accounts only.'}</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                    id="btn-add-user"
                >
                    Add User
                </button>
            </div>

            <div className="info-banner animate-fadeIn">
                <div className="info-banner-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l7 4v6c0 5-3.4 9.4-7 10-3.6-.6-7-5-7-10V6l7-4z" />
                        <path d="M9 12l2 2 4-4" />
                    </svg>
                </div>
                <span>Principals can create admins and users. Admins can create users only.</span>
            </div>

            <div className="stats-grid stagger">
                <div className="stat-card">
                    <div>
                        <div className="stat-card-value">{userStats.total}</div>
                        <div className="stat-card-label">Total Users</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div>
                        <div className="stat-card-value">{userStats.principals}</div>
                        <div className="stat-card-label">Principals</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div>
                        <div className="stat-card-value">{userStats.admins}</div>
                        <div className="stat-card-label">Admins</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div>
                        <div className="stat-card-value">{userStats.users}</div>
                        <div className="stat-card-label">Users</div>
                    </div>
                </div>
            </div>

            <div className="filter-bar animate-fadeIn" style={{ marginTop: '24px' }}>
                <div className="search-bar" style={{ maxWidth: '500px' }}>
                    <span className="search-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        id="search-users"
                    />
                </div>
            </div>

            <div className="card animate-fadeInUp" style={{ marginTop: '16px' }}>
                <div className="card-body" style={{ padding: 0 }}>
                    <ul className="user-list">
                        {filtered.length > 0 ? (
                            filtered.map((user) => (
                                <li key={user._id} className="user-item">
                                    <div className="user-item-info">
                                        <div className="user-item-avatar">{getInitials(user.name)}</div>
                                        <div>
                                            <div className="user-item-name">{user.name}</div>
                                            <div className="user-item-email">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="user-item-actions">
                                        <span className={`role-badge ${user.role}`}>
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {formatDate(user.createdAt)}
                                        </span>
                                        {canManageAccount(user) && (
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => setDeleteModal(user._id)}
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18" />
                                                    <path d="M8 6V4h8v2" />
                                                    <path d="M19 6l-1 14H6L5 6" />
                                                    <path d="M10 11v6" />
                                                    <path d="M14 11v6" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <div className="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
                                <h3>No Users Found</h3>
                                <p>{search ? 'No users match your search' : 'No users in the system'}</p>
                            </div>
                        )}
                    </ul>
                </div>
            </div>

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Add New User</h2>
                        <p>{currentUser?.role === 'principal' ? 'Create a new admin or user account.' : 'Create a new user account.'}</p>

                        <form onSubmit={handleAddUser}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="add-name">Full Name</label>
                                <input
                                    id="add-name"
                                    className="form-input"
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="User's full name"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="add-email">Email Address</label>
                                <input
                                    id="add-email"
                                    className="form-input"
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="add-password">Password</label>
                                <input
                                    id="add-password"
                                    className="form-input"
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                                    placeholder="At least 6 characters"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="add-role">Role</label>
                                <select
                                    id="add-role"
                                    className="form-select"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                                >
                                    {roleOptions.map((role) => (
                                        <option key={role} value={role}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                                    {addLoading ? <span className="spinner"></span> : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteModal && (
                <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Delete User</h2>
                        <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setDeleteModal(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeleteUser}>Delete User</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
