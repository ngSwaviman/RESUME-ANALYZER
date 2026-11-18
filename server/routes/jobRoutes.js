const express = require('express');
const { body } = require('express-validator');
const {
  createJob,
  listJobs,
  getJob,
  updateJob,
  deleteJob,
  getSkillFacets,
} = require('../controllers/jobController');
const { getJobApplicants } = require('../controllers/applicationController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');

const router = express.Router();

const jobValidators = [
  body('title').trim().notEmpty().withMessage('Job title is required').isLength({ max: 120 }),
  body('description').trim().isLength({ min: 40 }).withMessage('Job description must be at least 40 characters'),
  body('requiredSkills').isArray({ min: 1 }).withMessage('At least one required skill is required'),
  body('minExperience').optional({ nullable: true }).isInt({ min: 0, max: 40 }).withMessage('Experience must be 0-40 years'),
  body('workMode').optional().isIn(['onsite', 'remote', 'hybrid']),
  body('employmentType').optional().isIn(['full-time', 'part-time', 'internship', 'contract']),
  body('openings').optional().isInt({ min: 1, max: 100 }),
];

router.get('/', optionalAuth, listJobs);
router.get('/meta/skills', getSkillFacets);
router.get('/:id/applicants', protect, authorize('recruiter', 'admin'), getJobApplicants);
router.get('/:id', optionalAuth, getJob);

router.post('/', protect, authorize('recruiter', 'admin'), jobValidators, validate, createJob);
router.put('/:id', protect, authorize('recruiter', 'admin'), updateJob);
router.delete('/:id', protect, authorize('recruiter', 'admin'), deleteJob);

module.exports = router;
