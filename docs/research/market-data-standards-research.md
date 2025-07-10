# Market Data Standards Research
## Comprehensive Analysis of Industry Standards and Schemas

### Executive Summary

This research analyzes the major industry standards for market data representation and messaging to inform the development of our DSL (Domain Specific Language) for market data processing. The analysis covers protocol standards, data formats, and schema definitions used by major exchanges and financial institutions.

### Key Findings

1. **FIX Protocol 4.4** remains the dominant standard for market data messaging
2. **Simple Binary Encoding (SBE)** is increasingly adopted for high-frequency trading
3. **ISO 20022** is becoming the standard for payment and clearing systems
4. **FpML** provides comprehensive XML schemas for derivatives
5. **FAST Protocol** offers efficient compression for streaming data

---

## 1. FIX Protocol 4.4 - Primary Standard

### Overview
The Financial Information eXchange (FIX) Protocol is the de facto standard for electronic trading communications. FIX 4.4 is widely used for market data dissemination.

### Key Market Data Message Types
- **Market Data Request (V)**: Subscribe to market data
- **Market Data Snapshot (W)**: Full market data snapshot
- **Market Data Incremental Refresh (X)**: Real-time updates
- **Security Definition (d)**: Instrument definitions

### Critical FIX Tags for Market Data
```
Tag 35  = MsgType (Message Type)
Tag 55  = Symbol (Instrument Symbol)
Tag 48  = SecurityID (Security Identifier)
Tag 22  = SecurityIDSource (ID Source)
Tag 167 = SecurityType (Instrument Type)
Tag 269 = MDEntryType (Market Data Entry Type)
Tag 270 = MDEntryPx (Price)
Tag 271 = MDEntrySize (Size)
Tag 273 = MDEntryTime (Timestamp)
Tag 279 = MDUpdateAction (Update Action)
```

### Market Data Entry Types (Tag 269)
- **0** = Bid
- **1** = Ask  
- **2** = Trade
- **4** = Opening Price
- **5** = Closing Price
- **6** = Settlement Price
- **7** = Trading Session High Price
- **8** = Trading Session Low Price
- **9** = Trading Session VWAP Price
- **A** = Imbalance
- **B** = Trade Volume
- **C** = Open Interest

### Instrument Types (Tag 167)
- **CS** = Common Stock
- **FUT** = Future
- **OPT** = Option
- **MLEG** = Multi-leg Instrument
- **CASH** = Cash
- **EUSUPRA** = Euro Supranational Coupons
- **FAC** = Federal Agency Coupon
- **FADN** = Federal Agency Discount Note

---

## 2. Simple Binary Encoding (SBE) - High Performance

### Overview
SBE is a binary encoding format designed for low-latency, high-throughput messaging. It's increasingly used by major exchanges like CME Group.

### Key Features
- **Fixed-length fields** for predictable parsing
- **Native byte order** (little-endian)
- **Zero-copy** message processing
- **Schema-driven** with XML templates
- **Versioning support** for backward compatibility

### CME MDP 3.0 Implementation
CME Group's Market Data Platform 3.0 uses SBE for:
- **Market Data Incremental Refresh**
- **Security Definition**
- **Market Data Snapshot**
- **Channel Reset**

### SBE Message Structure
```
Message Length: 2 bytes
Binary Packet Header: 12 bytes
  - MsgSeqNum: 4 bytes
  - SendingTime: 8 bytes
Message Header: 10 bytes
  - MsgSize: 2 bytes
SBE Message Payload:
  - SBE Header: 8 bytes
    - Block Length: 2 bytes
    - Template ID: 2 bytes
    - Schema ID: 2 bytes
    - Version: 2 bytes
  - SBE Message: Variable length
```

---

## 3. ISO 20022 - Payment and Clearing Standard

### Overview
ISO 20022 is becoming the global standard for financial messaging, particularly in payments and clearing systems.

### Key Features
- **XML-based** message format
- **Rich data model** with structured information
- **Global adoption** by central banks and payment systems
- **Multi-asset support** (payments, securities, trade finance)

### Market Data Relevance
- **Settlement data** integration
- **Clearing information** for derivatives
- **Payment vs. delivery** (PvD) workflows
- **Regulatory reporting** alignment

### Major Implementations
- **TARGET2** (European Central Bank)
- **SWIFT MX** messages
- **Federal Reserve** (planned migration)
- **Bank of England CHAPS**

---

## 4. FpML - Financial Products Markup Language

### Overview
FpML is an XML-based standard for derivatives and structured products, maintained by ISDA.

### Current Version: 5.13 (May 2025)

### Product Coverage
#### Interest Rate Derivatives
- Interest rate swaps
- Swaptions
- Forward rate agreements
- Caps and floors
- Inflation swaps

#### Foreign Exchange
- Spot transactions
- FX swaps
- FX forwards
- FX options

#### Credit Derivatives
- Credit default swaps
- Credit default indexes
- Basket products

#### Equity Derivatives
- Equity swaps
- Equity options
- Variance swaps
- Total return swaps

#### Commodities
- Commodity swaps
- Commodity options
- Physical delivery contracts

### FpML Views
- **Confirmation View**: Detailed transaction confirmation
- **Pretrade View**: Pre-trade terms and conditions
- **Transparency View**: Public reporting requirements
- **Recordkeeping View**: Regulatory reporting to repositories
- **Reporting View**: Risk and position reporting

---

## 5. FAST Protocol - Streaming Optimization

### Overview
FIX Adapted for STreaming (FAST) is designed for efficient bandwidth utilization in high-volume messaging.

### Key Features
- **Template-based** compression
- **Stateful encoding** for repeated fields
- **Incremental updates** support
- **Low latency** processing
- **Bandwidth optimization**

### Use Cases
- **Market data feeds** from exchanges
- **Reference data** distribution
- **News feeds** and alerts
- **Historical data** replay

---

## 6. Exchange-Specific Implementations

### CME Group
- **MDP 3.0**: SBE-based market data platform
- **iLink 3**: SBE-based order entry
- **FAST**: Legacy market data feeds
- **FIX 4.4**: Standard messaging

### NASDAQ
- **ITCH**: Binary market data protocol
- **OUCH**: Binary order entry
- **FIX**: Standard connectivity

### NYSE
- **Pillar**: Proprietary market data format
- **FIX**: Standard messaging
- **FAST**: Market data compression

---

## 7. Recommendations for DSL Development

### Primary Standards to Adopt

#### 1. FIX Protocol 4.4 Compliance
- **Implement core FIX tags** for market data
- **Support standard message types** (V, W, X, d)
- **Use FIX data types** and field definitions
- **Maintain backward compatibility**

#### 2. SBE-Ready Architecture
- **Design for binary encoding** future migration
- **Fixed-length field support**
- **Schema-driven approach**
- **Performance optimization**

#### 3. Multi-Asset Support
- **Instrument type differentiation** (Cash, Future, Option, Swap)
- **Asset class coverage** (Equity, FX, Fixed Income, Commodity, Crypto)
- **Derivative product support**
- **Cross-asset workflows**

### Data Structure Recommendations

#### Core Market Data Types
```typescript
// Based on FIX 4.4 standards
class Price {
  timestamp: Date;     // FIX Tag 273
  price: number;       // FIX Tag 270
  size: number;        // FIX Tag 271
  entryType: MDEntryType; // FIX Tag 269
}

class Level1 {
  timestamp: Date;
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
  lastPrice?: number;
  lastSize?: number;
}

class OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;      // FIX Tag 269=9
}
```

#### Instrument Classification
```typescript
enum InstrumentType {
  CASH = "CS",        // FIX Tag 167
  FUTURE = "FUT",
  OPTION = "OPT", 
  SWAP = "SWAP",
  BOND = "BOND",
  FOREX = "FOR"
}

enum AssetClass {
  EQUITY = "EQ",
  FIXED_INCOME = "FI",
  FOREIGN_EXCHANGE = "FX",
  COMMODITY = "CO",
  CRYPTOCURRENCY = "CR"
}
```

### Implementation Strategy

#### Phase 1: FIX Foundation
- Implement core FIX 4.4 message types
- Support standard market data fields
- Create FIX-compliant data structures

#### Phase 2: Multi-Asset Extension
- Add asset class differentiation
- Implement instrument type hierarchy
- Support derivative products

#### Phase 3: Performance Optimization
- Prepare for SBE migration
- Optimize for high-frequency data
- Add binary encoding support

#### Phase 4: Advanced Features
- ISO 20022 integration for clearing
- FpML support for derivatives
- Regulatory reporting compliance

---

## 8. Compliance and Regulatory Considerations

### MiFID II Requirements
- **Transaction reporting** to authorities
- **Best execution** reporting
- **Market data** transparency requirements

### Dodd-Frank Act
- **Swap data reporting** to repositories
- **Real-time reporting** for cleared swaps
- **Historical data** requirements

### EMIR Compliance
- **Trade reporting** to trade repositories
- **Risk mitigation** for uncleared derivatives
- **Clearing obligation** for standardized derivatives

---

## 9. Technology Stack Recommendations

### Message Formats
1. **JSON** for development and testing
2. **Binary** for production performance
3. **XML** for regulatory reporting
4. **Protobuf** for internal services

### Serialization
1. **Native TypeScript** for type safety
2. **MessagePack** for compact binary
3. **Avro** for schema evolution
4. **FlatBuffers** for zero-copy access

### Protocols
1. **WebSocket** for real-time streaming
2. **gRPC** for service communication
3. **HTTP/2** for REST APIs
4. **TCP** for low-latency feeds

---

## 10. Future Considerations

### Emerging Standards
- **Digital Asset Standards** (cryptocurrency)
- **DeFi Protocol Integration**
- **Blockchain Settlement** protocols
- **AI/ML Data** requirements

### Technology Evolution
- **Cloud-native** architectures
- **Microservices** patterns
- **Event-driven** systems
- **Real-time analytics**

---

## Conclusion

The market data standards landscape is dominated by FIX Protocol 4.4 for messaging, with SBE gaining traction for high-performance applications. Our DSL should prioritize FIX compliance while preparing for SBE migration and multi-asset support. The architecture should be flexible enough to accommodate regulatory requirements and emerging standards while maintaining performance and reliability.

### Next Steps
1. Implement FIX 4.4 compliant data structures
2. Design multi-asset instrument hierarchy
3. Create performance benchmarks
4. Develop regulatory reporting capabilities
5. Plan SBE migration strategy

---

*Research conducted: January 2025*  
*Standards analyzed: FIX 4.4, SBE, ISO 20022, FpML 5.13, FAST*  
*Sources: FIX Trading Community, CME Group, ISDA, ISO, Major Exchange Documentation* 