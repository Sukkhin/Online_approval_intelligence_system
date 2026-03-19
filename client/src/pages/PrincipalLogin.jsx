import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrincipalLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, login, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === 'principal') {
            navigate('/principal-overview', { replace: true });
        }
    }, [navigate, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const res = await login(email, password);
            if (res.user.role !== 'principal') {
                logout();
                setError('This portal is only for principal accounts.');
                return;
            }

            navigate('/principal-overview');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="auth-shell auth-shell-single">
                <div className="login-card auth-card animate-slideInRight">
                    <div className="login-brand">
                        <div className="login-brand-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#c28a3a" />
                                <path d="M12 3.19L5 6.3v4.7c0 4.56 3.15 8.82 7 9.88 3.85-1.06 7-5.32 7-9.88V6.3L12 3.19z" fill="#e3b56d" />
                                <path d="M11 16l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" fill="#ffffff" />
                            </svg>
                        </div>
                        <h1>Principal Sign In</h1>
                        <p>Enter your principal account details to continue.</p>
                    </div>

                    {error && <div className="login-error" id="principal-login-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="principal-login-email">Email Address</label>
                            <input
                                id="principal-login-email"
                                className="form-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="principal@example.com"
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="principal-login-password">Password</label>
                            <input
                                id="principal-login-password"
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
                            id="btn-principal-login"
                        >
                            {loading ? <span className="spinner"></span> : 'Enter Principal Portal'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <Link to="/login">Back to regular sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
