export function getRequestError(err, fallback = 'Something went wrong') {
  if (!err?.response) {
    if (err?.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Check that the API is running (e.g. port 5000).'
    }
    return 'Network error. Please try again.'
  }
  return err.response?.data?.message || fallback
}
