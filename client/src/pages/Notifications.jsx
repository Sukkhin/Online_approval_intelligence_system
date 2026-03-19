import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useNotifications } from '../context/NotificationContext';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const { refreshCount } = useNotifications();

    useEffect(() => { loadNotifications(); }, [page]);

    const loadNotifications = async () => {
        try {
            const res = await API.get(`/notifications?page=${page}&limit=20`);
            setNotifications(res.data.notifications);
            setTotalPages(res.data.pages);
        } catch (err) {
            console.error('Load notifications error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await API.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            refreshCount();
        } catch (err) {
            console.error('Mark all read error:', err);
        }
    };

    const handleClick = async (notif) => {
        if (!notif.read) {
            try {
                await API.put(`/notifications/${notif._id}/read`);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
                refreshCount();
            } catch (err) { /* silent */ }
        }
        if (notif.relatedRequest) {
            navigate(`/request/${notif.relatedRequest._id || notif.relatedRequest}`);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const getTypeIcon = (type) => {
        const icons = {
            request_submitted: '📩',
            stage_approved: '✅',
            stage_rejected: '❌',
            comment_added: '💬',
            request_escalated: '⚠️',
            request_completed: '🎉'
        };
        return icons[type] || '🔔';
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div>
                <div className="page-header"><div className="skeleton skeleton-title"></div></div>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '70px' }}></div>)}
            </div>
        );
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>Notifications</h1>
                    <p>Stay on top of approvals, comments, and escalations</p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="notification-list stagger">
                {notifications.length > 0 ? (
                    notifications.map((notif, idx) => (
                        <div
                            key={notif._id}
                            className={`notification-item ${notif.read ? '' : 'unread'}`}
                            onClick={() => handleClick(notif)}
                            style={{ animationDelay: `${idx * 0.03}s`, cursor: 'pointer' }}
                        >
                            <span className="notification-type-icon">{getTypeIcon(notif.type)}</span>
                            <div className="notification-body">
                                <div className="notification-title">{notif.title}</div>
                                <div className="notification-message">{notif.message}</div>
                            </div>
                            <div className="notification-time">{formatDate(notif.createdAt)}</div>
                            {!notif.read && <span className="notification-unread-dot"></span>}
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <h3>All Caught Up</h3>
                        <p>No notifications at the moment</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                    <span className="pagination-info">Page {page} of {totalPages}</span>
                    <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
            )}
        </div>
    );
}
