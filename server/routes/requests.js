const express = require('express');
const mongoose = require('mongoose');
const Request = require('../models/Request');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { validateRequest, validateComment, validateReview, validate } = require('../middleware/validators');
const upload = require('../middleware/upload');
const {
    ACTIVE_REVIEW_STAGE,
    COMPLETED_STAGE,
    normalizeWorkflowResponse,
    syncWorkflowDocument,
    buildApprovalChain,
    getReviewerRolesForStage,
    canReviewStage
} = require('../utils/workflow');

const router = express.Router();

function hasValidRequestId(id) {
    return mongoose.isValidObjectId(id);
}

// Helper: create notification for specific users
async function notify(userIds, type, title, message, requestId) {
    if (!userIds.length) return;
    const docs = userIds.map(uid => ({
        user: uid,
        type,
        title,
        message,
        relatedRequest: requestId
    }));
    await Notification.insertMany(docs);
}

// Helper: get user IDs by role
async function getUsersByRole(...roles) {
    const expandedRoles = roles.flatMap((role) => role === 'admin' ? ['admin', 'faculty'] : [role]);
    const users = await User.find({ role: { $in: expandedRoles }, isActive: true }).select('_id');
    return users.map(u => u._id);
}

// @route   POST /api/requests
// @desc    Create a new approval request with optional file attachments
// @access  Private
router.post('/', auth, upload.array('files', 5), validateRequest, validate, async (req, res) => {
    try {
        const { title, description, priority, category } = req.body;
        const normalizedPriority = priority || 'Medium';
        const normalizedCategory = category || 'Other';

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const attachments = (req.files || []).map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        }));

        // SLA: 3 business days from now
        const slaDeadline = new Date();
        slaDeadline.setDate(slaDeadline.getDate() + 3);

        const request = new Request({
            title: title.trim(),
            description: description.trim(),
            priority: normalizedPriority,
            category: normalizedCategory,
            submittedBy: req.user._id,
            attachments,
            currentStage: ACTIVE_REVIEW_STAGE,
            status: 'Pending',
            slaDeadline,
            approvalChain: buildApprovalChain(),
            auditTrail: [{
                action: 'Request Created',
                performedBy: req.user._id,
                details: `Request "${title.trim()}" submitted under ${normalizedCategory} category with ${normalizedPriority} priority.`
            }]
        });

        await request.save();
        await request.populate('submittedBy', 'name email');

        const reviewerIds = await getUsersByRole(...getReviewerRolesForStage(ACTIVE_REVIEW_STAGE));
        await notify(
            reviewerIds,
            'request_submitted',
            'New Request Submitted',
            `${req.user.name} submitted "${title.trim()}" for review`,
            request._id
        );

        res.status(201).json(normalizeWorkflowResponse(request));
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({ message: 'Server error creating request' });
    }
});

// @route   GET /api/requests
// @desc    Get all requests (admin) or user's own requests
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'user') {
            filter.submittedBy = req.user._id;
        }

        if (req.query.status && req.query.status !== 'all') {
            filter.status = req.query.status;
        }

        if (req.query.category && req.query.category !== 'all') {
            filter.category = req.query.category;
        }

        if (req.query.stage && req.query.stage !== 'all') {
            filter.currentStage = req.query.stage;
        }

        const requests = await Request.find(filter)
            .populate('submittedBy', 'name email')
            .populate('approvalChain.reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(requests.map((request) => normalizeWorkflowResponse(request)));
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ message: 'Server error fetching requests' });
    }
});

// @route   GET /api/requests/my
// @desc    Get current user's requests only
// @access  Private
router.get('/my', auth, async (req, res) => {
    try {
        let filter = { submittedBy: req.user._id };

        if (req.query.status && req.query.status !== 'all') {
            filter.status = req.query.status;
        }

        const requests = await Request.find(filter)
            .populate('submittedBy', 'name email')
            .populate('approvalChain.reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(requests.map((request) => normalizeWorkflowResponse(request)));
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ message: 'Server error fetching your requests' });
    }
});

// @route   GET /api/requests/stats
// @desc    Get request statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
    try {
        const filter = {};
        if (req.user.role === 'user') {
            filter.submittedBy = req.user._id;
        }

        const requests = await Request.find(filter).lean();
        const normalizedRequests = requests.map(normalizeWorkflowResponse);

        const total = normalizedRequests.length;
        const pending = normalizedRequests.filter((request) => request.status === 'Pending').length;
        const inReview = normalizedRequests.filter((request) => request.status === 'In Review').length;
        const approved = normalizedRequests.filter((request) => request.status === 'Approved').length;
        const rejected = normalizedRequests.filter((request) => request.status === 'Rejected').length;
        const escalated = normalizedRequests.filter((request) => request.escalated && !['Approved', 'Rejected'].includes(request.status)).length;

        res.json({ total, pending, inReview, approved, rejected, escalated });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error fetching stats' });
    }
});

// @route   GET /api/requests/analytics
// @desc    Get analytics data for charts and reports
// @access  Admin only
router.get('/analytics', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        const allRequests = (await Request.find({}).lean()).map(normalizeWorkflowResponse);

        // Category distribution
        const categoryCount = {};
        allRequests.forEach(r => {
            categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
        });

        // Status distribution
        const statusCount = { Pending: 0, 'In Review': 0, Approved: 0, Rejected: 0, Escalated: 0 };
        allRequests.forEach(r => {
            statusCount[r.status] = (statusCount[r.status] || 0) + 1;
        });

        // Approval rate
        const decided = allRequests.filter(r => r.status === 'Approved' || r.status === 'Rejected');
        const approvalRate = decided.length > 0
            ? Math.round((decided.filter(r => r.status === 'Approved').length / decided.length) * 100)
            : 0;

        // Average turnaround time (for completed requests)
        const completed = allRequests.filter(r => r.status === 'Approved' || r.status === 'Rejected');
        let avgTurnaround = 0;
        if (completed.length > 0) {
            const totalHours = completed.reduce((sum, r) => {
                const created = new Date(r.createdAt);
                const updated = new Date(r.updatedAt);
                return sum + (updated - created) / (1000 * 60 * 60);
            }, 0);
            avgTurnaround = Math.round((totalHours / completed.length) * 10) / 10;
        }

        // SLA compliance
        const withSla = allRequests.filter(r => r.slaDeadline);
        let slaCompliance = 100;
        if (withSla.length > 0) {
            const onTime = withSla.filter(r => {
                if (r.status === 'Approved' || r.status === 'Rejected') {
                    return new Date(r.updatedAt) <= new Date(r.slaDeadline);
                }
                return new Date() <= new Date(r.slaDeadline);
            });
            slaCompliance = Math.round((onTime.length / withSla.length) * 100);
        }

        // Pending bottlenecks - requests stuck longest
        const pendingRequests = allRequests
            .filter(r => r.status === 'Pending' || r.status === 'In Review' || r.status === 'Escalated')
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .slice(0, 10)
            .map(r => ({
                _id: r._id,
                title: r.title,
                category: r.category,
                currentStage: r.currentStage,
                createdAt: r.createdAt,
                daysOpen: Math.round((Date.now() - new Date(r.createdAt)) / (1000 * 60 * 60 * 24)),
                escalated: r.escalated
            }));

        // Monthly trends (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyTrends = {};
        allRequests
            .filter(r => new Date(r.createdAt) >= sixMonthsAgo)
            .forEach(r => {
                const month = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                if (!monthlyTrends[month]) monthlyTrends[month] = { submitted: 0, approved: 0, rejected: 0 };
                monthlyTrends[month].submitted++;
                if (r.status === 'Approved') monthlyTrends[month].approved++;
                if (r.status === 'Rejected') monthlyTrends[month].rejected++;
            });

        res.json({
            categoryCount,
            statusCount,
            approvalRate,
            avgTurnaround,
            slaCompliance,
            pendingBottlenecks: pendingRequests,
            monthlyTrends,
            totalRequests: allRequests.length
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
});

// @route   GET /api/requests/:id
// @desc    Get single request with full details
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        if (!hasValidRequestId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid request id' });
        }

        const request = await Request.findById(req.params.id)
            .populate('submittedBy', 'name email role')
            .populate('approvalChain.reviewedBy', 'name email role')
            .populate('comments.user', 'name email role')
            .populate('auditTrail.performedBy', 'name email role');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (req.user.role === 'user' && request.submittedBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(normalizeWorkflowResponse(request));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/requests/:id/review
// @desc    Review a request (approve or reject) at current stage
// @access  Admin/Principal
router.put('/:id/review', auth, authorize('admin', 'principal'), validateReview, validate, async (req, res) => {
    try {
        if (!hasValidRequestId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid request id' });
        }

        const { action, comment } = req.body;

        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const wasNormalized = syncWorkflowDocument(request);
        if (wasNormalized) {
            await request.save();
        }

        if (request.status === 'Approved' || request.status === 'Rejected') {
            return res.status(400).json({ message: 'This request has already been finalized' });
        }

        const currentStage = request.currentStage;
        if (currentStage === 'completed') {
            return res.status(400).json({ message: 'This request has already completed all stages' });
        }

        if (!canReviewStage(req.user.role, currentStage)) {
            return res.status(403).json({ message: 'Your role cannot review this request' });
        }

        // Update approval chain for current stage
        let chainEntry = request.approvalChain.find(a => a.stage === currentStage);
        if (!chainEntry) {
            request.approvalChain = buildApprovalChain();
            [chainEntry] = request.approvalChain;
        }

        if (chainEntry) {
            chainEntry.status = action === 'approve' ? 'approved' : 'rejected';
            chainEntry.reviewedBy = req.user._id;
            chainEntry.reviewedAt = new Date();
            chainEntry.comment = comment || '';
        }

        // Add audit trail
        const actionLabel = action === 'approve' ? 'Approved' : 'Rejected';
        request.auditTrail.push({
            action: `${actionLabel} at review stage`,
            performedBy: req.user._id,
            details: comment || `Request ${actionLabel.toLowerCase()} by ${req.user.name}.`
        });

        if (action === 'reject') {
            request.status = 'Rejected';
            request.currentStage = ACTIVE_REVIEW_STAGE;

            // Notify the submitter
            await notify(
                [request.submittedBy],
                'stage_rejected',
                'Request Rejected',
                `Your request "${request.title}" was rejected.`,
                request._id
            );
        } else {
            request.currentStage = COMPLETED_STAGE;
            request.status = 'Approved';

            await notify(
                [request.submittedBy],
                'request_completed',
                'Request Approved',
                `Your request "${request.title}" has been approved.`,
                request._id
            );

            request.auditTrail.push({
                action: 'Request Completed',
                performedBy: req.user._id,
                details: 'Request has passed the required review.'
            });
        }

        await request.save();
        await request.populate('submittedBy', 'name email role');
        await request.populate('approvalChain.reviewedBy', 'name email role');

        res.json(normalizeWorkflowResponse(request));
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ message: 'Server error reviewing request' });
    }
});

// @route   POST /api/requests/:id/comments
// @desc    Add a comment to a request
// @access  Private
router.post('/:id/comments', auth, validateComment, validate, async (req, res) => {
    try {
        if (!hasValidRequestId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid request id' });
        }

        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Users can only comment on their own requests
        if (req.user.role === 'user' && request.submittedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        request.comments.push({
            user: req.user._id,
            text: text.trim()
        });

        request.auditTrail.push({
            action: 'Comment Added',
            performedBy: req.user._id,
            details: `Comment: "${text.trim().substring(0, 100)}${text.trim().length > 100 ? '...' : ''}"`
        });

        await request.save();

        // Notify relevant parties
        const notifyIds = new Set();
        notifyIds.add(request.submittedBy.toString());
        request.comments.forEach(c => notifyIds.add(c.user.toString()));
        // Remove the commenter
        notifyIds.delete(req.user._id.toString());

        if (notifyIds.size > 0) {
            await notify(
                Array.from(notifyIds),
                'comment_added',
                'New Comment',
                `${req.user.name} commented on "${request.title}"`,
                request._id
            );
        }

        await request.populate('comments.user', 'name email role');
        res.json(request.comments);
    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({ message: 'Server error adding comment' });
    }
});

// @route   GET /api/requests/:id/timeline
// @desc    Get the full audit trail for a request
// @access  Private
router.get('/:id/timeline', auth, async (req, res) => {
    try {
        if (!hasValidRequestId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid request id' });
        }

        const request = await Request.findById(req.params.id)
            .populate('auditTrail.performedBy', 'name email role');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (req.user.role === 'user' && request.submittedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(request.auditTrail);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching timeline' });
    }
});

// @route   DELETE /api/requests/:id
// @desc    Delete a request
// @access  Private (own request only) or Admin
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!hasValidRequestId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid request id' });
        }

        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (req.user.role === 'user' && request.submittedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Request.findByIdAndDelete(req.params.id);
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting request' });
    }
});

module.exports = router;
