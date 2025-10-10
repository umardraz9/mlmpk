# Country-Based Task Blocking System

This document describes the implementation of geographical restrictions for the MCNmart task system, specifically blocking access from India, Pakistan, and Bangladesh.

## Overview

The system blocks task access from specific countries while allowing users to access other platform features. Users can potentially bypass restrictions using VPN services.

## Implementation Components

### 1. Geolocation Detection (`src/lib/geolocation.ts`)

**Features:**
- Multiple IP detection methods (Cloudflare, Vercel, free APIs)
- Supports both IPv4 and IPv6
- Fallback mechanisms for reliability
- Development testing helpers

**Blocked Countries:**
- `IN` - India
- `PK` - Pakistan  
- `BD` - Bangladesh

**Detection Methods:**
1. **Cloudflare Headers** (`cf-ipcountry`) - Most reliable if using Cloudflare
2. **Vercel Headers** (`x-vercel-ip-country`) - For Vercel deployments
3. **IP Geolocation APIs** - Free services as fallback
   - ipapi.co (1000 requests/day)
   - ip-api.com (1000 requests/hour)

### 2. Middleware (`src/lib/task-country-middleware.ts`)

**Functions:**
- `validateTaskAccess()` - Main validation function
- `checkTaskCountryRestriction()` - Detailed country checking
- `getBlockedCountryMessage()` - User-friendly messages

**Response Format:**
```json
{
  "error": "Task system is not available in your region",
  "message": "Tasks are currently not available in Pakistan. This restriction is in place due to regional compliance requirements.",
  "code": "REGION_BLOCKED",
  "country": "PK",
  "countryName": "Pakistan",
  "details": {
    "reason": "Regional compliance restrictions",
    "blockedCountries": ["India", "Pakistan", "Bangladesh"],
    "alternativeMessage": "You can still access other features..."
  }
}
```

### 3. API Integration

**Protected Endpoints:**
- `GET /api/tasks` - Task listing
- `POST /api/tasks` - Start task
- `POST /api/tasks/complete` - Complete task
- `POST /api/tasks/[id]/submit` - Submit task

**Implementation:**
```typescript
// Check country restrictions first
const countryBlockResponse = await validateTaskAccess(request)
if (countryBlockResponse) {
  return countryBlockResponse
}
```

### 4. Frontend Components

#### CountryBlockedMessage (`src/components/CountryBlockedMessage.tsx`)
- Premium design with glassmorphism effects
- Shows blocked country information
- Lists alternative platform features
- VPN bypass notice
- Support contact options

#### RealTimeTaskList Updates
- Detects country blocking errors (HTTP 403 + `REGION_BLOCKED`)
- Automatically shows blocked message
- Graceful error handling

### 5. Admin Controls (`src/app/admin/task-country-settings/`)

**Features:**
- Enable/disable country blocking
- Manage blocked countries list
- Custom block messages
- VPN bypass settings
- Block attempt logging
- Real-time testing tools

**API Endpoints:**
- `GET /api/admin/task-country-settings` - Get settings
- `POST /api/admin/task-country-settings` - Update settings
- `GET /api/admin/task-country-stats` - View statistics
- `POST /api/admin/test-country-blocking` - Test functionality

## Usage Examples

### Testing in Development

```typescript
import { testCountry, runCountryBlockingTests } from '@/lib/test-country-blocking'

// Test specific country
const result = await testCountry('IN')
console.log(result) // { country: 'IN', isBlocked: true, message: '...' }

// Run full test suite
const testResults = await runCountryBlockingTests()
console.log(`Passed: ${testResults.passed}, Failed: ${testResults.failed}`)
```

### Environment Variables

```env
# Optional configuration
BLOCKED_COUNTRIES=IN,PK,BD
COUNTRY_BLOCKING_ENABLED=true
COUNTRY_BLOCK_MESSAGE="Custom message for blocked users"
ALLOW_VPN_BYPASS=true
LOG_COUNTRY_ATTEMPTS=true
```

### Simulating Countries (Development)

```typescript
// In development, you can simulate different countries
const simulatedRequest = simulateCountryRequest(request, 'IN')
```

## User Experience

### For Blocked Users
1. **Task pages show country blocked message** instead of task list
2. **Alternative features highlighted**: Shopping, referrals, membership benefits
3. **VPN bypass notice** provided
4. **Support contact** available
5. **Other platform features remain accessible**

### For Allowed Users
- Normal task system functionality
- No changes to existing workflow
- Transparent operation

## Technical Considerations

### Accuracy Limitations
- IP geolocation is ~95% accurate for country-level detection
- VPN/proxy services can bypass restrictions
- Mobile networks may show incorrect locations
- Corporate networks might route through different countries

### Performance Impact
- Minimal latency added (~50-100ms for IP lookup)
- Caching mechanisms reduce repeated lookups
- Fallback APIs prevent single points of failure
- Local IP ranges detected and skipped

### Error Handling
- Graceful degradation if geolocation fails
- Multiple fallback detection methods
- Detailed error logging for debugging
- User-friendly error messages

## Security Notes

⚠️ **Important**: This system is designed for **compliance purposes**, not security. Users can bypass restrictions using:
- VPN services
- Proxy servers
- Tor browser
- Mobile data roaming

## Monitoring & Analytics

### Available Metrics
- Blocked access attempts by country
- Most common blocked countries
- VPN bypass attempts (estimated)
- Error rates in geolocation detection

### Logging
```typescript
// Automatic logging of blocked attempts
console.log('🚫 Task access blocked for country: Pakistan (PK)')
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Admin user has access to country settings
- [ ] Test with VPN from blocked countries
- [ ] Verify alternative features work for blocked users
- [ ] Monitor error logs for geolocation issues
- [ ] Test fallback APIs are working
- [ ] Confirm admin controls are functional

## Support & Troubleshooting

### Common Issues

1. **False Positives**: Users from allowed countries being blocked
   - Check IP geolocation accuracy
   - Verify user's actual location
   - Consider corporate network routing

2. **False Negatives**: Users from blocked countries accessing tasks
   - Likely using VPN/proxy
   - Check detection logs
   - Consider additional detection methods

3. **Geolocation API Failures**
   - Monitor API rate limits
   - Check fallback mechanisms
   - Review error logs

### Debug Commands

```bash
# Test country detection
curl -X POST /api/admin/test-country-blocking \
  -H "Content-Type: application/json" \
  -d '{"country": "IN"}'

# Check current settings
curl /api/admin/task-country-settings
```

## Future Enhancements

- Database storage for settings persistence
- More granular regional controls (states/provinces)
- Whitelist functionality for specific IPs
- Integration with compliance management systems
- Advanced VPN detection
- Real-time country statistics dashboard
- Automated compliance reporting
