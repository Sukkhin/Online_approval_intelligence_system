const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get current user's notifications
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('relatedRequest', 'title status currentStage');

        const total = await Notification.countDocuments({ user: req.user._id });

        res.json({
            notifications,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user._id, read: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid notification id' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
