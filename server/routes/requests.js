const express = require('express');
const Request = require('../models/Request');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/requests
// @desc    Create a new approval request
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, priority, category } = req.body;

        const request = new Request({
            title,
            description,
            priority,
            category,
            submittedBy: req.user._id
        });

        await request.save();
        await request.populate('submittedBy', 'name email');

        res.status(201).json(request);
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

        // Regular users only see their own requests
        if (req.user.role === 'user') {
            filter.submittedBy = req.user._id;
        }

        // Optional status filter
        if (req.query.status && req.query.status !== 'all') {
            filter.status = req.query.status;
        }

        // Optional category filter
        if (req.query.category && req.query.category !== 'all') {
            filter.category = req.query.category;
        }

        const requests = await Request.find(filter)
            .populate('submittedBy', 'name email')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(requests);
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
            .sort({ createdAt: -1 });

        res.json(requests);
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
        let filter = {};
        if (req.user.role === 'user') {
            filter.submittedBy = req.user._id;
        }

        const total = await Request.countDocuments(filter);
        const pending = await Request.countDocuments({ ...filter, status: 'Pending' });
        const approved = await Request.countDocuments({ ...filter, status: 'Approved' });
        const rejected = await Request.countDocuments({ ...filter, status: 'Rejected' });

        res.json({ total, pending, approved, rejected });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error fetching stats' });
    }
});

// @route   GET /api/requests/:id
// @desc    Get single request
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('submittedBy', 'name email')
            .populate('reviewedBy', 'name email');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Regular users can only see their own requests
        if (req.user.role === 'user' && request.submittedBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/requests/:id/approve
// @desc    Approve a request
// @access  Admin only
router.put('/:id/approve', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = 'Approved';
        request.adminComment = req.body.comment || '';
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();

        await request.save();
        await request.populate('submittedBy', 'name email');
        await request.populate('reviewedBy', 'name email');

        res.json(request);
    } catch (error) {
        console.error('Approve error:', error);
        res.status(500).json({ message: 'Server error approving request' });
    }
});

// @route   PUT /api/requests/:id/reject
// @desc    Reject a request
// @access  Admin only
router.put('/:id/reject', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = 'Rejected';
        request.adminComment = req.body.comment || '';
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();

        await request.save();
        await request.populate('submittedBy', 'name email');
        await request.populate('reviewedBy', 'name email');

        res.json(request);
    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ message: 'Server error rejecting request' });
    }
});

// @route   DELETE /api/requests/:id
// @desc    Delete a request
// @access  Private (own request only) or Admin
router.delete('/:id', auth, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Only owner or admin can delete
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
