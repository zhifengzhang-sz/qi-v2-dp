# QiCore DSL - Financial Industry Standards Compliance

## Overview

The QiCore Market Data DSL is built on established financial industry standards to ensure interoperability, familiarity, and professional compliance. This document details exactly which standards we use and how.

## Standards Used

### 1. FIX Protocol 4.4 (Financial Information eXchange)

**Standard Source**: FIX Trading Community
**Official Documentation**: https://www.fixtrading.org/

#### Price (Trade/Tick) Data
**Based on**: FIX 4.4 Market Data Entry Type = 2 ("Trade")

```typescript
interface Price {
  timestamp: Date;    // FIX Tag 273 (MDEntryTime)
  price: number;      // FIX Tag 270 (MDEntryPrice) 
  size: number;       // FIX Tag 271 (MDEntrySize)
}
```

**FIX Protocol References**:
- **MDEntryTime (273)**: Time of market data entry creation
- **MDEntryPrice (270)**: Price of the market data entry
- **MDEntrySize (271)**: Quantity or volume represented by the market data entry

#### Level1 (Top of Book) Data
**Based on**: FIX 4.4 Market Data Entry Types 0 ("Bid") and 1 ("Offer")

```typescript
interface Level1 {
  timestamp: Date;    // When quote was observed
  bidPrice: number;   // FIX Tag 270 with MDEntryType=0 (Bid)
  bidSize: number;    // FIX Tag 271 with MDEntryType=0 (Bid)
  askPrice: number;   // FIX Tag 270 with MDEntryType=1 (Offer)
  askSize: number;    // FIX Tag 271 with MDEntryType=1 (Offer)
}
```

**FIX Protocol References**:
- **MDEntryType=0**: Bid entry
- **MDEntryType=1**: Offer entry
- **MDEntryPrice (270)**: Best bid/offer price
- **MDEntrySize (271)**: Quantity available at that price level

### 2. Financial Time Series Industry Standards

**Standard Source**: Industry-wide practices for OHLCV aggregation
**Used by**: Bloomberg, Thomson Reuters, major financial data vendors

#### OHLCV (Open-High-Low-Close-Volume) Data
**Based on**: Standard financial time series aggregation practices

```typescript
interface OHLCV {
  timestamp: Date;    // Bar/candle start time
  open: number;       // First trade price in the period
  high: number;       // Highest trade price in the period
  low: number;        // Lowest trade price in the period
  close: number;      // Last trade price in the period
  volume: number;     // Total volume traded in the period
}
```

**Industry Standard Definition**:
- **Open**: First price at the beginning of the time interval
- **High**: Maximum price reached during the time interval
- **Low**: Minimum price reached during the time interval
- **Close**: Last price at the end of the time interval
- **Volume**: Total quantity/volume traded during the time interval
- **Timestamp**: Start time of the aggregation period

## Benefits of Standards Compliance

### 1. **Interoperability**
- Direct compatibility with existing trading systems
- Easy integration with Bloomberg, Thomson Reuters feeds
- Standard message formats recognized by financial institutions

### 2. **Professional Familiarity**
- Traders and quants recognize the data structures immediately
- Reduced learning curve for financial professionals
- Matches expectations from industry experience

### 3. **Proven Field Layouts**
- Decades of real-world usage in financial markets
- Battle-tested in high-frequency trading environments
- Optimized for financial analysis and algorithmic trading

### 4. **Tool Ecosystem**
- Compatible with existing financial analysis libraries
- Works with standard charting and visualization tools
- Supported by major financial databases and platforms

## Implementation Notes

### Context vs Data Separation
Following FIX Protocol principles, our DSL separates:
- **Context** (ticker, market, exchange): Provided in method parameters
- **Data** (price, time, volume): Pure market observations in response

```typescript
// Context in method call
reader.getPrice("AAPL")  // "AAPL" is context

// Pure data in response
{ timestamp: Date, price: 150.25, size: 1000 }  // No ticker repetition
```

### Standards Validation
All data structures can be validated against their respective standards:
- **Price**: Must have valid timestamp, numeric price, positive size
- **Level1**: Bid price ≤ ask price, positive sizes
- **OHLCV**: Low ≤ open/close ≤ high, positive volume

### Extensions for Future Markets
Standards compliance allows clean extension:
- **Futures**: Additional fields for contract expiration, settlement
- **Options**: Additional fields for strike, expiration, Greeks
- **FX**: Additional fields for cross-rates, forward points

## References

### Official Standards Documentation
1. **FIX Protocol 4.4 Specification**
   - Message Types and Field Definitions
   - Market Data Request/Response Messages
   - https://www.fixtrading.org/standards/

2. **Financial Data Vendor Standards**
   - Bloomberg API Documentation
   - Thomson Reuters DataScope
   - Standard market data schemas

3. **Market Structure Standards**
   - SEC Market Data Infrastructure Rules
   - MiFID II Data Standards (Europe)
   - Industry best practices for tick data

### Compliance Verification
Our implementation can be verified against:
- FIX Protocol test suites
- Financial data vendor format specifications
- Industry-standard validation tools

---

*This document ensures QiCore DSL maintains professional-grade financial industry compliance while remaining simple and extensible.*