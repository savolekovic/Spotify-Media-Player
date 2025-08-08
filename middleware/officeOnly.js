const DEFAULT_ALLOWED_IP_RANGES = [
  '192.168.1.0/24',
];

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

function isIPInRange(ip, range) {
  if (range === '0.0.0.0/0') return true; // Allow all (for testing)
  const [rangeIP, prefix] = range.split('/');
  const mask = ~((1 << (32 - parseInt(prefix))) - 1);
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(rangeIP);
  return (ipNum & mask) === (rangeNum & mask);
}

function officeOnly(options = {}) {
  const allowedIpRanges = options.allowedIpRanges || DEFAULT_ALLOWED_IP_RANGES;

  return function checkIPAccess(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const forwardedIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
    const actualIP = forwardedIP ? forwardedIP.split(',')[0].trim() : clientIP;

    console.log('Client IP:', actualIP);

    const isAllowed = allowedIpRanges.some((range) => isIPInRange(actualIP, range));

    if (!isAllowed) {
      console.log('Access denied for IP:', actualIP);
      return res.status(403).json({
        error: 'Access Denied',
        message: 'This application is only available on the office network.',
        ip: actualIP,
      });
    }

    next();
  };
}

module.exports = {
  officeOnly,
  isIPInRange,
  ipToNumber,
  DEFAULT_ALLOWED_IP_RANGES,
};