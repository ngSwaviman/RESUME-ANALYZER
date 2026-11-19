const express = require('express');
const {
  getDashboardStats,
  listUsers,
  toggleUserStatus,
  setRecruiterApproval,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', listUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/approval', setRecruiterApproval);

module.exports = router;
