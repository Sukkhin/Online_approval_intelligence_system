import { useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from '../hooks/useToast';

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

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (search.trim()) {
            const s = search.toLowerCase();
            setFiltered(users.filter(u =>
                u.name.toLowerCase().includes(s) ||
                u.email.toLowerCase().includes(s)
            ));
        } else {
            setFiltered(users);
        }
    }, [search, users]);

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
            setNewUser({ name: '', email: '', password: '', role: 'user' });
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
        return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    };

    if (loading) {
        return (
            <div>
                <div className="page-header"><div className="skeleton skeleton-title"></div></div>
                <div className="stats-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '80px' }}></div>)}</div>
            </div>
        );
    }

    return (
        <div>
            <ToastContainer />

            <div className="user-management-header page-header">
                <div>
                    <h1>User Management</h1>
                    <p>As Admin, you can add regular Users</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                    id="btn-add-user"
                >
                    Add User
                </button>
            </div>

            {/* Info Banner */}
            <div className="info-banner animate-fadeIn">
                <div className="info-banner-icon">🛡</div>
                <span>Admin Access — You can add regular Users to the system.</span>
            </div>

            {/* User Stats */}
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

            {/* Search */}
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

            {/* User List */}
            <div className="card animate-fadeInUp" style={{ marginTop: '16px' }}>
                <div className="card-body" style={{ padding: 0 }}>
                    <ul className="user-list">
                        {filtered.length > 0 ? (
                            filtered.map(u => (
                                <li key={u._id} className="user-item">
                                    <div className="user-item-info">
                                        <div className="user-item-avatar">{getInitials(u.name)}</div>
                                        <div>
                                            <div className="user-item-name">{u.name}</div>
                                            <div className="user-item-email">{u.email}</div>
                                        </div>
                                    </div>
                                    <div className="user-item-actions">
                                        <span className={`role-badge ${u.role}`}>
                                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {formatDate(u.createdAt)}
                                        </span>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => setDeleteModal(u._id)}
                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <div className="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg></div>
                                <h3>No Users Found</h3>
                                <p>{search ? 'No users match your search' : 'No users in the system'}</p>
                            </div>
                        )}
                    </ul>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Add New User</h2>
                        <p>Create a new user account for the system.</p>

                        <form onSubmit={handleAddUser}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="add-name">Full Name</label>
                                <input
                                    id="add-name"
                                    className="form-input"
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
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
                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
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
                                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="At least 6 characters"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="add-role">Role</label>
                                <select
                                    id="add-role"
                                    className="form-select"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="principal">Principal</option>
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

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
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
