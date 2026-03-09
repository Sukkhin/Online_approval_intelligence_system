const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Admin only
router.get('/', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Admin only
router.get('/stats', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        const total = await User.countDocuments();
        const admins = await User.countDocuments({ role: 'admin' });
        const principals = await User.countDocuments({ role: 'principal' });
        const users = await User.countDocuments({ role: 'user' });

        res.json({ total, admins, principals, users });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching user stats' });
    }
});

// @route   POST /api/users
// @desc    Create a new user (admin adding a user)
// @access  Admin only
router.post('/', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const user = new User({ name, email, password, role: role || 'user' });
        await user.save();

        res.status(201).json(user.toJSON());
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error creating user' });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Admin only
router.delete('/:id', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        // Prevent deleting yourself
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role
// @access  Admin only
router.put('/:id/role', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating user role' });
    }
});

module.exports = router;
