const express = require('express');
const {
  uploadResume,
  getMyResume,
  getResumeById,
  getCandidateResume,
  downloadResume,
  deleteResume,
  reanalyzeResume,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { uploadResume: uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.post('/upload', authorize('candidate'), uploadMiddleware, uploadResume);
router.get('/me', authorize('candidate'), getMyResume);
router.get('/candidate/:candidateId', authorize('recruiter', 'admin'), getCandidateResume);
router.get('/:id', getResumeById);
router.get('/:id/download', downloadResume);
router.post('/:id/reanalyze', authorize('candidate', 'admin'), reanalyzeResume);
router.delete('/:id', deleteResume);

module.exports = router;
