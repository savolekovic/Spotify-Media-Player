# Office WiFi Access Restriction Guide

## 🔒 IP Address Restriction Setup

This guide helps you restrict access to your Spotify queue app to only your office WiFi network.

## 📋 Step 1: Find Your Office IP Range

### Method 1: Check Your Computer's IP
1. **Windows**: Open Command Prompt and type `ipconfig`
2. **Mac/Linux**: Open Terminal and type `ifconfig` or `ip addr`
3. Look for your IP address (e.g., `192.168.1.45`)

### Method 2: Check Router Settings
1. Access your office router admin panel
2. Look for "DHCP Settings" or "Network Settings"
3. Note the IP range (e.g., `192.168.1.1` to `192.168.1.254`)

## 🔧 Step 2: Enable the Middleware

The office-only access logic has been extracted to `middleware/officeOnly.js`.

To enable it, open `backend-server.js` and uncomment the block below the comment:

```
// Office-only access is currently DISABLED.
// To re-enable, uncomment the block below.
// const officeOnlyMiddleware = officeOnly({ allowedIpRanges: DEFAULT_ALLOWED_IP_RANGES });
// app.use((req, res, next) => {
//     if (req.path === '/api/health') {
//         return next(); // Skip IP check for health endpoint
//     }
//     return officeOnlyMiddleware(req, res, next);
// });
```

## 🔧 Step 3: Update IP Ranges in Code

Update the CIDR ranges when enabling the middleware. You can pass your own ranges when constructing the middleware, or edit `DEFAULT_ALLOWED_IP_RANGES` inside `middleware/officeOnly.js`:

```javascript
// middleware/officeOnly.js
const DEFAULT_ALLOWED_IP_RANGES = [
  '192.168.1.0/24',  // If your office uses 192.168.1.x
  '10.0.0.0/8',      // If your office uses 10.x.x.x
  '172.16.0.0/12',   // If your office uses 172.16-31.x.x
];
```

Alternatively, pass ranges explicitly in `backend-server.js` when enabling:

```javascript
const officeOnlyMiddleware = officeOnly({
  allowedIpRanges: [
    '192.168.1.0/24',
    '10.0.0.0/8',
  ],
});
```

### Common Office IP Ranges:
- **Small Office**: `192.168.1.0/24` (192.168.1.1 - 192.168.1.254)
- **Medium Office**: `10.0.0.0/8` (10.0.0.1 - 10.255.255.254)
- **Large Office**: `172.16.0.0/12` (172.16.0.1 - 172.31.255.254)

## 🧪 Step 4: Test Your Configuration

### For Testing (Allow All IPs):
```javascript
const officeOnlyMiddleware = officeOnly({
  allowedIpRanges: ['0.0.0.0/0'], // Allow all IPs (for testing only)
});
```

### For Production (Office Only):
```javascript
const officeOnlyMiddleware = officeOnly({
  allowedIpRanges: ['192.168.1.0/24'], // Your office IP range
});
```

## 📱 Step 5: Alternative Restriction Methods

### Option A: Password Protection
Add a simple password to the frontend:

```javascript
// Add to frontend/index.html
const OFFICE_PASSWORD = 'your-office-password-123';

function checkPassword() {
  const password = prompt('Enter office password:');
  if (password !== OFFICE_PASSWORD) {
    alert('Access denied. Office password required.');
    return false;
  }
  return true;
}
```

### Option B: Domain Restriction
Restrict to specific domains (if you have a custom domain):

```javascript
const ALLOWED_DOMAINS = [
  'your-office-domain.com',
  'localhost'
];
```

### Option C: VPN-Only Access
Configure your office VPN and restrict to VPN IP ranges.

## 🚀 Step 6: Deploy and Test

1. **Enable the middleware** with your office IP ranges
2. **Redeploy** your Render service
3. **Test from office** - should work normally
4. **Test from outside** - should show "Access Denied"

## 🔍 Troubleshooting

### If Access is Denied from Office:
1. Check your IP address: `curl ifconfig.me` (from office)
2. Verify the IP range in your middleware configuration
3. Check server logs for the actual client IP

### If Access is Allowed from Outside:
1. Verify the IP filtering is enabled (middleware uncommented)
2. Check that your IP range is correct
3. Ensure the middleware is applied to all routes

## 📊 Monitoring

The server logs will show:
- `Client IP: 192.168.1.45` (allowed access)
- `Access denied for IP: 203.0.113.1` (blocked access)

## 🔐 Security Notes

- **IP filtering is not 100% secure** - IPs can be spoofed
- **Use HTTPS** - Always use HTTPS in production
- **Consider VPN** - For maximum security, use office VPN
- **Regular updates** - Update IP ranges if office network changes

## 🎯 Recommended Setup

For a typical office:
```javascript
const officeOnlyMiddleware = officeOnly({
  allowedIpRanges: [
    '192.168.1.0/24',  // Office WiFi
    '10.0.0.0/8',      // Office LAN (if different)
  ],
});
```

This will allow anyone on your office WiFi to access the app while blocking external access.
