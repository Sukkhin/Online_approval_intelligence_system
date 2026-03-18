import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="auth-shell">
                <section className="auth-showcase animate-slideInLeft">
                    <span className="auth-kicker">Approval intelligence system</span>
                    <h1>Guide every request through a calmer, clearer workflow.</h1>
                    <p>
                        ApprovalIQ keeps submissions, reviewers, and decisions in one tactile workspace
                        so users always know what is next.
                    </p>

                    <div className="auth-stat-row">
                        <div className="auth-stat">
                            <strong>1 place</strong>
                            <span>for requests, decisions, and remarks</span>
                        </div>
                        <div className="auth-stat">
                            <strong>Role-aware</strong>
                            <span>access for users, admins, and principals</span>
                        </div>
                    </div>

                    <div className="auth-feature-list">
                        <div className="auth-feature-item">
                            <span className="auth-feature-icon">01</span>
                            <div>
                                <strong>Track progress instantly</strong>
                                <p>See pending, approved, and rejected requests without digging.</p>
                            </div>
                        </div>
                        <div className="auth-feature-item">
                            <span className="auth-feature-icon">02</span>
                            <div>
                                <strong>Respond with confidence</strong>
                                <p>Structured request details make decisions easier and faster.</p>
                            </div>
                        </div>
                        <div className="auth-feature-item">
                            <span className="auth-feature-icon">03</span>
                            <div>
                                <strong>Stay aligned</strong>
                                <p>Remarks and status history reduce ambiguity for everyone.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="login-card auth-card animate-slideInRight">
                    <div className="login-brand">
                        <div className="login-brand-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#6a7681" />
                                <path d="M12 3.19L5 6.3v4.7c0 4.56 3.15 8.82 7 9.88 3.85-1.06 7-5.32 7-9.88V6.3L12 3.19z" fill="#8f9ba5" />
                                <path d="M11 16l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" fill="#ffffff" />
                            </svg>
                        </div>
                        <h1>Welcome back</h1>
                        <p>Sign in to continue managing approvals with clarity.</p>
                    </div>

                    {error && <div className="login-error" id="login-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-email">Email Address</label>
                            <input
                                id="login-email"
                                className="form-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="login-password">Password</label>
                            <input
                                id="login-password"
                                className="form-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-block"
                            disabled={loading}
                            id="btn-login"
                        >
                            {loading ? <span className="spinner"></span> : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-card-note">
                        Use the account assigned to you to access your dashboard and role-specific tools.
                    </div>

                    <div className="login-footer">
                        Don't have an account?{' '}
                        <Link to="/register">Create one</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
