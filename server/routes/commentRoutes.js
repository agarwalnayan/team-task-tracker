const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getComments,
  createComment,
  updateComment,
  deleteComment
} = require('../controllers/commentController');

router.get('/task/:taskId', protect, getComments);
router.post('/task/:taskId', protect, createComment);
router.patch('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;