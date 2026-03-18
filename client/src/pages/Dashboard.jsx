import { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, requestsRes] = await Promise.all([
                API.get('/requests/stats'),
                API.get('/requests')
            ]);
            setStats(statsRes.data);
            setRecent(requestsRes.data.slice(0, 6));
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'principal';

    const total = stats.total || 1;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const pendingPct = stats.pending / total;
    const approvedPct = stats.approved / total;
    const rejectedPct = stats.rejected / total;

    const pendingDash = pendingPct * circumference;
    const approvedDash = approvedPct * circumference;
    const rejectedDash = rejectedPct * circumference;

    const pendingOffset = 0;
    const approvedOffset = -pendingDash;
    const rejectedOffset = -(pendingDash + approvedDash);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <div className="skeleton skeleton-title"></div>
                    <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                </div>
                <div className="stats-grid stagger">
                    {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton skeleton-card" style={{ height: '120px' }}></div>)}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>{isAdmin ? 'Admin Dashboard' : 'My Dashboard'}</h1>
                <p>{isAdmin ? 'Overview of all approval requests in the system' : 'Track your submitted approval requests'}</p>
            </div>

            <div className="stats-grid stagger">
                <div className="stat-card" id="stat-total">
                    <div>
                        <div className="stat-card-label">Total Requests</div>
                        <div className="stat-card-value">{stats.total}</div>
                    </div>
                    <div className="stat-card-icon total"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div>
                </div>
                <div className="stat-card" id="stat-pending">
                    <div>
                        <div className="stat-card-label">Pending</div>
                        <div className="stat-card-value">{stats.pending}</div>
                    </div>
                    <div className="stat-card-icon pending"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg></div>
                </div>
                <div className="stat-card" id="stat-approved">
                    <div>
                        <div className="stat-card-label">Approved</div>
                        <div className="stat-card-value">{stats.approved}</div>
                    </div>
                    <div className="stat-card-icon approved"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" /></svg></div>
                </div>
                <div className="stat-card" id="stat-rejected">
                    <div>
                        <div className="stat-card-label">Rejected</div>
                        <div className="stat-card-value">{stats.rejected}</div>
                    </div>
                    <div className="stat-card-icon rejected"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                    <div className="card-header">
                        <h2>Status Distribution</h2>
                    </div>
                    <div className="donut-container">
                        {stats.total > 0 ? (
                            <>
                                <div className="donut-chart">
                                    <svg viewBox="0 0 200 200">
                                        <circle
                                            cx="100" cy="100" r={radius}
                                            stroke="var(--warning)"
                                            strokeDasharray={`${pendingDash} ${circumference - pendingDash}`}
                                            strokeDashoffset={pendingOffset}
                                        />
                                        <circle
                                            cx="100" cy="100" r={radius}
                                            stroke="var(--success)"
                                            strokeDasharray={`${approvedDash} ${circumference - approvedDash}`}
                                            strokeDashoffset={approvedOffset}
                                        />
                                        <circle
                                            cx="100" cy="100" r={radius}
                                            stroke="var(--danger)"
                                            strokeDasharray={`${rejectedDash} ${circumference - rejectedDash}`}
                                            strokeDashoffset={rejectedOffset}
                                        />
                                    </svg>
                                    <div className="donut-center">
                                        <div className="donut-center-value">{stats.total}</div>
                                        <div className="donut-center-label">Total</div>
                                    </div>
                                </div>
                                <div className="donut-legend">
                                    <div className="donut-legend-item">
                                        <div className="donut-legend-dot" style={{ background: 'var(--warning)' }}></div>
                                        Pending
                                    </div>
                                    <div className="donut-legend-item">
                                        <div className="donut-legend-dot" style={{ background: 'var(--success)' }}></div>
                                        Approved
                                    </div>
                                    <div className="donut-legend-item">
                                        <div className="donut-legend-dot" style={{ background: 'var(--danger)' }}></div>
                                        Rejected
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></svg></div>
                                <h3>No Data Yet</h3>
                                <p>Submit your first request to see statistics</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                    <div className="card-header">
                        <h2>Recent Activity</h2>
                    </div>
                    <div className="card-body">
                        {recent.length > 0 ? (
                            <ul className="activity-feed">
                                {recent.map((req, index) => (
                                    <li key={req._id} className="activity-item" style={{ animationDelay: `${index * 0.05}s` }}>
                                        <div>
                                            <div className="activity-title">{req.title}</div>
                                            <div className="activity-meta">
                                                {req.submittedBy?.email} | {formatDate(req.createdAt)}
                                            </div>
                                        </div>
                                        <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg></div>
                                <h3>No Activity</h3>
                                <p>No requests have been submitted yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
