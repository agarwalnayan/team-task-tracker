const express = require('express')
const router = express.Router()
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  updatePassword
} = require('../controllers/authController')
const { protect } = require('../middleware/auth')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.patch('/me/password', protect, updatePassword)
router.get('/me', protect, getMe)
router.patch('/me', protect, updateProfile)

module.exports = router;