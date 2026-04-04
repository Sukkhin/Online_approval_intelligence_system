const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { validateCreateUser, validateRoleUpdate, validate } = require('../middleware/validators');
const { normalizeRole } = require('../utils/workflow');

const router = express.Router();
const createableRolesByRole = {
    principal: ['admin', 'user'],
    admin: ['user']
};

function canAssignRole(actorRole, targetRole) {
    return (createableRolesByRole[normalizeRole(actorRole)] || []).includes(normalizeRole(targetRole));
}

function canManageUser(actor, target) {
    if (!target) return false;
    if (actor._id.toString() === target._id.toString()) return false;
    return canAssignRole(actor.role, target.role);
}

// @route   GET /api/users
// @desc    Get all users
// @access  Admin/Principal
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
// @access  Admin/Principal
router.get('/stats', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        const total = await User.countDocuments();
        const admins = await User.countDocuments({ role: { $in: ['admin', 'faculty'] } });
        const principals = await User.countDocuments({ role: 'principal' });
        const users = await User.countDocuments({ role: 'user' });

        res.json({ total, admins, principals, users });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching user stats' });
    }
});

// @route   POST /api/users
// @desc    Create a new user according to role permissions
// @access  Admin/Principal
router.post('/', auth, authorize('admin', 'principal'), validateCreateUser, validate, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const normalizedRole = normalizeRole(role || 'user');

        if (!canAssignRole(req.user.role, normalizedRole)) {
            return res.status(403).json({ message: `You cannot create ${normalizedRole} accounts` });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const user = new User({ name, email, password, role: normalizedRole });
        await user.save();

        res.status(201).json(user.toJSON());
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error creating user' });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Admin/Principal
router.delete('/:id', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!canManageUser(req.user, user)) {
            return res.status(403).json({ message: 'You cannot delete this account' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role
// @access  Admin/Principal
router.put('/:id/role', auth, authorize('admin', 'principal'), validateRoleUpdate, validate, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        const role = normalizeRole(req.body.role);
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!canManageUser(req.user, user) || !canAssignRole(req.user.role, role)) {
            return res.status(403).json({ message: 'You cannot assign this role' });
        }

        user.role = role;
        await user.save();

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating user role' });
    }
});

module.exports = router;
