const express = require('express');
const {
  rankCandidatesForJob,
  recommendJobs,
  getCandidateMatches,
  getJobMatchStatistics,
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.get('/recommendations', authorize('candidate'), recommendJobs);
router.get('/job/:jobId/statistics', authorize('recruiter', 'admin'), getJobMatchStatistics);
router.get('/job/:jobId', authorize('recruiter', 'admin'), rankCandidatesForJob);
router.get('/candidate/:candidateId', authorize('recruiter', 'admin'), getCandidateMatches);

module.exports = router;
