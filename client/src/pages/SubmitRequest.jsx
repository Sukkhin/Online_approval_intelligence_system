import { useState, useRef } from 'react';
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
    const [files, setFiles] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const navigate = useNavigate();
    const { addToast, ToastContainer } = useToast();

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) {
            setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const handleFiles = (newFiles) => {
        const fileArray = Array.from(newFiles);
        const validFiles = fileArray.filter((file) => {
            const allowed = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain'
            ];

            if (!allowed.includes(file.type)) {
                addToast(`"${file.name}" is not a supported file type`, 'error');
                return false;
            }

            if (file.size > 10 * 1024 * 1024) {
                addToast(`"${file.name}" exceeds 10 MB limit`, 'error');
                return false;
            }

            return true;
        });

        setFiles((prev) => {
            const combined = [...prev, ...validFiles];
            if (combined.length > 5) {
                addToast('Maximum 5 files allowed', 'error');
                return combined.slice(0, 5);
            }
            return combined;
        });
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
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
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('priority', form.priority);
            formData.append('category', form.category);
            files.forEach((file) => formData.append('files', file));

            await API.post('/requests', formData);
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

            <div className="info-banner info-banner-soft animate-fadeIn">
                <div className="info-banner-icon info-banner-icon-soft">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
                <span>Your request will be reviewed by an admin or principal. Attach supporting documents for faster approval.</span>
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
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Attachments (optional)</label>
                            <div
                                className={`dropzone ${dragOver ? 'dragover' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFiles(e.target.files)}
                                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
                                />
                                <div className="dropzone-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17,8 12,3 7,8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <p className="dropzone-text">Drag & drop files here, or <strong>click to browse</strong></p>
                                <p className="dropzone-hint">PDF, images, Word, Excel - Max 10 MB each - Up to 5 files</p>
                            </div>

                            {files.length > 0 && (
                                <div className="file-list">
                                    {files.map((file, index) => (
                                        <div key={index} className="file-item">
                                            <span className="file-item-name">{file.name}</span>
                                            <span className="file-item-size">{formatFileSize(file.size)}</span>
                                            <button type="button" className="file-item-remove" onClick={() => removeFile(index)}>x</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-block"
                            disabled={loading}
                            id="btn-submit-request"
                            style={{ marginTop: '8px' }}
                        >
                            {loading ? <span className="spinner"></span> : 'Submit Request'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
