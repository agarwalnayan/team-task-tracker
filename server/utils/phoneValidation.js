const { parsePhoneNumberFromString, isValidPhoneNumber } = require('libphonenumber-js')

/**
 * Validates a phone number and returns formatted information
 * @param {string} phoneNumber - The phone number to validate
 * @param {string} defaultCountry - Default country code (e.g., 'US', 'IN')
 * @returns {Object} Validation result with formatted phone number and country code
 */
function validateAndFormatPhone(phoneNumber, defaultCountry = 'US') {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      isValid: false,
      error: 'Phone number is required',
      formattedNumber: null,
      countryCode: null
    }
  }

  const cleanedNumber = phoneNumber.trim().replace(/\s+/g, ' ')
  
  try {
    const parsed = parsePhoneNumberFromString(cleanedNumber, defaultCountry)
    
    if (!parsed) {
      return {
        isValid: false,
        error: 'Invalid phone number format',
        formattedNumber: null,
        countryCode: null
      }
    }

    if (!isValidPhoneNumber(cleanedNumber, defaultCountry)) {
      return {
        isValid: false,
        error: 'Phone number is not valid for the specified country',
        formattedNumber: null,
        countryCode: null
      }
    }

    return {
      isValid: true,
      error: null,
      formattedNumber: parsed.formatInternational(),
      nationalNumber: parsed.nationalNumber,
      countryCode: parsed.country,
      countryCallingCode: parsed.countryCallingCode,
      type: parsed.getType()
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to parse phone number',
      formattedNumber: null,
      countryCode: null
    }
  }
}

/**
 * Checks if phone number already exists in the database
 * @param {string} phoneNumber - The phone number to check
 * @param {Object} User - The User model
 * @param {string} excludeUserId - Optional user ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if phone number exists
 */
async function phoneExists(phoneNumber, User, excludeUserId = null) {
  if (!phoneNumber) return false
  
  const query = { phone: phoneNumber }
  if (excludeUserId) {
    query._id = { $ne: excludeUserId }
  }
  
  const existingUser = await User.findOne(query)
  return !!existingUser
}

module.exports = {
  validateAndFormatPhone,
  phoneExists
}
