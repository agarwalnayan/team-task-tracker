const User = require('../models/User')
const jwt = require('jsonwebtoken')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || '').trim())

const registerUser = async (req, res) => {
  const { name, email, password, company } = req.body

  try {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' })
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Name is required' })
    }

    const userExists = await User.findOne({ email: normalizedEmail })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      ...(company && String(company).trim() ? { company: String(company).trim() } : {})
    })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      token: generateToken(user._id)
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' })
    }

    const user = await User.findOne({ email: normalizedEmail })

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        token: generateToken(user._id)
      })
    } else {
      res.status(401).json({ message: 'Invalid email or password' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getMe = async (req, res) => {
  res.json(req.user)
}

const updateProfile = async (req, res) => {
  const { name, company } = req.body
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (name !== undefined) {
      const n = String(name).trim()
      if (!n) {
        return res.status(400).json({ message: 'Name cannot be empty' })
      }
      user.name = n
    }
    if (company !== undefined) {
      const c = String(company || '').trim()
      user.company = c || undefined
    }
    await user.save()
    const fresh = await User.findById(user._id).select('-password')
    res.json(fresh)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' })
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }
    user.password = newPassword
    await user.save()
    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { registerUser, loginUser, getMe, updateProfile, updatePassword }
