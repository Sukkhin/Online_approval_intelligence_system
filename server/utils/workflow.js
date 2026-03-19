const ACTIVE_REVIEW_STAGE = 'admin';
const COMPLETED_STAGE = 'completed';
const REVIEWER_ROLES = ['admin', 'principal'];
const LEGACY_STAGES = ['faculty', 'admin', 'principal'];

function normalizeRole(role) {
    return role === 'faculty' ? 'admin' : role;
}

function sanitizeChainEntry(entry = {}, overrides = {}) {
    const normalized = {
        stage: ACTIVE_REVIEW_STAGE,
        status: entry.status || 'pending',
        comment: entry.comment || '',
        ...overrides
    };

    if (entry.reviewedBy && normalized.status !== 'pending') {
        normalized.reviewedBy = entry.reviewedBy;
    }

    if (entry.reviewedAt && normalized.status !== 'pending') {
        normalized.reviewedAt = entry.reviewedAt;
    }

    if (normalized.status === 'pending') {
        delete normalized.reviewedBy;
        delete normalized.reviewedAt;
        normalized.comment = '';
    }

    return normalized;
}

function pickLatestApprovedEntry(entries) {
    const approvedEntries = entries.filter((entry) => entry.status === 'approved');
    const adminApproved = approvedEntries.find((entry) => entry.stage === 'admin');
    return adminApproved || approvedEntries[approvedEntries.length - 1] || null;
}

function normalizeWorkflowState(requestLike) {
    const approvalChain = Array.isArray(requestLike?.approvalChain) ? requestLike.approvalChain : [];
    const relevantEntries = approvalChain.filter((entry) => LEGACY_STAGES.includes(entry.stage));
    const rejectedEntry = relevantEntries.find((entry) => entry.status === 'rejected');
    const latestApprovedEntry = pickLatestApprovedEntry(relevantEntries);
    const isLegacyPrincipalStepPending = requestLike?.currentStage === 'principal'
        || relevantEntries.some((entry) => entry.stage === 'principal' && entry.status === 'pending');
    const pendingEntry = relevantEntries.find((entry) => entry.stage === 'admin' && entry.status === 'pending')
        || relevantEntries.find((entry) => entry.stage === 'faculty' && entry.status === 'pending');

    if (rejectedEntry || requestLike?.status === 'Rejected') {
        return {
            status: 'Rejected',
            currentStage: ACTIVE_REVIEW_STAGE,
            approvalChain: [sanitizeChainEntry(rejectedEntry || latestApprovedEntry || {}, { status: 'rejected' })]
        };
    }

    if (requestLike?.status === 'Approved' || (isLegacyPrincipalStepPending && latestApprovedEntry)) {
        return {
            status: 'Approved',
            currentStage: COMPLETED_STAGE,
            approvalChain: [sanitizeChainEntry(latestApprovedEntry || {}, { status: 'approved' })]
        };
    }

    return {
        status: requestLike?.status === 'Escalated' ? 'Escalated' : (requestLike?.status === 'In Review' ? 'In Review' : 'Pending'),
        currentStage: ACTIVE_REVIEW_STAGE,
        approvalChain: [sanitizeChainEntry(pendingEntry || {}, { status: 'pending' })]
    };
}

function normalizeWorkflowResponse(requestLike) {
    const source = requestLike?.toObject ? requestLike.toObject() : { ...requestLike };
    const normalizedState = normalizeWorkflowState(source);

    return {
        ...source,
        currentStage: normalizedState.currentStage,
        status: normalizedState.status,
        approvalChain: normalizedState.approvalChain
    };
}

function syncWorkflowDocument(requestDoc) {
    const normalizedState = normalizeWorkflowState(requestDoc);
    const currentSnapshot = JSON.stringify({
        status: requestDoc.status,
        currentStage: requestDoc.currentStage,
        approvalChain: (requestDoc.approvalChain || []).map((entry) => ({
            stage: entry.stage,
            status: entry.status,
            reviewedBy: entry.reviewedBy ? String(entry.reviewedBy._id || entry.reviewedBy) : null,
            reviewedAt: entry.reviewedAt ? new Date(entry.reviewedAt).toISOString() : null,
            comment: entry.comment || ''
        }))
    });
    const nextSnapshot = JSON.stringify({
        status: normalizedState.status,
        currentStage: normalizedState.currentStage,
        approvalChain: normalizedState.approvalChain.map((entry) => ({
            stage: entry.stage,
            status: entry.status,
            reviewedBy: entry.reviewedBy ? String(entry.reviewedBy._id || entry.reviewedBy) : null,
            reviewedAt: entry.reviewedAt ? new Date(entry.reviewedAt).toISOString() : null,
            comment: entry.comment || ''
        }))
    });

    if (currentSnapshot === nextSnapshot) {
        return false;
    }

    requestDoc.status = normalizedState.status;
    requestDoc.currentStage = normalizedState.currentStage;
    requestDoc.approvalChain = normalizedState.approvalChain;
    return true;
}

function buildApprovalChain() {
    return [{ stage: ACTIVE_REVIEW_STAGE, status: 'pending' }];
}

function getReviewerRolesForStage(stage) {
    return stage === COMPLETED_STAGE ? [] : REVIEWER_ROLES;
}

function canReviewStage(role, stage) {
    const effectiveRole = normalizeRole(role);
    if (!REVIEWER_ROLES.includes(effectiveRole)) {
        return false;
    }

    return stage !== COMPLETED_STAGE;
}

module.exports = {
    ACTIVE_REVIEW_STAGE,
    COMPLETED_STAGE,
    REVIEWER_ROLES,
    normalizeRole,
    normalizeWorkflowResponse,
    syncWorkflowDocument,
    buildApprovalChain,
    getReviewerRolesForStage,
    canReviewStage
};
