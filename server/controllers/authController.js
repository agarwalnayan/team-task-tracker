const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { validateAndFormatPhone, phoneExists } = require('../utils/phoneValidation')
const { verifyEmailExists } = require('../utils/emailVerification')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || '').trim())

const registerUser = async (req, res) => {
  console.log('=== REGISTER USER FUNCTION CALLED ===')
  const { name, email, password, company, phone, phoneCountryCode } = req.body

  console.log('Registration request body:', req.body)

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

    console.log('Validation passed, checking if user exists...')
    const userExists = await User.findOne({ email: normalizedEmail })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Validate and format phone number if provided
    let formattedPhone = null
    if (phone && String(phone).trim()) {
      const phoneValidation = validateAndFormatPhone(phone, phoneCountryCode || 'US')
      if (!phoneValidation.isValid) {
        return res.status(400).json({ message: phoneValidation.error })
      }

      // Check if phone number already exists
      const phoneAlreadyExists = await phoneExists(phoneValidation.formattedNumber, User)
      if (phoneAlreadyExists) {
        return res.status(400).json({ message: 'Phone number is already registered' })
      }

      formattedPhone = phoneValidation.formattedNumber
    }

    console.log('Creating new user...')
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      ...(company && String(company).trim() ? { company: String(company).trim() } : {}),
      ...(formattedPhone ? {
        phone: formattedPhone,
        phoneCountryCode: phoneCountryCode || 'US'
      } : {})
    })

    console.log('User created successfully:', user._id)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      phone: user.phone,
      phoneCountryCode: user.phoneCountryCode,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      token: generateToken(user._id)
    })
  } catch (error) {
    console.error('Registration error:', error)
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

   const user = await User.findOne({ email: normalizedEmail }).select('+password')

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
        phoneCountryCode: user.phoneCountryCode,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
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
  const { name, company, phone, phoneCountryCode } = req.body
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

    // Handle phone number update
    if (phone !== undefined) {
      const trimmedPhone = String(phone || '').trim()

      if (trimmedPhone) {
        const phoneValidation = validateAndFormatPhone(trimmedPhone, phoneCountryCode || 'US')
        if (!phoneValidation.isValid) {
          return res.status(400).json({ message: phoneValidation.error })
        }

        // Check if phone number already exists (excluding current user)
        const phoneAlreadyExists = await phoneExists(
          phoneValidation.formattedNumber,
          User,
          user._id
        )
        if (phoneAlreadyExists) {
          return res.status(400).json({ message: 'Phone number is already registered' })
        }

        user.phone = phoneValidation.formattedNumber
        user.phoneCountryCode = phoneCountryCode || 'US'
        user.phoneVerified = false // Reset verification when phone changes
      } else {
        user.phone = undefined
        user.phoneCountryCode = undefined
        user.phoneVerified = false
      }
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
    
      if (!(await user.comparePassword(currentPassword))){
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