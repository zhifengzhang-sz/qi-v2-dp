# Data Attribution Compliance Guide

## Overview

This document outlines the attribution requirements for all data sources used in the QiCore Crypto Data Platform, ensuring compliance with data provider terms of service.

## CoinGecko Attribution Requirements

### Required Attribution

According to [CoinGecko's Attribution Guide](https://brand.coingecko.com/resources/attribution-guide), we must include proper attribution for all data usage.

#### Text Attribution (Required)
We use the following standardized text attribution:
```
"Data provided by CoinGecko (https://www.coingecko.com)"
```

Alternative acceptable formats:
- "Price data by [CoinGecko](https://www.coingecko.com)"
- "Source: [CoinGecko](https://www.coingecko.com)"
- "Powered by [CoinGecko API](https://www.coingecko.com/en/api/)"

### Implementation

#### 1. Data Structure Attribution
All data structures include embedded attribution:

```typescript
export interface CryptoPriceData {
  coinId: string;
  symbol: string;
  usdPrice: number;
  // ... other fields
  source: 'coingecko';
  attribution: 'Data provided by CoinGecko (https://www.coingecko.com)';
}
```

#### 2. API Response Attribution
All API responses include attribution metadata:

```typescript
{
  "prices": [...],
  "analytics": {...},
  "attribution": {
    "text": "Data provided by CoinGecko (https://www.coingecko.com)",
    "link": "https://www.coingecko.com",
    "apiLink": "https://www.coingecko.com/en/api/",
    "compliance": "https://brand.coingecko.com/resources/attribution-guide"
  }
}
```

#### 3. Code Documentation
All source files include attribution headers:

```typescript
// ATTRIBUTION REQUIREMENT:
// Data provided by CoinGecko (https://www.coingecko.com)
// Powered by CoinGecko API (https://www.coingecko.com/en/api/)
//
// This implementation complies with CoinGecko's attribution requirements.
```

### Display Requirements

When displaying CoinGecko data in applications:

#### ✅ Required
- Include text attribution near the displayed data
- Link attribution text to CoinGecko website
- Maintain attribution in exported data
- Include attribution in API documentation

#### ❌ Prohibited
- Removing or obscuring attribution
- Modifying attribution text
- Claiming partnership without authorization
- Using CoinGecko logos without permission

### Compliance Checklist

- [x] Text attribution embedded in all data structures
- [x] Attribution included in API responses
- [x] Source code includes attribution headers
- [x] Documentation references attribution requirements
- [x] Links point to official CoinGecko website
- [x] No unauthorized use of CoinGecko branding

## Future Data Sources

When adding new data sources, ensure:

1. **Research attribution requirements** before integration
2. **Document compliance requirements** in this file
3. **Implement attribution in data structures** from day one
4. **Test attribution display** in all use cases
5. **Review terms of service** for commercial usage

### TwelveData (Planned)
- Research attribution requirements before implementation
- Document compliance requirements
- Implement proper attribution patterns

### Other Sources (Future)
- Follow same attribution compliance process
- Maintain centralized documentation
- Ensure legal compliance for commercial usage

## Legal Compliance

### Commercial Usage
- All attributions comply with commercial use terms
- No unauthorized claims of partnership
- Proper citation for data redistribution
- Terms of service compliance maintained

### Open Source Considerations
- Attribution preserved in derivative works
- Open source license compatibility verified
- Contributor requirements documented
- Distribution terms clearly stated

## Monitoring & Maintenance

### Regular Reviews
- Monthly review of attribution compliance
- Check for updated attribution requirements
- Verify attribution display in all interfaces
- Monitor data provider terms of service changes

### Update Process
1. Monitor data provider websites for changes
2. Update documentation when requirements change
3. Implement changes in code and data structures
4. Test attribution display after updates
5. Communicate changes to development team

## Contact Information

For attribution compliance questions:
- Review CoinGecko's official attribution guide
- Contact data providers directly for clarification
- Document any exceptions or special arrangements
- Maintain compliance documentation current

---

**Last Updated**: 2025-01-05  
**Next Review**: 2025-02-05  
**Compliance Status**: ✅ Fully Compliant