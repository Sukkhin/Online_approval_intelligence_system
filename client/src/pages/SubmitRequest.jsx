import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../hooks/useToast';

export default function SubmitRequest() {
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'Leave'
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { addToast, ToastContainer } = useToast();

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Request title is required';
        if (!form.description.trim()) newErrors.description = 'Description is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await API.post('/requests', form);
            addToast('Request submitted successfully!', 'success');
            setTimeout(() => navigate('/my-requests'), 1200);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to submit request', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ToastContainer />

            <div className="page-header">
                <h1>New Approval Request</h1>
                <p>Fill in the details below to submit your request for review.</p>
            </div>

            <div className="card animate-fadeInUp" style={{ maxWidth: '720px' }}>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="req-title">Request Title</label>
                            <input
                                id="req-title"
                                name="title"
                                className="form-input"
                                type="text"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g., Budget approval for Q2 marketing campaign"
                            />
                            {errors.title && <div className="form-error">{errors.title}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="req-desc">Description</label>
                            <textarea
                                id="req-desc"
                                name="description"
                                className="form-textarea"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Provide a detailed description of your request, including any relevant context or requirements..."
                            />
                            {errors.description && <div className="form-error">{errors.description}</div>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="req-priority">Priority</label>
                                <select
                                    id="req-priority"
                                    name="priority"
                                    className="form-select"
                                    value={form.priority}
                                    onChange={handleChange}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="req-category">Category</label>
                                <select
                                    id="req-category"
                                    name="category"
                                    className="form-select"
                                    value={form.category}
                                    onChange={handleChange}
                                >
                                    <option value="Leave">Leave</option>
                                    <option value="On Duty (OD)">On Duty (OD)</option>
                                    <option value="Internship">Internship</option>
                                    <option value="Event Permission">Event Permission</option>
                                    <option value="Hackathon">Hackathon</option>
                                    <option value="Project Work">Project Work</option>
                                    <option value="Medical Leave">Medical Leave</option>
                                    <option value="Fee Concession">Fee Concession</option>
                                    <option value="Hostel Leave">Hostel Leave</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-block"
                            disabled={loading}
                            id="btn-submit-request"
                            style={{ marginTop: '8px' }}
                        >
                            {loading ? <span className="spinner"></span> : <>Submit Request</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
