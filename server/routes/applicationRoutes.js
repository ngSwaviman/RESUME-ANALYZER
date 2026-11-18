const express = require('express');
const { body } = require('express-validator');
const {
  applyToJob,
  getMyApplications,
  updateApplicationStatus,
  withdrawApplication,
  getRecruiterPipeline,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/me', authorize('candidate'), getMyApplications);
router.get('/recruiter/summary', authorize('recruiter', 'admin'), getRecruiterPipeline);
router.post('/:jobId', authorize('candidate'), applyToJob);
router.patch(
  '/:id/status',
  authorize('recruiter', 'admin'),
  [body('status').isIn(['applied', 'shortlisted', 'on-hold', 'rejected']).withMessage('Invalid status')],
  validate,
  updateApplicationStatus
);
router.delete('/:id', authorize('candidate'), withdrawApplication);

module.exports = router;
