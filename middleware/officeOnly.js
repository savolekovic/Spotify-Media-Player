const DEFAULT_ALLOWED_IP_RANGES = [
  '192.168.1.0/24',
];

function ipToNumber(ip) {
  const parts = String(ip).split('.');
  if (parts.length !== 4) return null;
  let acc = 0;
  for (const part of parts) {
    const octet = Number.parseInt(part, 10);
    if (Number.isNaN(octet) || octet < 0 || octet > 255) return null;
    acc = (acc << 8) + octet;
  }
  return acc >>> 0;
}

function normalizeIP(ip) {
  if (!ip) return null;
  const trimmed = String(ip).trim();
  // Handle IPv6-mapped IPv4 addresses like ::ffff:127.0.0.1
  if (trimmed.includes('.')) {
    // If it contains a dot, extract the last IPv4-looking token
    const tokens = trimmed.split(/[,\s]/).filter(Boolean);
    const candidate = tokens[tokens.length - 1];
    const maybeV4 = candidate.substring(candidate.lastIndexOf(':') + 1);
    return maybeV4;
  }
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.replace('::ffff:', '');
  }
  // Pure IPv6 not supported by this simple filter; return null to treat as not allowed
  return null;
}

function isIPInRange(ip, range) {
  if (range === '0.0.0.0/0') return true; // Allow all (for testing)
  const normalizedIP = normalizeIP(ip);
  if (!normalizedIP) return false;

  // Support exact IP entries without CIDR suffix
  if (!String(range).includes('/')) {
    return normalizeIP(range) === normalizedIP;
  }

  const [rangeIP, prefix] = String(range).split('/');
  const mask = ~((1 << (32 - parseInt(prefix, 10))) - 1) >>> 0;
  const ipNum = ipToNumber(normalizedIP);
  const rangeNum = ipToNumber(rangeIP);
  if (ipNum == null || rangeNum == null) return false;
  return (ipNum & mask) === (rangeNum & mask);
}

function officeOnly(options = {}) {
  const allowedIpRanges = options.allowedIpRanges || DEFAULT_ALLOWED_IP_RANGES;

  return function checkIPAccess(req, res, next) {
    // Prefer Express-provided IPs. When trust proxy is enabled, req.ips is populated from X-Forwarded-For.
    const ipChain = Array.isArray(req.ips) && req.ips.length > 0 ? req.ips : [req.ip];
    const actualIPRaw = ipChain[0] || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const actualIP = normalizeIP(actualIPRaw);

    console.log('Client IP:', actualIP || actualIPRaw);

    const isAllowed = allowedIpRanges.some((range) => isIPInRange(actualIP, range));

    if (!isAllowed) {
      console.log('Access denied for IP:', actualIP || actualIPRaw);
      return res.status(403).json({
        error: 'Access Denied',
        message: 'This application is only available on the office network.',
        ip: actualIP || actualIPRaw,
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