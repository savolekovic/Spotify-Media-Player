// IP allowlist configuration
// Add or remove entries to control access.
// Supported formats:
// - Exact IPv4: '203.0.113.10'
// - CIDR ranges: '192.168.1.0/24'
// Note: Pure IPv6 is not supported by current middleware; use an IPv6-aware implementation if needed.

/**
 * Allowed IPs and CIDR ranges.
 *
 * Maintenance guidance:
 * - To allow a single IP, add it as a string (e.g., '79.140.150.238').
 * - To allow a network, add the CIDR (e.g., '10.0.0.0/8').
 * - Keep comments explaining why each entry exists.
 */
const allowedIpRanges = [
  // Office network(s)
  '192.168.1.0/24',

  // Home IP (temporary allow for @requester)
  // TODO: Review/remove when no longer needed
  '79.140.150.238',
];

module.exports = { allowedIpRanges };