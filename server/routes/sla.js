const express = require('express');
const Request = require('../models/Request');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { getReviewerRolesForStage, syncWorkflowDocument, normalizeWorkflowResponse } = require('../utils/workflow');

const router = express.Router();

// @route   GET /api/sla/overdue
// @desc    Get all overdue / escalated requests
// @access  Admin only
router.get('/overdue', auth, authorize('admin', 'principal'), async (req, res) => {
    try {
        const overdue = await Request.find({
            status: { $nin: ['Approved', 'Rejected'] },
            slaDeadline: { $lt: new Date() }
        })
            .populate('submittedBy', 'name email')
            .sort({ slaDeadline: 1 });

        res.json(overdue.map((request) => normalizeWorkflowResponse(request)));
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching overdue requests' });
    }
});

// SLA check function — called by interval in server.js
async function checkSlaDeadlines() {
    try {
        const now = new Date();
        const overdueRequests = await Request.find({
            status: { $nin: ['Approved', 'Rejected'] },
            escalated: false,
            slaDeadline: { $lt: now }
        });

        for (const request of overdueRequests) {
            const workflowChanged = syncWorkflowDocument(request);
            if (workflowChanged && ['Approved', 'Rejected'].includes(request.status)) {
                await request.save();
                continue;
            }

            if (['Approved', 'Rejected'].includes(request.status)) {
                continue;
            }

            request.escalated = true;
            request.status = 'Escalated';
            request.auditTrail.push({
                action: 'SLA Breached — Escalated',
                performedBy: request.submittedBy,
                details: `Request exceeded SLA deadline (${request.slaDeadline.toISOString()}). Auto-escalated.`
            });
            await request.save();

            // Notify the reviewers who can act at the current stage.
            const reviewerRoles = getReviewerRolesForStage(request.currentStage);
            const reviewers = await User.find({
                role: { $in: reviewerRoles.flatMap((role) => role === 'admin' ? ['admin', 'faculty'] : [role]) },
                isActive: true
            }).select('_id');

            const docs = reviewers.map(u => ({
                user: u._id,
                type: 'request_escalated',
                title: 'Request Escalated — SLA Breached',
                message: `"${request.title}" has exceeded its SLA deadline and needs immediate attention.`,
                relatedRequest: request._id
            }));

            if (docs.length > 0) {
                await Notification.insertMany(docs);
            }
        }

        if (overdueRequests.length > 0) {
            console.log(`⚠️  SLA Check: ${overdueRequests.length} request(s) escalated.`);
        }
    } catch (error) {
        console.error('SLA check error:', error);
    }
}

module.exports = router;
module.exports.checkSlaDeadlines = checkSlaDeadlines;
