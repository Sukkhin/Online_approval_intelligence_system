import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const stageLabels = { admin: 'Admin / Principal', completed: 'Done' };
const stageOrder = ['admin', 'completed'];

export default function MyRequests() {
    const [requests, setRequests] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => { loadRequests(); }, []);

    useEffect(() => { filterRequests(); }, [search, statusFilter, requests]);

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
            result = result.filter((request) => request.status === statusFilter);
        }
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter((request) =>
                request.title.toLowerCase().includes(query) ||
                request.description.toLowerCase().includes(query)
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
                <div className="page-header"><div className="skeleton skeleton-title"></div></div>
                {[1, 2, 3].map((item) => <div key={item} className="skeleton skeleton-card" style={{ height: '120px' }}></div>)}
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>My Requests</h1>
                <p>View and track all your submitted approval requests</p>
            </div>

            <div className="filter-summary animate-fadeIn">
                <span className="metric-pill">{filtered.length} visible</span>
                <span className="metric-pill metric-pill-muted">{requests.length} total requests</span>
            </div>

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
                    <option value="In Review">In Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Escalated">Escalated</option>
                </select>
            </div>

            <div className="request-list stagger">
                {filtered.length > 0 ? (
                    filtered.map((req, index) => (
                        <div
                            key={req._id}
                            className="request-card request-card-clickable"
                            style={{ animationDelay: `${index * 0.05}s` }}
                            onClick={() => navigate(`/request/${req._id}`)}
                        >
                            <div className="request-card-header">
                                <span className="request-card-title">{req.title}</span>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    {req.escalated && <span className="badge badge-escalated">⚠ SLA</span>}
                                    <span className={`badge badge-${req.status.toLowerCase().replace(' ', '-')}`}>{req.status}</span>
                                </div>
                            </div>
                            <div className="request-card-desc">{req.description}</div>

                            {/* Mini Stage Progress */}
                            <div className="mini-stage-bar">
                                {stageOrder.map((stage, idx) => {
                                    const chainEntry = req.approvalChain?.find(a => a.stage === stage);
                                    let cls = 'upcoming';
                                    if (chainEntry?.status === 'approved') cls = 'approved';
                                    else if (chainEntry?.status === 'rejected') cls = 'rejected';
                                    else if (stage === req.currentStage && req.status !== 'Approved' && req.status !== 'Rejected') cls = 'current';
                                    if (stage === 'completed' && req.status === 'Approved') cls = 'approved';
                                    return (
                                        <div key={stage} className={`mini-stage mini-stage-${cls}`}>
                                            <div className="mini-stage-dot"></div>
                                            <span>{stageLabels[stage]}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="request-card-meta">
                                <span className={`priority-badge priority-${req.priority.toLowerCase()}`}>{req.priority}</span>
                                <span>{req.category}</span>
                                <span>{formatDate(req.createdAt)}</span>
                                {req.attachments?.length > 0 && <span>📎 {req.attachments.length}</span>}
                                {req.comments?.length > 0 && <span>💬 {req.comments.length}</span>}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg></div>
                        <h3>No Requests Found</h3>
                        <p>{search ? 'Try a different search term' : 'You have not submitted any requests yet'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
