/**
 * Client-side email verification using free services
 * Note: For production, you should use server-side verification
 */

/**
 * Basic email format validation
 * @param {string} email - Email to validate
 * @returns {boolean} True if format is valid
 */
export function isValidEmailFormat(email) {
  const s = String(email || '').trim()
  if (!s) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s)
}

/**
 * Enhanced email validation with common checks
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required',
      suggestions: []
    }
  }

  const trimmedEmail = email.trim().toLowerCase()
  
  // Basic format validation
  if (!isValidEmailFormat(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Invalid email format',
      suggestions: generateEmailSuggestions(trimmedEmail)
    }
  }

  // Check for common typos in popular domains
  const domain = trimmedEmail.split('@')[1]
  const domainSuggestions = checkDomainTypos(domain)
  
  if (domainSuggestions.length > 0) {
    return {
      isValid: true, // Format is valid, but might have typo
      warning: 'Did you mean one of these domains?',
      suggestions: domainSuggestions.map(suggestion => 
        trimmedEmail.replace(domain, suggestion)
      )
    }
  }

  // Check for disposable email providers
  if (isDisposableEmail(domain)) {
    return {
      isValid: true,
      warning: 'This appears to be a disposable email address',
      isDisposable: true
    }
  }

  return {
    isValid: true,
    isDisposable: false
  }
}

/**
 * Generate email suggestions based on common typos
 * @param {string} email - Input email
 * @returns {Array} Array of suggested emails
 */
function generateEmailSuggestions(email) {
  const suggestions = []
  const [localPart, domain] = email.split('@')
  
  if (!domain) return suggestions
  
  // Common domain corrections
  const domainCorrections = {
    'gmail.co': 'gmail.com',
    'gmail.con': 'gmail.com',
    'yahoo.co': 'yahoo.com',
    'yahoo.con': 'yahoo.com',
    'hotmail.co': 'hotmail.com',
    'outlook.co': 'outlook.com',
    'gmai.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'hotmal.com': 'hotmail.com'
  }
  
  if (domainCorrections[domain]) {
    suggestions.push(`${localPart}@${domainCorrections[domain]}`)
  }
  
  return suggestions
}

/**
 * Check for common domain typos
 * @param {string} domain - Domain to check
 * @returns {Array} Array of suggested domains
 */
function checkDomainTypos(domain) {
  const suggestions = []
  const popularDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com'
  ]
  
  // Calculate Levenshtein distance (simplified)
  for (const popularDomain of popularDomains) {
    if (isSimilarDomain(domain, popularDomain)) {
      suggestions.push(popularDomain)
    }
  }
  
  return suggestions
}

/**
 * Check if two domains are similar (simplified Levenshtein)
 * @param {string} domain1 - First domain
 * @param {string} domain2 - Second domain
 * @returns {boolean} True if domains are similar
 */
function isSimilarDomain(domain1, domain2) {
  if (Math.abs(domain1.length - domain2.length) > 2) return false
  
  let differences = 0
  const maxLength = Math.max(domain1.length, domain2.length)
  
  for (let i = 0; i < maxLength; i++) {
    if (domain1[i] !== domain2[i]) {
      differences++
      if (differences > 2) return false
    }
  }
  
  return differences > 0 && differences <= 2
}

/**
 * Check if email is from a disposable email provider
 * @param {string} domain - Domain to check
 * @returns {boolean} True if disposable
 */
function isDisposableEmail(domain) {
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'yopmail.com', 'throwaway.email',
    'temp-mail.org', 'maildrop.cc', '20minutemail.com'
  ]
  
  return disposableDomains.some(disposable => 
    domain.includes(disposable) || domain.endsWith(disposable)
  )
}

/**
 * Normalize email address
 * @param {string} email - Email to normalize
 * @returns {string} Normalized email
 */
export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}
