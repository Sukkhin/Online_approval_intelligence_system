import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.name || !form.email || !form.password) {
            setError('Please fill in all fields');
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await register(form.name, form.email, form.password, 'admin');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <div className="login-brand-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#3f4849" />
                            <path d="M12 3.19L5 6.3v4.7c0 4.56 3.15 8.82 7 9.88 3.85-1.06 7-5.32 7-9.88V6.3L12 3.19z" fill="#596465" />
                            <path d="M11 16l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" fill="#ffffff" />
                        </svg>
                    </div>
                    <h1>ApprovalIQ</h1>
                    <p>Create your account</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-name">Full Name</label>
                        <input
                            id="reg-name"
                            name="name"
                            className="form-input"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your full name"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-email">Email Address</label>
                        <input
                            id="reg-email"
                            name="email"
                            className="form-input"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            name="password"
                            className="form-input"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="At least 6 characters"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                        <input
                            id="reg-confirm"
                            name="confirmPassword"
                            className="form-input"
                            type="password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-block"
                        disabled={loading}
                        id="btn-register"
                    >
                        {loading ? <span className="spinner"></span> : 'Create Account'}
                    </button>
                </form>

                <div className="login-footer">
                    Already have an account?{' '}
                    <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
