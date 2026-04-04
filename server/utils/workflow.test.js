const test = require('node:test');
const assert = require('node:assert/strict');

const {
    ACTIVE_REVIEW_STAGE,
    COMPLETED_STAGE,
    buildApprovalChain,
    canReviewStage,
    getReviewerRolesForStage,
    normalizeWorkflowResponse,
    syncWorkflowDocument
} = require('./workflow');

test('buildApprovalChain starts with a pending admin review stage', () => {
    assert.deepEqual(buildApprovalChain(), [{ stage: ACTIVE_REVIEW_STAGE, status: 'pending' }]);
});

test('normalizeWorkflowResponse collapses legacy approved workflows into the completed state', () => {
    const normalized = normalizeWorkflowResponse({
        status: 'Pending',
        currentStage: 'principal',
        approvalChain: [
            {
                stage: 'faculty',
                status: 'approved',
                reviewedBy: 'user-1',
                reviewedAt: new Date('2026-01-01T10:00:00.000Z'),
                comment: 'Legacy admin approval'
            },
            {
                stage: 'principal',
                status: 'pending'
            }
        ]
    });

    assert.equal(normalized.status, 'Approved');
    assert.equal(normalized.currentStage, COMPLETED_STAGE);
    assert.equal(normalized.approvalChain.length, 1);
    assert.equal(normalized.approvalChain[0].stage, ACTIVE_REVIEW_STAGE);
    assert.equal(normalized.approvalChain[0].status, 'approved');
    assert.equal(normalized.approvalChain[0].comment, 'Legacy admin approval');
});

test('normalizeWorkflowResponse keeps rejected requests rejected at the active review stage', () => {
    const normalized = normalizeWorkflowResponse({
        status: 'In Review',
        currentStage: 'admin',
        approvalChain: [
            {
                stage: 'admin',
                status: 'rejected',
                reviewedBy: 'user-2',
                reviewedAt: new Date('2026-01-02T09:00:00.000Z'),
                comment: 'Missing details'
            }
        ]
    });

    assert.equal(normalized.status, 'Rejected');
    assert.equal(normalized.currentStage, ACTIVE_REVIEW_STAGE);
    assert.equal(normalized.approvalChain[0].status, 'rejected');
    assert.equal(normalized.approvalChain[0].comment, 'Missing details');
});

test('syncWorkflowDocument mutates legacy workflows and reports the change', () => {
    const requestDoc = {
        status: 'Pending',
        currentStage: 'principal',
        approvalChain: [
            {
                stage: 'faculty',
                status: 'approved',
                reviewedBy: 'user-3',
                reviewedAt: new Date('2026-01-03T08:00:00.000Z'),
                comment: 'Approved in old workflow'
            },
            {
                stage: 'principal',
                status: 'pending'
            }
        ]
    };

    const changed = syncWorkflowDocument(requestDoc);

    assert.equal(changed, true);
    assert.equal(requestDoc.status, 'Approved');
    assert.equal(requestDoc.currentStage, COMPLETED_STAGE);
    assert.equal(requestDoc.approvalChain.length, 1);
    assert.equal(requestDoc.approvalChain[0].stage, ACTIVE_REVIEW_STAGE);
});

test('reviewer permissions match the single-stage workflow', () => {
    assert.deepEqual(getReviewerRolesForStage(ACTIVE_REVIEW_STAGE), ['admin', 'principal']);
    assert.deepEqual(getReviewerRolesForStage(COMPLETED_STAGE), []);
    assert.equal(canReviewStage('admin', ACTIVE_REVIEW_STAGE), true);
    assert.equal(canReviewStage('principal', ACTIVE_REVIEW_STAGE), true);
    assert.equal(canReviewStage('user', ACTIVE_REVIEW_STAGE), false);
    assert.equal(canReviewStage('admin', COMPLETED_STAGE), false);
});
