/**
 * Extract data from API response consistently
 * Handles both paginated responses and direct array responses
 */
export const extractData = (res) => {
  if (Array.isArray(res)) return res
  if (res?.data) return res.data
  return []
}

/**
 * Extract pagination from API response
 */
export const extractPagination = (res) => {
  if (res?.pagination) return res.pagination
  return { page: 1, limit: 10, total: 0, pages: 0 }
}
