const mongoose = require('mongoose');

const approvalStageSchema = new mongoose.Schema({
    stage: {
        type: String,
        enum: ['admin'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    comment: {
        type: String,
        default: ''
    }
}, { _id: false });

const auditEntrySchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const attachmentSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const requestSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    category: {
        type: String,
        enum: ['Leave', 'On Duty (OD)', 'Internship', 'Event Permission', 'Hackathon', 'Project Work', 'Medical Leave', 'Fee Concession', 'Sick Leave', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Review', 'Approved', 'Rejected', 'Escalated'],
        default: 'Pending'
    },
    currentStage: {
        type: String,
        enum: ['admin', 'completed'],
        default: 'admin'
    },
    approvalChain: [approvalStageSchema],
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attachments: [attachmentSchema],
    comments: [commentSchema],
    auditTrail: [auditEntrySchema],
    slaDeadline: {
        type: Date
    },
    escalated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);
