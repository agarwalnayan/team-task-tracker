import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js'

/**
 * Validates a phone number and returns formatted information
 * @param {string} phoneNumber - The phone number to validate
 * @param {string} defaultCountry - Default country code (e.g., 'US', 'IN')
 * @returns {Object} Validation result with formatted phone number and country code
 */
export function validateAndFormatPhone(phoneNumber, defaultCountry = 'US') {
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
 * Formats phone number for display
 * @param {string} phoneNumber - The phone number to format
 * @param {string} defaultCountry - Default country code
 * @returns {string} Formatted phone number or original string if parsing fails
 */
export function formatPhoneNumber(phoneNumber, defaultCountry = 'US') {
  if (!phoneNumber) return phoneNumber
  
  const result = validateAndFormatPhone(phoneNumber, defaultCountry)
  return result.isValid ? result.formattedNumber : phoneNumber
}

/**
 * Gets country code from phone number
 * @param {string} phoneNumber - The phone number
 * @param {string} defaultCountry - Default country code
 * @returns {string|null} Country code or null if invalid
 */
export function getPhoneCountryCode(phoneNumber, defaultCountry = 'US') {
  const result = validateAndFormatPhone(phoneNumber, defaultCountry)
  return result.isValid ? result.countryCode : null
}
