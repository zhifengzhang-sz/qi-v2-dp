
The updated directory structure for the `@qi/core/data` module should be as follows:

```
@qi/core/data/
├── errors.ts
├── index.ts
└── models/
    ├── base/
    │   ├── enums.ts
    │   ├── index.ts
    │   ├── ohlcv.ts
    │   ├── tick.ts
    │   └── types.ts
    ├── sources/
    │   └── cryptocompare/
    │       ├── index.ts
    │       ├── ohlcv.ts
    │       ├── response.ts
    │       ├── tick.ts
    │       └── types.ts
    └── storage/
        ├── index.ts
        └── sequelize/
            ├── cryptocompare/
            │   ├── migrations/
            │   │   ├── ohlcv.ts
            │   │   └── tick.ts
            │   ├── models/
            │   │   ├── ohlcv.ts
            │   │   └── tick.ts
            │   └── types.ts
            └── index.ts
```

Here's a breakdown of the directories and files:

1. **`@qi/core/data/`**:
   - `errors.ts`: Contains the specialized error handling for market data operations, including error codes, factory methods, and typed error details.
   - `index.ts`: Re-exports the main components from the `data` module, such as the base interfaces and market data models.

2. **`@qi/core/data/models/`**:
   - This directory contains the core market data models and their supporting components.

3. **`@qi/core/data/models/base/`**:
   - `enums.ts`: Defines the `TimeInterval` enum for standardized time periods.
   - `index.ts`: Re-exports the core market data types and interfaces.
   - `ohlcv.ts`: Defines the `OHLCV` interface for candlestick data.
   - `tick.ts`: Defines the `Tick` interface for real-time market tick data.
   - `types.ts`: Defines the `BaseMarketData` interface, which is the base for all market data types.

4. **`@qi/core/data/models/sources/`**:
   - This directory contains the domain models for specific data providers, starting with CryptoCompare.
   - `cryptocompare/`:
     - `index.ts`: Re-exports the CryptoCompare-specific types and models.
     - `ohlcv.ts`: Defines the `CryptoCompareOHLCV` model, which implements the `OHLCV` interface.
     - `response.ts`: Defines the response types for the CryptoCompare API.
     - `tick.ts`: Defines the `CryptoCompareTick` model, which implements the `Tick` interface.
     - `types.ts`: Defines CryptoCompare-specific data types, such as `TimeUnit`, `TradeSide`, and response field types.

5. **`@qi/core/data/models/storage/`**:
   - This directory contains the storage-related components, including the `TimescaleDBStorage` class and the CryptoCompare model implementations.
   - `index.ts`: Exports the `TimescaleDBStorage` class.
   - `sequelize/`:
     - `cryptocompare/`:
       - `migrations/`:
         - `ohlcv.ts`: Defines the migration for the CryptoCompare OHLCV hypertable.
         - `tick.ts`: Defines the migration for the CryptoCompare tick data hypertable.
       - `models/`:
         - `ohlcv.ts`: Defines the `CryptoCompareOHLCV` model, which extends the `BaseTimeSeriesModel`.
         - `tick.ts`: Defines the `CryptoCompareTick` model, which extends the `BaseTimeSeriesModel`.
       - `types.ts`: Defines the CryptoCompare-specific model attributes and creation types.
     - `index.ts`: Defines the `BaseTimeSeriesModel` and the `TimescaleDBStorage` class.

The key aspects of this directory structure are:

1. **Separation of Concerns**: The structure separates the core market data types, data provider-specific models, and storage-related components into their respective directories.

2. **Reusability**: The base interfaces and types in the `base/` directory provide a consistent foundation for all market data models, promoting reusability across different data providers.

3. **Extensibility**: The structure allows for easy expansion to support additional data providers in the future, by adding new subdirectories within the `sources/` directory.

4. **Storage Integration**: The `storage/` directory manages the integration with TimescaleDB, including the `TimescaleDBStorage` class and the CryptoCompare model implementations that extend the `BaseTimeSeriesModel`.

5. **Error Handling**: The `errors.ts` file sets up a specialized error handling system for market data operations, with provider-specific, validation, storage, and query error types.

This structured approach ensures a clear separation of concerns, promotes maintainability, and simplifies the addition of new data providers and storage integrations in the future.
