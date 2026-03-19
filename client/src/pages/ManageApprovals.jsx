import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

const stageLabels = { admin: 'Admin / Principal', completed: 'Done' };
const stageOrder = ['admin', 'completed'];

export default function ManageApprovals() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [tab, setTab] = useState('Pending');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [modal, setModal] = useState(null);
    const [comment, setComment] = useState('');
    const navigate = useNavigate();

    const { addToast, ToastContainer } = useToast();

    useEffect(() => { loadRequests(); }, []);
    useEffect(() => { filterRequests(); }, [tab, search, categoryFilter, requests]);

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
            await API.put(`/requests/${requestId}/review`, { action, comment });
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

    const canReview = (request) => {
        if (request.status === 'Approved' || request.status === 'Rejected') return false;
        if (request.currentStage === 'completed') return false;
        return user?.role === 'admin' || user?.role === 'principal';
    };

    const tabs = ['Pending', 'In Review', 'Escalated', 'Approved', 'Rejected', 'All'];
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
                <p>Review and process submitted approval requests.</p>
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
                            id={`tab-${currentTab.toLowerCase().replace(' ', '-')}`}
                        >
                            {currentTab}
                            {currentTab === 'Escalated' && requests.filter((request) => request.status === 'Escalated').length > 0 && (
                                <span className="tab-badge">{requests.filter((request) => request.status === 'Escalated').length}</span>
                            )}
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
                    filtered.map((request, index) => (
                        <div key={request._id} className="request-card" style={{ animationDelay: `${index * 0.05}s` }}>
                            <div className="request-card-header">
                                <span
                                    className="request-card-title request-card-title-link"
                                    onClick={() => navigate(`/request/${request._id}`)}
                                >
                                    {request.title}
                                </span>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    {request.escalated && <span className="badge badge-escalated">SLA</span>}
                                    <span className={`badge badge-${request.status.toLowerCase().replace(' ', '-')}`}>{request.status}</span>
                                </div>
                            </div>
                            <div className="request-card-desc">{request.description}</div>

                            <div className="mini-stage-bar">
                                {stageOrder.map((stage) => {
                                    const chainEntry = request.approvalChain?.find((entry) => entry.stage === stage);
                                    let cls = 'upcoming';
                                    if (chainEntry?.status === 'approved') cls = 'approved';
                                    else if (chainEntry?.status === 'rejected') cls = 'rejected';
                                    else if (stage === request.currentStage && request.status !== 'Approved' && request.status !== 'Rejected') cls = 'current';
                                    if (stage === 'completed' && request.status === 'Approved') cls = 'approved';
                                    return (
                                        <div key={stage} className={`mini-stage mini-stage-${cls}`}>
                                            <div className="mini-stage-dot"></div>
                                            <span>{stageLabels[stage]}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="request-card-meta">
                                <span className={`priority-badge priority-${request.priority.toLowerCase()}`}>{request.priority}</span>
                                <span>{request.category}</span>
                                <span>{formatDate(request.createdAt)}</span>
                                <span>{request.submittedBy?.name}</span>
                                {request.attachments?.length > 0 && <span>Files: {request.attachments.length}</span>}
                                {request.comments?.length > 0 && <span>Comments: {request.comments.length}</span>}
                            </div>

                            {canReview(request) && (
                                <div className="request-actions">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => openModal(request._id, 'approve')}
                                        disabled={actionLoading === request._id}
                                        id={`btn-approve-${request._id}`}
                                    >
                                        {actionLoading === request._id ? <span className="spinner"></span> : `Approve (${stageLabels[request.currentStage]})`}
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => openModal(request._id, 'reject')}
                                        disabled={actionLoading === request._id}
                                        id={`btn-reject-${request._id}`}
                                    >
                                        {actionLoading === request._id ? <span className="spinner"></span> : 'Reject'}
                                    </button>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => navigate(`/request/${request._id}`)}
                                    >
                                        View Details
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
                                {modal.action === 'approve'
                                    ? <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                                    : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                }
                            </div>
                            <h2>{modal.action === 'approve' ? 'Approve Request' : 'Reject Request'}</h2>
                        </div>

                        <p className="modal-copy">
                            Are you sure you want to <strong>{modal.action}</strong> this request? Please add your remarks below.
                        </p>

                        <div className="form-group">
                            <label className="form-label modal-label" htmlFor="modal-remark">
                                Remark <span>*recommended</span>
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
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
                            <button
                                className={`btn ${modal.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                                onClick={handleAction}
                                disabled={actionLoading}
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
