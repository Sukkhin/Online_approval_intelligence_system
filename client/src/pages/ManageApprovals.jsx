import { useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from '../hooks/useToast';

export default function ManageApprovals() {
    const [requests, setRequests] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [tab, setTab] = useState('Pending');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [modal, setModal] = useState(null);
    const [comment, setComment] = useState('');

    const { addToast, ToastContainer } = useToast();

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [tab, search, categoryFilter, requests]);

    const loadRequests = async () => {
        try {
            const res = await API.get('/requests');
            setRequests(res.data);
        } catch (err) {
            console.error('Load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        let result = [...requests];

        if (tab !== 'All') {
            result = result.filter((request) => request.status === tab);
        }

        if (categoryFilter !== 'all') {
            result = result.filter((request) => request.category === categoryFilter);
        }

        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter((request) =>
                request.title.toLowerCase().includes(query) ||
                request.description.toLowerCase().includes(query) ||
                request.submittedBy?.name?.toLowerCase().includes(query) ||
                request.submittedBy?.email?.toLowerCase().includes(query)
            );
        }

        setFiltered(result);
    };

    const openModal = (requestId, action) => {
        setModal({ requestId, action });
        setComment('');
    };

    const handleAction = async () => {
        if (!modal) return;

        const { requestId, action } = modal;
        setActionLoading(requestId);

        try {
            await API.put(`/requests/${requestId}/${action}`, { comment });
            addToast(`Request ${action}d successfully!`, 'success');
            setModal(null);
            setComment('');
            loadRequests();
        } catch (err) {
            addToast(err.response?.data?.message || `Failed to ${action} request`, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const tabs = ['Pending', 'Approved', 'Rejected', 'All'];
    const categories = ['Leave', 'On Duty (OD)', 'Internship', 'Event Permission', 'Hackathon', 'Project Work', 'Medical Leave', 'Fee Concession', 'Sick Leave', 'Other'];

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
            <ToastContainer />

            <div className="page-header">
                <h1>Manage Approvals</h1>
                <p>Review and process all submitted approval requests</p>
            </div>

            <div className="filter-summary animate-fadeIn">
                <span className="metric-pill">{filtered.length} requests in view</span>
                <span className="metric-pill metric-pill-muted">Current tab: {tab}</span>
            </div>

            <div className="filter-bar animate-fadeIn">
                <div className="tab-group">
                    {tabs.map((currentTab) => (
                        <button
                            key={currentTab}
                            className={`tab-btn ${tab === currentTab ? 'active' : ''}`}
                            onClick={() => setTab(currentTab)}
                            id={`tab-${currentTab.toLowerCase()}`}
                        >
                            {currentTab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-bar animate-fadeIn">
                <div className="search-bar" style={{ flex: 1 }}>
                    <span className="search-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
                    <input
                        type="text"
                        placeholder="Search by title, description, or user..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        id="search-approvals"
                    />
                </div>
                <select
                    className="filter-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    id="filter-category"
                >
                    <option value="all">All Categories</option>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
            </div>

            <div className="request-list stagger">
                {filtered.length > 0 ? (
                    filtered.map((req, index) => (
                        <div key={req._id} className="request-card" style={{ animationDelay: `${index * 0.05}s` }}>
                            <div className="request-card-header">
                                <span className="request-card-title">{req.title}</span>
                                <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                            </div>
                            <div className="request-card-desc">{req.description}</div>
                            <div className="request-card-meta">
                                <span className={`priority-badge priority-${req.priority.toLowerCase()}`}>
                                    {req.priority}
                                </span>
                                <span>{req.category}</span>
                                <span>{formatDate(req.createdAt)}</span>
                                <span>{req.submittedBy?.email}</span>
                            </div>

                            {req.adminComment && (
                                <div className="admin-comment-section">
                                    <div className="admin-comment-label">Admin Remark</div>
                                    <div className="admin-comment-text">{req.adminComment}</div>
                                </div>
                            )}

                            {req.status === 'Pending' && (
                                <div className="request-actions">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => openModal(req._id, 'approve')}
                                        disabled={actionLoading === req._id}
                                        id={`btn-approve-${req._id}`}
                                    >
                                        {actionLoading === req._id ? <span className="spinner"></span> : 'Approve'}
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => openModal(req._id, 'reject')}
                                        disabled={actionLoading === req._id}
                                        id={`btn-reject-${req._id}`}
                                    >
                                        {actionLoading === req._id ? <span className="spinner"></span> : 'Reject'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg></div>
                        <h3>No Requests Found</h3>
                        <p>{tab !== 'All' ? `No ${tab.toLowerCase()} requests at the moment` : 'No requests match your filters'}</p>
                    </div>
                )}
            </div>

            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className={`modal-hero ${modal.action === 'approve' ? 'approve' : 'reject'}`}>
                            <div className="modal-hero-icon">
                                {modal.action === 'approve' ? <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg> : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                            </div>
                            <h2>{modal.action === 'approve' ? 'Approve Request' : 'Reject Request'}</h2>
                        </div>

                        <p className="modal-copy">
                            Are you sure you want to <strong>{modal.action}</strong> this request? Please add your remarks below.
                        </p>

                        <div className="form-group">
                            <label className="form-label modal-label" htmlFor="modal-remark">
                                Remark <span>*required</span>
                            </label>
                            <textarea
                                id="modal-remark"
                                className="form-textarea"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={modal.action === 'approve'
                                    ? 'e.g., Approved. Please proceed as planned...'
                                    : 'e.g., Rejected due to insufficient documentation...'}
                                style={{ minHeight: '100px' }}
                            />
                            {!comment.trim() && (
                                <div className="form-error">
                                    Please provide a remark before {modal.action === 'approve' ? 'approving' : 'rejecting'}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setModal(null)}>
                                Cancel
                            </button>
                            <button
                                className={`btn ${modal.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                                onClick={handleAction}
                                disabled={actionLoading || !comment.trim()}
                            >
                                {actionLoading ? <span className="spinner"></span> : modal.action === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
