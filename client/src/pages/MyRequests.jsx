import { useState, useEffect } from 'react';
import API from '../services/api';

export default function MyRequests() {
    const [requests, setRequests] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [search, statusFilter, requests]);

    const loadRequests = async () => {
        try {
            const res = await API.get('/requests/my');
            setRequests(res.data);
        } catch (err) {
            console.error('Load requests error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        let result = [...requests];

        if (statusFilter !== 'all') {
            result = result.filter(r => r.status === statusFilter);
        }

        if (search.trim()) {
            const s = search.toLowerCase();
            result = result.filter(r =>
                r.title.toLowerCase().includes(s) ||
                r.description.toLowerCase().includes(s)
            );
        }

        setFiltered(result);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <div className="skeleton skeleton-title"></div>
                </div>
                {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '120px' }}></div>)}
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>My Requests</h1>
                <p>View and track all your submitted approval requests</p>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar animate-fadeIn">
                <div className="search-bar" style={{ flex: 1 }}>
                    <span className="search-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        id="search-my-requests"
                    />
                </div>
                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    id="filter-status"
                >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            {/* Request List */}
            <div className="request-list stagger">
                {filtered.length > 0 ? (
                    filtered.map((req, i) => (
                        <div key={req._id} className="request-card" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="request-card-header">
                                <span className="request-card-title">{req.title}</span>
                                <span className={`badge badge-${req.status.toLowerCase()}`}>

                                    {req.status}
                                </span>
                            </div>
                            <div className="request-card-desc">{req.description}</div>
                            <div className="request-card-meta">
                                <span className={`priority-badge priority-${req.priority.toLowerCase()}`}>
                                    {req.priority}
                                </span>
                                <span>{req.category}</span>
                                <span>• {formatDate(req.createdAt)}</span>
                                <span>• {req.submittedBy?.email}</span>
                            </div>
                            {req.adminComment && (
                                <div className="admin-comment-section">
                                    <div className="admin-comment-label">Admin Remark</div>
                                    <div className="admin-comment-text">{req.adminComment}</div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg></div>
                        <h3>No Requests Found</h3>
                        <p>{search ? 'Try a different search term' : 'You haven\'t submitted any requests yet'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
