// Example: How to enable office-only IP restriction middleware again
// Move this snippet into `backend-server.js` where indicated and uncomment it.
// Requires `officeOnly` and `DEFAULT_ALLOWED_IP_RANGES` from `middleware/officeOnly.js`
// and `allowedIpRanges` from `config/allowedIps.js`.

/*
const officeOnlyMiddleware = officeOnly({
  allowedIpRanges: (allowedIpRanges && allowedIpRanges.length)
    ? allowedIpRanges
    : DEFAULT_ALLOWED_IP_RANGES,
});

app.use((req, res, next) => {
  if (req.path === '/api/health') {
    return next(); // Skip IP check for health endpoint
  }
  return officeOnlyMiddleware(req, res, next);
});
*/

// Note: When disabled, the app is accessible from any IP address.
//       When re-enabled, unauthorized IPs will receive 403 with 'Access Denied'.