import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

const stageLabels = { admin: 'Admin / Principal Review', completed: 'Completed' };
const stageOrder = ['admin', 'completed'];

export default function RequestDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToast, ToastContainer } = useToast();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    useEffect(() => { loadRequest(); }, [id]);

    const loadRequest = async () => {
        try {
            const res = await API.get(`/requests/${id}`);
            setRequest(res.data);
        } catch (err) {
            addToast('Failed to load request', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setCommentLoading(true);
        try {
            const res = await API.post(`/requests/${id}/comments`, { text: commentText });
            setRequest(prev => ({ ...prev, comments: res.data }));
            setCommentText('');
            addToast('Comment added', 'success');
            loadRequest();
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to add comment', 'error');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleReview = async () => {
        if (!reviewModal) return;
        setReviewLoading(true);
        try {
            await API.put(`/requests/${id}/review`, {
                action: reviewModal,
                comment: reviewComment
            });
            addToast(`Request ${reviewModal}d successfully!`, 'success');
            setReviewModal(null);
            setReviewComment('');
            loadRequest();
        } catch (err) {
            addToast(err.response?.data?.message || `Failed to ${reviewModal}`, 'error');
        } finally {
            setReviewLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    const getFileIcon = (mimetype) => {
        if (mimetype?.startsWith('image/')) return '🖼️';
        if (mimetype?.includes('pdf')) return '📄';
        if (mimetype?.includes('word') || mimetype?.includes('document')) return '📝';
        if (mimetype?.includes('excel') || mimetype?.includes('sheet')) return '📊';
        return '📎';
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'principal';
    const canReview = isAdmin && request &&
        request.currentStage !== 'completed' &&
        request.status !== 'Approved' && request.status !== 'Rejected';

    if (loading) {
        return (
            <div>
                <div className="page-header"><div className="skeleton skeleton-title"></div></div>
                <div className="skeleton skeleton-card" style={{ height: '300px' }}></div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="empty-state">
                <h3>Request Not Found</h3>
                <p>The request you're looking for doesn't exist or you don't have access.</p>
                <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    return (
        <div>
            <ToastContainer />

            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '8px' }}>
                        ← Back
                    </button>
                    <h1>{request.title}</h1>
                    <p>Submitted by {request.submittedBy?.name} on {formatDate(request.createdAt)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${request.status.toLowerCase().replace(' ', '-')}`}>
                        {request.status}
                    </span>
                    {request.escalated && <span className="badge badge-escalated">⚠ Escalated</span>}
                    <span className={`priority-badge priority-${request.priority.toLowerCase()}`}>
                        {request.priority}
                    </span>
                </div>
            </div>

            {/* Stage Progress Bar */}
            <div className="stage-progress animate-fadeIn">
                {stageOrder.map((stage, idx) => {
                    const chainEntry = request.approvalChain?.find(a => a.stage === stage);
                    const currentIdx = stageOrder.indexOf(request.currentStage);
                    const stageIdx = idx;
                    let stageStatus = 'upcoming';
                    if (chainEntry?.status === 'approved') stageStatus = 'approved';
                    else if (chainEntry?.status === 'rejected') stageStatus = 'rejected';
                    else if (stage === request.currentStage && request.status !== 'Approved' && request.status !== 'Rejected') stageStatus = 'current';
                    else if (stageIdx < currentIdx) stageStatus = 'approved';
                    if (stage === 'completed' && request.status === 'Approved') stageStatus = 'approved';

                    return (
                        <div key={stage} className={`stage-item stage-${stageStatus}`}>
                            <div className="stage-dot">
                                {stageStatus === 'approved' ? '✓' : stageStatus === 'rejected' ? '✕' : stageIdx + 1}
                            </div>
                            <div className="stage-label">{stageLabels[stage]}</div>
                            {chainEntry?.reviewedBy && (
                                <div className="stage-reviewer">{chainEntry.reviewedBy.name}</div>
                            )}
                            {idx < stageOrder.length - 1 && <div className={`stage-line stage-line-${stageStatus}`}></div>}
                        </div>
                    );
                })}
            </div>

            <div className="detail-grid">
                {/* Left Column */}
                <div className="detail-main">
                    {/* Description */}
                    <div className="card animate-fadeInUp">
                        <div className="card-header"><h2>Description</h2></div>
                        <div className="card-body">
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{request.description}</p>
                            <div className="request-card-meta" style={{ marginTop: '16px' }}>
                                <span>{request.category}</span>
                                {request.slaDeadline && (
                                    <span>SLA: {formatDate(request.slaDeadline)}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    {request.attachments?.length > 0 && (
                        <div className="card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                            <div className="card-header"><h2>Attachments ({request.attachments.length})</h2></div>
                            <div className="card-body">
                                <div className="attachment-list">
                                    {request.attachments.map((att, i) => (
                                        <a
                                            key={i}
                                            href={`/uploads/${att.filename}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="attachment-item"
                                        >
                                            <span className="attachment-icon">{getFileIcon(att.mimetype)}</span>
                                            <div className="attachment-info">
                                                <span className="attachment-name">{att.originalName}</span>
                                                <span className="attachment-size">{formatFileSize(att.size)}</span>
                                            </div>
                                            <span className="attachment-download">↓</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comments Thread */}
                    <div className="card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                        <div className="card-header"><h2>Discussion ({request.comments?.length || 0})</h2></div>
                        <div className="card-body">
                            {request.comments?.length > 0 ? (
                                <div className="comment-thread">
                                    {request.comments.map((c) => (
                                        <div key={c._id} className="comment-item">
                                            <div className="comment-avatar">
                                                {c.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="comment-body">
                                                <div className="comment-header">
                                                    <strong>{c.user?.name}</strong>
                                                    <span className={`role-badge ${c.user?.role}`}>
                                                        {c.user?.role?.charAt(0).toUpperCase() + c.user?.role?.slice(1)}
                                                    </span>
                                                    <span className="comment-time">{formatDate(c.createdAt)}</span>
                                                </div>
                                                <p className="comment-text">{c.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: '24px' }}>
                                    <p>No comments yet. Start the conversation.</p>
                                </div>
                            )}

                            <form onSubmit={handleAddComment} className="comment-form">
                                <textarea
                                    className="form-textarea"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    style={{ minHeight: '80px' }}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm"
                                    disabled={commentLoading || !commentText.trim()}
                                >
                                    {commentLoading ? <span className="spinner"></span> : 'Post Comment'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="detail-sidebar">
                    {/* Review Actions */}
                    {canReview && (
                        <div className="card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                            <div className="card-header"><h2>Review Actions</h2></div>
                            <div className="card-body">
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                    Current stage: <strong>{stageLabels[request.currentStage]}</strong>
                                </p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => setReviewModal('approve')}>
                                        Approve
                                    </button>
                                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => setReviewModal('reject')}>
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Audit Trail */}
                    <div className="card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                        <div className="card-header"><h2>Timeline</h2></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <div className="timeline">
                                {(request.auditTrail || []).slice().reverse().map((entry, i) => (
                                    <div key={i} className="timeline-item">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <div className="timeline-action">{entry.action}</div>
                                            <div className="timeline-detail">{entry.details}</div>
                                            <div className="timeline-meta">
                                                {entry.performedBy?.name || 'System'} · {formatDate(entry.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Approval Chain */}
                    <div className="card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                        <div className="card-header"><h2>Approval Chain</h2></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <ul className="chain-list">
                                {(request.approvalChain || []).map((stage, i) => (
                                    <li key={i} className={`chain-item chain-${stage.status}`}>
                                        <div className="chain-stage">{stageLabels[stage.stage]}</div>
                                        <span className={`badge badge-${stage.status}`}>{stage.status}</span>
                                        {stage.reviewedBy && (
                                            <div className="chain-reviewer">
                                                {stage.reviewedBy.name} · {formatDate(stage.reviewedAt)}
                                            </div>
                                        )}
                                        {stage.comment && <div className="chain-comment">"{stage.comment}"</div>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {reviewModal && (
                <div className="modal-overlay" onClick={() => setReviewModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className={`modal-hero ${reviewModal}`}>
                            <div className="modal-hero-icon">
                                {reviewModal === 'approve'
                                    ? <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                                    : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                }
                            </div>
                            <h2>{reviewModal === 'approve' ? 'Approve' : 'Reject'} at {stageLabels[request.currentStage]}</h2>
                        </div>
                        <p className="modal-copy">
                            Are you sure you want to <strong>{reviewModal}</strong> this request at the {stageLabels[request.currentStage]} stage?
                        </p>
                        <div className="form-group">
                            <label className="form-label modal-label" htmlFor="review-remark">Remark</label>
                            <textarea
                                id="review-remark"
                                className="form-textarea"
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder={reviewModal === 'approve' ? 'Approved. Proceed as planned...' : 'Rejected due to...'}
                                style={{ minHeight: '100px' }}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setReviewModal(null)}>Cancel</button>
                            <button
                                className={`btn ${reviewModal === 'approve' ? 'btn-success' : 'btn-danger'}`}
                                onClick={handleReview}
                                disabled={reviewLoading}
                            >
                                {reviewLoading ? <span className="spinner"></span> : reviewModal === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
