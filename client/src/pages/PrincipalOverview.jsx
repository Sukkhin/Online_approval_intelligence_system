import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function PrincipalOverview() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [userStats, setUserStats] = useState({ total: 0, admins: 0, principals: 0, users: 0 });
    const [analytics, setAnalytics] = useState(null);
    const [overdue, setOverdue] = useState([]);

    useEffect(() => {
        loadOverview();
    }, []);

    const loadOverview = async () => {
        try {
            const [requestsRes, userStatsRes, analyticsRes, overdueRes] = await Promise.all([
                API.get('/requests'),
                API.get('/users/stats'),
                API.get('/requests/analytics'),
                API.get('/sla/overdue')
            ]);

            setRequests(requestsRes.data);
            setUserStats(userStatsRes.data);
            setAnalytics(analyticsRes.data);
            setOverdue(overdueRes.data);
        } catch (err) {
            console.error('Principal overview load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div>
                <div className="page-header"><div className="skeleton skeleton-title"></div></div>
                <div className="stats-grid">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton skeleton-card" style={{ height: '100px' }}></div>)}</div>
            </div>
        );
    }

    const pendingRequests = requests.filter((request) => !['Approved', 'Rejected'].includes(request.status));
    const recentRequests = requests.slice(0, 5);
    const topBottlenecks = analytics?.pendingBottlenecks?.slice(0, 5) || [];

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    <h1>Principal Overview</h1>
                    <p>Full-system visibility across approvals, users, analytics, and SLA watchpoints.</p>
                </div>
                <div className="request-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => navigate('/manage-approvals')}>Open Approval Desk</button>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate('/user-management')}>Open User Management</button>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/analytics')}>Open Analytics</button>
                </div>
            </div>

            <div className="stats-grid stagger">
                <div className="stat-card">
                    <div>
                        <div className="stat-card-value">{requests.length}</div>
                        <div className="stat-card-label">All Requests</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div>
                        <div className="stat-card-value">{pendingRequests.length}</div>
                        <div className="stat-card-label">Open Requests</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div>
                        <div className="stat-card-value">{userStats.total}</div>
                        <div className="stat-card-label">Total Accounts</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div>
                        <div className="stat-card-value">{overdue.length}</div>
                        <div className="stat-card-label">Overdue / Escalated</div>
                    </div>
                </div>
            </div>

            <div className="stats-grid stagger">
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
                <div className="stat-card">
                    <div>
                        <div className="stat-card-value">{analytics?.approvalRate ?? 0}%</div>
                        <div className="stat-card-label">Approval Rate</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card animate-fadeInUp">
                    <div className="card-header"><h2>Recent Requests</h2></div>
                    <div className="card-body">
                        {recentRequests.length > 0 ? (
                            <ul className="activity-feed">
                                {recentRequests.map((request) => (
                                    <li key={request._id} className="activity-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/request/${request._id}`)}>
                                        <div>
                                            <div className="activity-title">{request.title}</div>
                                            <div className="activity-meta">
                                                {request.submittedBy?.name} · {formatDate(request.createdAt)} · {request.currentStage === 'completed' ? 'Completed' : 'Admin / Principal Review'}
                                            </div>
                                        </div>
                                        <span className={`badge badge-${request.status.toLowerCase().replace(' ', '-')}`}>{request.status}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="empty-state" style={{ padding: '24px' }}>
                                <p>No requests available yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card animate-fadeInUp" style={{ animationDelay: '0.08s' }}>
                    <div className="card-header"><h2>System Snapshot</h2></div>
                    <div className="card-body">
                        <div className="status-breakdown">
                            <div className="status-row">
                                <div className="status-row-left"><span className="badge badge-approved">Approved</span></div>
                                <div className="status-row-right"><strong>{analytics?.statusCount?.Approved || 0}</strong></div>
                            </div>
                            <div className="status-row">
                                <div className="status-row-left"><span className="badge badge-pending">Pending</span></div>
                                <div className="status-row-right"><strong>{analytics?.statusCount?.Pending || 0}</strong></div>
                            </div>
                            <div className="status-row">
                                <div className="status-row-left"><span className="badge badge-in-review">In Review</span></div>
                                <div className="status-row-right"><strong>{analytics?.statusCount?.['In Review'] || 0}</strong></div>
                            </div>
                            <div className="status-row">
                                <div className="status-row-left"><span className="badge badge-rejected">Rejected</span></div>
                                <div className="status-row-right"><strong>{analytics?.statusCount?.Rejected || 0}</strong></div>
                            </div>
                            <div className="status-row">
                                <div className="status-row-left"><span className="badge badge-escalated">Escalated</span></div>
                                <div className="status-row-right"><strong>{analytics?.statusCount?.Escalated || 0}</strong></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card animate-fadeInUp" style={{ animationDelay: '0.16s' }}>
                    <div className="card-header"><h2>Top Bottlenecks</h2></div>
                    <div className="card-body">
                        {topBottlenecks.length > 0 ? (
                            <ul className="bottleneck-list">
                                {topBottlenecks.map((item) => (
                                    <li key={item._id} className={`bottleneck-item ${item.escalated ? 'escalated' : ''}`}>
                                        <div>
                                            <div className="bottleneck-title">{item.title}</div>
                                            <div className="bottleneck-meta">{item.category} · {item.daysOpen} day{item.daysOpen !== 1 ? 's' : ''} open</div>
                                        </div>
                                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/request/${item._id}`)}>View</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="empty-state" style={{ padding: '24px' }}>
                                <p>No bottlenecks right now.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card animate-fadeInUp" style={{ animationDelay: '0.24s' }}>
                    <div className="card-header"><h2>Overdue Queue</h2></div>
                    <div className="card-body">
                        {overdue.length > 0 ? (
                            <ul className="bottleneck-list">
                                {overdue.slice(0, 5).map((request) => (
                                    <li key={request._id} className="bottleneck-item escalated">
                                        <div>
                                            <div className="bottleneck-title">{request.title}</div>
                                            <div className="bottleneck-meta">{request.submittedBy?.name} · due {formatDate(request.slaDeadline)}</div>
                                        </div>
                                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/request/${request._id}`)}>Open</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="empty-state" style={{ padding: '24px' }}>
                                <p>No overdue approvals at the moment.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
