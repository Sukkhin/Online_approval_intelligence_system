import { useState, useEffect } from 'react';
import API from '../services/api';

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadAnalytics(); }, []);

    const loadAnalytics = async () => {
        try {
            const res = await API.get('/requests/analytics');
            setData(res.data);
        } catch (err) {
            console.error('Analytics load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (!data) return;

        const escapeCsvValue = (value) => {
            const text = value == null ? '' : String(value);
            return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        };

        const rows = [['Metric', 'Value']];
        rows.push(['Total Requests', data.totalRequests]);
        rows.push(['Approval Rate', data.approvalRate + '%']);
        rows.push(['Avg Turnaround (hours)', data.avgTurnaround]);
        rows.push(['SLA Compliance', data.slaCompliance + '%']);
        rows.push([]);
        rows.push(['Status', 'Count']);
        Object.entries(data.statusCount).forEach(([key, value]) => rows.push([key, value]));
        rows.push([]);
        rows.push(['Category', 'Count']);
        Object.entries(data.categoryCount).forEach(([key, value]) => rows.push([key, value]));
        rows.push([]);
        rows.push(['Bottleneck Request', 'Days Open', 'Stage', 'Escalated']);
        (data.pendingBottlenecks || []).forEach((item) => rows.push([
            item.title,
            item.daysOpen,
            item.currentStage,
            item.escalated ? 'Yes' : 'No'
        ]));

        const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `approvaliq-report-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div>
                <div className="page-header"><div className="skeleton skeleton-title"></div></div>
                <div className="stats-grid">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton skeleton-card" style={{ height: '100px' }}></div>)}</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="empty-state">
                <h3>Analytics Unavailable</h3>
                <p>Could not load analytics data.</p>
            </div>
        );
    }

    const maxCategoryCount = Math.max(...Object.values(data.categoryCount), 1);
    const monthlyKeys = Object.keys(data.monthlyTrends);
    const maxMonthly = Math.max(
        ...monthlyKeys.map((key) => Math.max(
            data.monthlyTrends[key].submitted,
            data.monthlyTrends[key].approved,
            data.monthlyTrends[key].rejected
        )),
        1
    );

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1>Analytics & Reports</h1>
                    <p>Insights into approval workflows, trends, and bottlenecks</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={downloadCSV}>
                    Download CSV
                </button>
            </div>

            <div className="stats-grid stagger">
                <div className="stat-card" id="stat-approval-rate">
                    <div>
                        <div className="stat-card-label">Approval Rate</div>
                        <div className="stat-card-value">{data.approvalRate}%</div>
                    </div>
                    <div className="stat-card-icon approved">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" /></svg>
                    </div>
                </div>
                <div className="stat-card" id="stat-turnaround">
                    <div>
                        <div className="stat-card-label">Avg Turnaround</div>
                        <div className="stat-card-value">{data.avgTurnaround}h</div>
                    </div>
                    <div className="stat-card-icon pending">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
                    </div>
                </div>
                <div className="stat-card" id="stat-sla">
                    <div>
                        <div className="stat-card-label">SLA Compliance</div>
                        <div className="stat-card-value">{data.slaCompliance}%</div>
                    </div>
                    <div className="stat-card-icon total">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l7 4v6c0 5-3.4 9.4-7 10-3.6-.6-7-5-7-10V6l7-4z" /></svg>
                    </div>
                </div>
                <div className="stat-card" id="stat-total-analytics">
                    <div>
                        <div className="stat-card-label">Total Requests</div>
                        <div className="stat-card-value">{data.totalRequests}</div>
                    </div>
                    <div className="stat-card-icon total">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                    <div className="card-header"><h2>Requests by Category</h2></div>
                    <div className="card-body">
                        <div className="bar-chart">
                            {Object.entries(data.categoryCount).map(([category, count]) => (
                                <div key={category} className="bar-row">
                                    <span className="bar-label">{category}</span>
                                    <div className="bar-track">
                                        <div className="bar-fill" style={{ width: `${(count / maxCategoryCount) * 100}%` }}></div>
                                    </div>
                                    <span className="bar-value">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                    <div className="card-header"><h2>Status Breakdown</h2></div>
                    <div className="card-body">
                        <div className="status-breakdown">
                            {Object.entries(data.statusCount).filter(([, value]) => value > 0).map(([status, count]) => (
                                <div key={status} className="status-row">
                                    <div className="status-row-left">
                                        <span className={`badge badge-${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
                                    </div>
                                    <div className="status-row-right">
                                        <strong>{count}</strong>
                                        <span className="status-pct">
                                            ({data.totalRequests > 0 ? Math.round((count / data.totalRequests) * 100) : 0}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {monthlyKeys.length > 0 && (
                    <div className="card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                        <div className="card-header"><h2>Monthly Trends</h2></div>
                        <div className="card-body">
                            <div className="trend-chart">
                                {monthlyKeys.map((month) => (
                                    <div key={month} className="trend-col">
                                        <div className="trend-bars">
                                            <div className="trend-bar trend-submitted" style={{ height: `${(data.monthlyTrends[month].submitted / maxMonthly) * 100}%` }} title={`Submitted: ${data.monthlyTrends[month].submitted}`}></div>
                                            <div className="trend-bar trend-approved" style={{ height: `${(data.monthlyTrends[month].approved / maxMonthly) * 100}%` }} title={`Approved: ${data.monthlyTrends[month].approved}`}></div>
                                            <div className="trend-bar trend-rejected" style={{ height: `${(data.monthlyTrends[month].rejected / maxMonthly) * 100}%` }} title={`Rejected: ${data.monthlyTrends[month].rejected}`}></div>
                                        </div>
                                        <span className="trend-label">{month}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="trend-legend">
                                <span><span className="trend-dot trend-submitted-dot"></span>Submitted</span>
                                <span><span className="trend-dot trend-approved-dot"></span>Approved</span>
                                <span><span className="trend-dot trend-rejected-dot"></span>Rejected</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                    <div className="card-header"><h2>Pending Bottlenecks</h2></div>
                    <div className="card-body">
                        {data.pendingBottlenecks?.length > 0 ? (
                            <ul className="bottleneck-list">
                                {data.pendingBottlenecks.map((item) => (
                                    <li key={item._id} className={`bottleneck-item ${item.escalated ? 'escalated' : ''}`}>
                                        <div>
                                            <div className="bottleneck-title">{item.title}</div>
                                            <div className="bottleneck-meta">
                                                {item.category} | Stage: {item.currentStage} | {item.daysOpen} day{item.daysOpen !== 1 ? 's' : ''} open
                                            </div>
                                        </div>
                                        {item.escalated && <span className="badge badge-escalated">SLA Escalated</span>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="empty-state" style={{ padding: '24px' }}>
                                <p>No pending bottlenecks - all requests flowing smoothly.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
