const https = require('https')

/**
 * Verifies if an email exists using free email validation services
 * Uses multiple free services to increase accuracy
 * @param {string} email - The email to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyEmailExists(email) {
  if (!email || typeof email !== 'string') {
    return {
      exists: false,
      isValid: false,
      error: 'Email is required'
    }
  }

  const trimmedEmail = email.trim().toLowerCase()
  
  // Basic format validation first
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
  if (!emailRegex.test(trimmedEmail)) {
    return {
      exists: false,
      isValid: false,
      error: 'Invalid email format'
    }
  }

  // Check if API keys are configured
  const hunterApiKey = process.env.HUNTER_API_KEY
  const abstractApiKey = process.env.ABSTRACT_API_KEY
  
  if (!hunterApiKey || hunterApiKey === 'your_free_api_key' || 
      !abstractApiKey || abstractApiKey === 'your_free_api_key') {
    // No valid API keys configured, use basic validation only
    return {
      exists: true,
      isValid: true,
      confidence: 'low',
      note: 'Basic validation only - API keys not configured'
    }
  }

  try {
    // Use Hunter.io free API (1000 requests/month free)
    const hunterResult = await verifyWithHunter(trimmedEmail)
    
    // Use Abstract API free tier (100 requests/month free)
    const abstractResult = await verifyWithAbstract(trimmedEmail)
    
    // Combine results for better accuracy
    return combineVerificationResults(hunterResult, abstractResult, trimmedEmail)
    
  } catch (error) {
    console.error('Email verification error:', error.message)
    return {
      exists: true, // Assume valid if verification fails
      isValid: true,
      error: 'Verification service unavailable',
      confidence: 'low'
    }
  }
}

/**
 * Verify email using Hunter.io API
 * @param {string} email - Email to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyWithHunter(email) {
  return new Promise((resolve) => {
    const apiKey = process.env.HUNTER_API_KEY
    if (!apiKey || apiKey === 'your_free_api_key') {
      resolve({ exists: true, isValid: true, error: 'API key not configured', source: 'hunter' })
      return
    }

    const options = {
      hostname: 'api.hunter.io',
      path: `/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${apiKey}`,
      method: 'GET'
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve({
            exists: result.data?.status === 'valid',
            isValid: ['valid', 'accept-all'].includes(result.data?.status),
            confidence: result.data?.confidence || 'low',
            source: 'hunter'
          })
        } catch (e) {
          resolve({ exists: false, isValid: false, error: 'Parse error', source: 'hunter' })
        }
      })
    })

    req.on('error', () => {
      resolve({ exists: false, isValid: false, error: 'Network error', source: 'hunter' })
    })

    req.setTimeout(5000, () => {
      req.destroy()
      resolve({ exists: false, isValid: false, error: 'Timeout', source: 'hunter' })
    })

    req.end()
  })
}

/**
 * Verify email using Abstract API
 * @param {string} email - Email to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyWithAbstract(email) {
  return new Promise((resolve) => {
    const apiKey = process.env.ABSTRACT_API_KEY
    if (!apiKey || apiKey === 'your_free_api_key') {
      resolve({ exists: true, isValid: true, error: 'API key not configured', source: 'abstract' })
      return
    }

    const options = {
      hostname: 'emailvalidation.abstractapi.com',
      path: `/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`,
      method: 'GET'
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve({
            exists: result.is_valid_format?.value && result.is_mx_found?.value,
            isValid: result.is_valid_format?.value,
            confidence: result.deliverability === 'DELIVERABLE' ? 'high' : 'medium',
            source: 'abstract'
          })
        } catch (e) {
          resolve({ exists: false, isValid: false, error: 'Parse error', source: 'abstract' })
        }
      })
    })

    req.on('error', () => {
      resolve({ exists: false, isValid: false, error: 'Network error', source: 'abstract' })
    })

    req.setTimeout(5000, () => {
      req.destroy()
      resolve({ exists: false, isValid: false, error: 'Timeout', source: 'abstract' })
    })

    req.end()
  })
}

/**
 * Combine results from multiple verification services
 * @param {Object} hunterResult - Result from Hunter.io
 * @param {Object} abstractResult - Result from Abstract API
 * @param {string} email - Original email
 * @returns {Object} Combined verification result
 */
function combineVerificationResults(hunterResult, abstractResult, email) {
  // If both services agree, use that result
  if (hunterResult.isValid && abstractResult.isValid) {
    return {
      exists: true,
      isValid: true,
      confidence: 'high',
      sources: [hunterResult.source, abstractResult.source]
    }
  }
  
  if (!hunterResult.isValid && !abstractResult.isValid) {
    return {
      exists: false,
      isValid: false,
      confidence: 'high',
      sources: [hunterResult.source, abstractResult.source]
    }
  }
  
  // If services disagree, use the more confident result
  const primaryResult = hunterResult.confidence === 'high' ? hunterResult : abstractResult
  
  return {
    exists: primaryResult.exists,
    isValid: primaryResult.isValid,
    confidence: 'medium',
    sources: [hunterResult.source, abstractResult.source],
    note: 'Verification services disagree'
  }
}

/**
 * Simple MX record check for email domain
 * @param {string} email - Email to check
 * @returns {Promise<Object>} MX record check result
 */
async function checkMXRecord(email) {
  const dns = require('dns').promises
  const domain = email.split('@')[1]
  
  try {
    const mxRecords = await dns.resolveMx(domain)
    return {
      hasMX: mxRecords && mxRecords.length > 0,
      mxRecords: mxRecords || []
    }
  } catch (error) {
    return {
      hasMX: false,
      error: error.message
    }
  }
}

module.exports = {
  verifyEmailExists,
  checkMXRecord
}
