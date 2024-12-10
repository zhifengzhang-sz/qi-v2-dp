## Spot restapi

### ohlc

This endpoint delivers daily aggregated candlestick data for specific cryptocurrency instruments across selected exchanges. It offers vital trading metrics, including open, high, low, close (OHLC) prices, and trading volumes, both in base and quote currencies. This data is key for understanding historical price movements and market behavior, allowing for detailed analysis of trading patterns and trends over time.The endpoint is flexible, providing customization options for market and instrument selection, as well as aggregation preferences, making it an essential tool for traders, analysts, and researchers.

#### Key Features
- OHLC Data: Access daily open, high, low, and close price data, providing clear snapshots of market behavior at a granular level.
Volume Metrics: Retrieve trading volumes for both base and quote currencies, allowing for a deeper understanding of liquidity and market depth.
- Customizable Data Aggregation: Tailor data retrieval through flexible parameters, such as market selection and instrument specifics, to suit various analysis needs.
- Historical Data Availability: Access long-term historical data for comprehensive backtesting and market trend analysis.
- Exchange-Specific Data: Filter by specific exchanges to analyze data from preferred trading venues or focus on a particular market segment.

#### Use Cases
- Market Trend Analysis: Study historical price movements and volumes to identify potential trends, price patterns, and shifts in market sentiment.
- Strategy Backtesting: Use historical OHLC and volume data to backtest and refine trading strategies, ensuring they are effective in various market conditions before live trading.
- Risk Management and Forecasting: Analysts can use historical data to model risk scenarios and forecast future price movements, supporting more informed trading and investment decisions.
- Financial Reporting: Leverage detailed historical candlestick data to provide insights in financial reports, market analyses, or news stories on market conditions.
- Academic Research: Universities and research institutions can analyze the historical market behavior of cryptocurrencies for academic papers or coursework focused on financial analysis.

#### Target Audiences
- Traders and Investors: Access comprehensive historical market data to enhance decision-making and strategy formulation.
- Data Analysts and Financial Researchers: Utilize detailed candlestick and volume data for building predictive models and analyzing market behavior.
- Educational Institutions: Offer students real-world cryptocurrency data for use in financial market research, class projects, or academic papers.
- Financial Institutions and Hedge Funds: Use historical price and volume data to assess market behavior, supporting risk management, and strategic investment decisions.
- Media and Financial Reporters: Provide readers with accurate historical data points to support financial reporting on market trends and price changes.

#### Data Handling Notes
- High-Volume Data: To retrieve extensive historical data, paginate efficiently by handling up to 2,000 data points per request. Ensure that your application can manage this volume and process it accordingly.
- Efficient Data Retrieval: Use filtering options for exchanges and instruments, and customize aggregation periods to focus on relevant data.
- Historical Data Updates: Although rare, in extreme circumstances, we may update historical entries if trades were originally missed. These backfilled entries ensure the most accurate historical data available, but such occurrences are uncommon and not part of the standard process.

By utilizing this endpoint, users can access crucial historical candlestick data, enabling robust market analysis, strategy development, and comprehensive reporting in the fast-paced cryptocurrency space.

---

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v1_historical_days (days for day, minutes for minute and hours for hour)

2. restapi: this is for daily ohlc, in baseurl replace days by minutes for minute or hours for hour.

```js
const baseUrl = "https://data-api.cryptocompare.com/spot/v1/historical/days";
const params = {
  market: "kraken",
  instrument: "BTC-USD",
  limit: 10,
  aggregate: 1,
  fill: "true",
  apply_mapping: "true",
  response_format: "JSON",
  api_key: "3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe",
};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
  method: "GET",
  headers: { "Content-type": "application/json; charset=UTF-8" },
};

fetch(url, options)
  .then((response) => response.json())
  .then((json) => console.log(json))
  .catch((err) => console.log(err));
```

3. response schema

```json
{
  "Data": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "UNIT": {
          "type": "string",
          "description": "The unit of the historical period update: MINUTE for minute, HOUR for hour and DAY for day."
        },
        "TIMESTAMP": {
          "type": "number",
          "description": "The timestamp in seconds of the beginning of the histo period. For minute it would be every minute at the beginning of the minute, for hour it would be the start of the hour and for daily it is 00:00 GMT."
        },
        "TYPE": {
          "type": "string",
          "description": "The type of message this is. It helps identify the nature of the data being returned.",
          "x-cc-api-group": "ID"
        },
        "MARKET": {
          "type": "string",
          "description": "The market / exchange under consideration (e.g. gemini, kraken, coinbase, etc).",
          "x-cc-api-group": "ID"
        },
        "INSTRUMENT": {
          "type": "string",
          "description": "The unmapped instrument ID",
          "x-cc-api-group": "ID"
        },
        "MAPPED_INSTRUMENT": {
          "type": "string",
          "description": "The instrument ID, as derived from our mapping rules. This takes the form \"BASE-QUOTE\" (e.g. BTC-USD). Only available on instruments that have been mapped.",
          "x-cc-api-group": "MAPPING"
        },
        "BASE": {
          "type": "string",
          "description": "Represents the base asset or coin symbol, commonly known as the ticker (e.g., BTC). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "MAPPING"
        },
        "QUOTE": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "MAPPING"
        },
        "BASE_ID": {
          "type": "number",
          "description": "Represents the internal CCData ID for the base asset or coin (e.g., 1 for BTC). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "MAPPING_ADVANCED"
        },
        "QUOTE_ID": {
          "type": "number",
          "description": "Represents the internal CCData ID for the quote asset or counter coin (e.g., 5 for USD). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "MAPPING_ADVANCED"
        },
        "TRANSFORM_FUNCTION": {
          "type": "string",
          "description": "The transform function. This is the function we apply when we do mapping to change values into easier human readable ones and to make sure the mapped direction BASE - QUOTE is constant accross all instruments.",
          "x-cc-api-group": "MAPPING_ADVANCED"
        },
        "OPEN": {
          "type": "number",
          "description": "The open price for the historical period, this is based on the closest trade before the period start.",
          "x-cc-api-group": "OHLC"
        },
        "HIGH": {
          "type": "number",
          "description": "The highest trade price in the time period. If there were no trades in the time period, the open price will be given.",
          "x-cc-api-group": "OHLC"
        },
        "LOW": {
          "type": "number",
          "description": "The lowest trade price in the time period. If there were no trades in the time period, the open price will be given.",
          "x-cc-api-group": "OHLC"
        },
        "CLOSE": {
          "type": "number",
          "description": "The price of the last trade in this time period. If there were no trades in the time period, the open price will be given.",
          "x-cc-api-group": "OHLC"
        },
        "FIRST_TRADE_TIMESTAMP": {
          "type": "number",
          "description": "The timestamp, in seconds, of the first trade in this time perio. This is only available when there is at least one trade in the time period.",
          "x-cc-api-group": "OHLC_TRADE"
        },
        "LAST_TRADE_TIMESTAMP": {
          "type": "number",
          "description": "The timestamp, in seconds, of the last trade in this time period. This is only available when there is at least one trade in the time period.",
          "x-cc-api-group": "OHLC_TRADE"
        },
        "FIRST_TRADE_PRICE": {
          "type": "number",
          "description": "The price of the first trade in the time period. This is only available when there is at least one trade in the time period.",
          "x-cc-api-group": "OHLC_TRADE"
        },
        "HIGH_TRADE_PRICE": {
          "type": "number",
          "description": "The highest value of the trades in the time period. This is only available when there is at least one trade in the time period.",
          "x-cc-api-group": "OHLC_TRADE"
        },
        "HIGH_TRADE_TIMESTAMP": {
          "type": "number",
          "description": "The timestamp, in seconds, of the highest trade in the time period. This is only available when there is at least one trade in the time period.",
          "x-cc-api-group": "OHLC_TRADE"
        },
        "LOW_TRADE_PRICE": {
          "type": "number",
          "description": "The lowest value of the trades in the time period. This is only available when there is at least one trade in the time period.",
          "x-cc-api-group": "OHLC_TRADE"
        },
        "LOW_TRADE_TIMESTAMP": {
          "type": "number",
          "description": "The timestamp, in seconds, of the lowest trade in the time period. This is only available when there is at least one trade in the time period.",
          "x-cc-api-group": "OHLC_TRADE"
        },
        "LAST_TRADE_PRICE": {
          "type": "number",
          "description": "The last trade price in the time period. This is only available when there is at least one trade in the time period.",
          "x-cc-api-group": "OHLC_TRADE"
        },
        "TOTAL_TRADES": {
          "type": "number",
          "description": "The total number of trades seen in this time period. If there were no trades in the time period, 0 will be returned.",
          "x-cc-api-group": "TRADE"
        },
        "TOTAL_TRADES_BUY": {
          "type": "number",
          "description": "The total number of BUY trades seen in this time period. If there were no trades in the time period, 0 will be returned.",
          "x-cc-api-group": "TRADE"
        },
        "TOTAL_TRADES_SELL": {
          "type": "number",
          "description": "The total number of SELL trades seen in this time period. If there were no trades in the time period, 0 will be returned.",
          "x-cc-api-group": "TRADE"
        },
        "TOTAL_TRADES_UNKNOWN": {
          "type": "number",
          "description": "The total number of UNKNOWN trades seen in this time period. If there were no trades in the time period, 0 will be returned.",
          "x-cc-api-group": "TRADE"
        },
        "VOLUME": {
          "type": "number",
          "description": "The sum of all the trade volumes in the from asset (base symbol / coin) for the time period. If there were no trades in the time period, 0 will be returned.",
          "x-cc-api-group": "VOLUME"
        },
        "QUOTE_VOLUME": {
          "type": "number",
          "description": "The sum of all the trade volumes in the To asset (quote/counter symbol/coin) for the time period. If there were no trades in the time period, 0 will be returned.",
          "x-cc-api-group": "VOLUME"
        },
        "VOLUME_BUY": {
          "type": "number",
          "description": "The sum of all the BUY trade volumes in the from asset (base symbol / coin) for the time period.",
          "x-cc-api-group": "VOLUME"
        },
        "QUOTE_VOLUME_BUY": {
          "type": "number",
          "description": "The sum of all the BUY trade volumes in the to asset (quote/counter symbol/coin) for the time period.",
          "x-cc-api-group": "VOLUME"
        },
        "VOLUME_SELL": {
          "type": "number",
          "description": "The sum of all the SELL trade volumes in the from asset (base symbol / coin) for the time period.",
          "x-cc-api-group": "VOLUME"
        },
        "QUOTE_VOLUME_SELL": {
          "type": "number",
          "description": "The sum of all the SELL trade volumes in the To asset (quote/counter symbol/coin) for the time period.",
          "x-cc-api-group": "VOLUME"
        },
        "VOLUME_UNKNOWN": {
          "type": "number",
          "description": "The sum of all the UNKNOWN trade volumes in the from asset (base symbol / coin) for the time period.",
          "x-cc-api-group": "VOLUME"
        },
        "QUOTE_VOLUME_UNKNOWN": {
          "type": "number",
          "description": "The sum of all the UNKNOWN trade volumes in the To asset (quote/counter symbol/coin) for the time period.",
          "x-cc-api-group": "VOLUME"
        }
      }
    }
  },
  "Err": {
    "type": "object",
    "properties": {}
  }
}
```

### trades

This endpoint provides detailed, standardized, and deduplicated tick-level trade data for a specified instrument on a chosen exchange, covering a specific hour. This endpoint captures every transaction executed, offering deep insights into trading activity, including price, quantity, and timestamp details. Each trade also includes an individual CCSEQ (CryptoCompare Sequence) number, trade side, and both received (by us) and reported (by the exchange) timestamps with nanosecond granularity. It is designed for users who need to analyze market dynamics on an hourly basis, such as assessing the impact of market news or events, monitoring trade volumes, and understanding price fluctuations within the hour. This endpoint is also ideal for backfilling all trades on an instrument from the instrument listing time to the present.

#### Key Features

- Comprehensive Tick-Level Data: Access every transaction executed within a specific hour, including price, quantity, and precise timestamp details.
Standardized and Deduplicated Information: Receive clean, consistent data free from duplicates for accurate market analysis.
- Unique CCSEQ Numbers: Each trade includes an individual CryptoCompare Sequence (CCSEQ) number for precise tracking and sequencing.
- Trade Side Identification: Determine the buy or sell side of each trade to enhance market sentiment analysis.
- Received and Reported Timestamps: Compare exchange-reported timestamps with data receipt times for comprehensive temporal analysis.
- Ideal for Backfilling Data: Efficiently backfill all trades from an instrument's listing time to the present.

#### Use Cases

- Market Behavior Analysis: Examine tick-by-tick data to understand market behavior and trader reactions within a specific hour, crucial for developing short-term trading strategies.
- Event Impact Assessment: Evaluate the impact of financial news or market events on trading activity and price movements within a narrow time frame.
- Compliance and Monitoring: Use detailed trade data for compliance reviews, market surveillance, and monitoring trading activities to detect anomalies or manipulative practices.
- Quantitative Research: Leverage granular trade data for research on market microstructures, including price discovery and transaction costs.
- Algorithmic Trading Models: Develop and refine trading algorithms based on precise market data points.

#### Target Audiences

- Financial Analysts and Traders: Professionals requiring granular data to analyze short-term market trends or backtest trading strategies.
- Regulatory Bodies and Compliance Officers: Individuals needing detailed transaction records for thorough market audits or investigations.
- Academic Researchers: Researchers focusing on finance who require high-resolution data for empirical studies on market behaviors.
- Quantitative Analysts and Algorithmic Traders: Developers of models dependent on precise tick-level trade data.
- Data Scientists: Professionals working on machine learning models and predictive analytics in financial markets.
- Index Calculators and Administrators: Professionals responsible for maintaining and calculating cryptocurrency indices, who require granular and accurate tick-level data to ensure the indices reflect true market conditions. They can use this detailed trade data to adjust for corporate actions, monitor liquidity, and ensure accurate index tracking.
- Custodians: Institutions responsible for safeguarding and managing digital assets, who need detailed transaction records for reconciling holdings, auditing trading activities, and ensuring that client assets are handled with the highest level of transparency and compliance.

#### Data Handling Notes

- Large Data Volumes: Some hours can contain over 5 million trades, so caution should be taken when processing responses from this endpoint. The substantial data size may impact memory usage and processing time.
- Efficient Data Processing with CSV Format: For most cases, setting response_format=CSV will make large hourly trade files easier to process. This format allows you to handle data in chunks as it streams, improving efficiency and reducing memory overhead.
- Chunked Data Transmission: Our endpoint pulls data in chunks of 16,000 trades from our blob storage, transforms it, and sends it to Nginx, which gzips it and delivers it to you if you've requested gzipped responses. For trades in the last 4 hours, we pull them in chunks of 1,000 trades from our Redis cluster and send them to Nginx. This chunked approach helps manage large volumes of data more effectively.
- Optimizing Data Retrieval: Implement data streaming and chunk processing in your application to handle large datasets without overwhelming system resources. This is especially important when dealing with high-frequency trading data.
- Alternative for Recent Trades: If you need to stay up to date with the latest trades at intervals more frequent than hourly, consider using the Trades by - Timestamp Endpoint. This endpoint is better suited for real-time data retrieval and incremental updates.
- Data Integrity Considerations: Be aware that some trades may be marked as INVALID due to exchange API errors or data processing issues. While you can set the skip_invalid_messages parameter to true to omit these trades, doing so may result in gaps in CCSEQ numbers, complicating the verification of complete data retrieval. For thorough analysis, it's recommended not to skip invalid messages.

By leveraging the Trades Full Hour endpoint, users can obtain comprehensive trade data essential for in-depth market analysis, compliance efforts, and strategic planning in the dynamic cryptocurrency trading environment.

---

#### hourly

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v2_historical_trades_hour

2. restapi:

```js
const baseUrl =
  "https://data-api.cryptocompare.com/spot/v2/historical/trades/hour";
const params = {
  market: "coinbase",
  instrument: "BTC-USD",
  hour_ts: 1576771200,
  apply_mapping: "true",
  response_format: "JSON",
  api_key: "3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe",
};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
  method: "GET",
  headers: { "Content-type": "application/json; charset=UTF-8" },
};

fetch(url, options)
  .then((response) => response.json())
  .then((json) => console.log(json))
  .catch((err) => console.log(err));
```

3. response schema:

```json
{
  "Data": {
    "type": "array",
    "description": "An array containing valid and invalid trades for the requested time period. Trades are ordered by CCSEQ, which generally reflects the order of their received timestamps. Any backfilled trades that are added later will appear at the end of the array. This ensures a reliable and sequential view of trades, including historical corrections. If a trades was initially deemed valid but later determined to have been sent in error or processed incorrectly the STATUS field will be changed to reflect this. We retain invalid trades to maintain the continuity of CCSEQ and ensure there are no gaps in the sequence. You can elimiate invalid trades from the response by setting the skip_invalid_messages paramater to true, keep in mind that by doing this you will have gaps in the CCSEQ of trades and you can no longer easily guarantee you have received all trades",
    "items": {
      "type": "object",
      "properties": {
        "TYPE": {
          "type": "string",
          "description": "The type of message this is. It helps identify the nature of the data being returned.",
          "example": "952",
          "x-cc-api-group": "ID"
        },
        "MARKET": {
          "type": "string",
          "description": "The market / exchange under consideration (e.g. coinbase, kraken, etc.).",
          "example": "coinbase",
          "x-cc-api-group": "ID"
        },
        "INSTRUMENT": {
          "type": "string",
          "description": "The original unmapped instrument ID as provided by the exchange, which can have various formats (e.g., BTCUSD, BTC_USD, XBT-ZUSD, BTC-USD).",
          "example": "BTC-USD",
          "x-cc-api-group": "ID"
        },
        "MAPPED_INSTRUMENT": {
          "type": "string",
          "description": "The mapped instrument ID after applying our mapping rules. This takes the form: \"BASE-QUOTE\" and is available only for instruments that have been mapped (e.g. BTC-USD).",
          "example": "BTC-USD",
          "x-cc-api-group": "MAPPING"
        },
        "BASE": {
          "type": "string",
          "description": "Represents the base asset or coin symbol, commonly known as the ticker (e.g., BTC). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "example": "BTC",
          "x-cc-api-group": "MAPPING"
        },
        "QUOTE": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "example": "USD",
          "x-cc-api-group": "MAPPING"
        },
        "BASE_ID": {
          "type": "number",
          "description": "Represents the internal CCData ID for the base asset or coin (e.g., 1 for BTC). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
          "example": 1,
          "x-cc-api-group": "MAPPING_ADVANCED"
        },
        "QUOTE_ID": {
          "type": "number",
          "description": "Represents the internal CCData ID for the quote asset or counter coin (e.g., 5 for USD). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
          "example": 5,
          "x-cc-api-group": "MAPPING_ADVANCED"
        },
        "TRANSFORM_FUNCTION": {
          "type": "string",
          "description": "The transform function. This is the function applied during mapping to convert values into more human-readable formats and ensure the mapped direction \"BASE-QUOTE\" remains consistent across instruments.",
          "example": "INVERT",
          "x-cc-api-group": "MAPPING_ADVANCED"
        },
        "SIDE": {
          "type": "string",
          "description": "The side of the trade: SELL, BUY or UNKNOWN. If the exchange / api does not provide a side, \"UNKNOWN\" will be returned.",
          "example": "SELL",
          "x-cc-api-group": "TRADE"
        },
        "ID": {
          "type": "string",
          "description": "The trade ID as reported by the market / exchange. If not provided by the exchange, it will be the timestamp of the trade plus a number from 0 - 999 to ensure uniqueness, assuming there would never be more than 1000 trades in any given second.",
          "example": "2",
          "x-cc-api-group": "TRADE"
        },
        "TIMESTAMP": {
          "type": "number",
          "description": "The timestamp in seconds as reported by the market / exchange or the received timestamp if the market / exchange does not provide one.",
          "example": 1417412423,
          "x-cc-api-group": "TRADE"
        },
        "TIMESTAMP_NS": {
          "type": "number",
          "description": "The nanosecond part of the reported timestamp.",
          "example": 76000000,
          "x-cc-api-group": "TRADE"
        },
        "RECEIVED_TIMESTAMP": {
          "type": "number",
          "description": "The timestamp in seconds when the trade was received. This may differ from the trade timestamp by milliseconds to seconds depending on the market / exchange API options and rate limits.",
          "example": 1642010854,
          "x-cc-api-group": "TRADE"
        },
        "RECEIVED_TIMESTAMP_NS": {
          "type": "number",
          "description": "The nanosecond part of the received timestamp.",
          "example": 980000000,
          "x-cc-api-group": "TRADE"
        },
        "QUANTITY": {
          "type": "number",
          "description": "The volume of the trade, given in the from instrument (base symbol / coin/ contract). For a spot BTC-USD trade, this is how much BTC was traded at the trade price. For a futures BTCUSDPERP, this is the BTC equivalent for the contracts traded.",
          "example": 0.01,
          "x-cc-api-group": "TRADE"
        },
        "PRICE": {
          "type": "number",
          "description": "The price in the to instrument (quote / counter symbol / coin) of the trade. For a BTC-USD trade, this is how much was paid for one BTC in USD. For futures, this will be the price of the contract.",
          "example": 300,
          "x-cc-api-group": "TRADE"
        },
        "QUOTE_QUANTITY": {
          "type": "number",
          "description": "The volume of the trade, given in the to instrument (quote / counter symbol / coin). This is equivalent to QUANTITY * PRICE. E.g. for a BTC-USD trade, this is how much USD was paid in total for the volume of BTC traded. For futures this is the quote currency equivalent for the contracts traded.",
          "example": 3,
          "x-cc-api-group": "TRADE"
        },
        "SOURCE": {
          "type": "string",
          "description": "The source of the trade update: POLLING, STREAMING, GO, BLOB etc.",
          "example": "POLLING",
          "x-cc-api-group": "TRADE"
        },
        "CCSEQ": {
          "type": "number",
          "description": "The internal sequence number for this trade, unique per market / exchange and trading pair. It should always increase by 1 with each new trade discovered, ensuring there are no gaps, though not necessarily in chronological order.",
          "example": 1,
          "x-cc-api-group": "TRADE"
        },
        "STATUS": {
          "type": "string",
          "description": "The status of the trade: VALID, INVALID_DUPLICATE, INVALID_CORRUPTED and INVALID_MIGRATED.",
          "example": "VALID",
          "x-cc-api-group": "STATUS"
        }
      }
    }
  },
  "Err": {
    "type": "object",
    "properties": {}
  }
}
```

#### By timestamp

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v2_historical_trades

2. restapi:

```js
const baseUrl = "https://data-api.cryptocompare.com/spot/v2/historical/trades";
const params = {
  market: "coinbase",
  instrument: "BTC-USD",
  after_ts: 1576774145,
  limit: 100,
  apply_mapping: "true",
  response_format: "JSON",
  api_key: "3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe",
};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
  method: "GET",
  headers: { "Content-type": "application/json; charset=UTF-8" },
};

fetch(url, options)
  .then((response) => response.json())
  .then((json) => console.log(json))
  .catch((err) => console.log(err));
```

3. response schema:

```json
{
  "Data": {
    "type": "array",
    "description": "An array containing valid and invalid trades for the requested time period. Trades are ordered by CCSEQ, which generally reflects the order of their received timestamps. Any backfilled trades that are added later will appear at the end of the array. This ensures a reliable and sequential view of trades, including historical corrections. If a trades was initially deemed valid but later determined to have been sent in error or processed incorrectly the STATUS field will be changed to reflect this. We retain invalid trades to maintain the continuity of CCSEQ and ensure there are no gaps in the sequence. You can elimiate invalid trades from the response by setting the skip_invalid_messages paramater to true, keep in mind that by doing this you will have gaps in the CCSEQ of trades and you can no longer easily guarantee you have received all trades",
    "items": {
      "type": "object",
      "properties": {
        "TYPE": {
          "type": "string",
          "description": "The type of message this is. It helps identify the nature of the data being returned.",
          "example": "952",
          "x-cc-api-group": "ID"
        },
        "MARKET": {
          "type": "string",
          "description": "The market / exchange under consideration (e.g. coinbase, kraken, etc.).",
          "example": "coinbase",
          "x-cc-api-group": "ID"
        },
        "INSTRUMENT": {
          "type": "string",
          "description": "The original unmapped instrument ID as provided by the exchange, which can have various formats (e.g., BTCUSD, BTC_USD, XBT-ZUSD, BTC-USD).",
          "example": "BTC-USD",
          "x-cc-api-group": "ID"
        },
        "MAPPED_INSTRUMENT": {
          "type": "string",
          "description": "The mapped instrument ID after applying our mapping rules. This takes the form: \"BASE-QUOTE\" and is available only for instruments that have been mapped (e.g. BTC-USD).",
          "example": "BTC-USD",
          "x-cc-api-group": "MAPPING"
        },
        "BASE": {
          "type": "string",
          "description": "Represents the base asset or coin symbol, commonly known as the ticker (e.g., BTC). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "example": "BTC",
          "x-cc-api-group": "MAPPING"
        },
        "QUOTE": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "example": "USD",
          "x-cc-api-group": "MAPPING"
        },
        "BASE_ID": {
          "type": "number",
          "description": "Represents the internal CCData ID for the base asset or coin (e.g., 1 for BTC). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
          "example": 1,
          "x-cc-api-group": "MAPPING_ADVANCED"
        },
        "QUOTE_ID": {
          "type": "number",
          "description": "Represents the internal CCData ID for the quote asset or counter coin (e.g., 5 for USD). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
          "example": 5,
          "x-cc-api-group": "MAPPING_ADVANCED"
        },
        "TRANSFORM_FUNCTION": {
          "type": "string",
          "description": "The transform function. This is the function applied during mapping to convert values into more human-readable formats and ensure the mapped direction \"BASE-QUOTE\" remains consistent across instruments.",
          "example": "INVERT",
          "x-cc-api-group": "MAPPING_ADVANCED"
        },
        "SIDE": {
          "type": "string",
          "description": "The side of the trade: SELL, BUY or UNKNOWN. If the exchange / api does not provide a side, \"UNKNOWN\" will be returned.",
          "example": "SELL",
          "x-cc-api-group": "TRADE"
        },
        "ID": {
          "type": "string",
          "description": "The trade ID as reported by the market / exchange. If not provided by the exchange, it will be the timestamp of the trade plus a number from 0 - 999 to ensure uniqueness, assuming there would never be more than 1000 trades in any given second.",
          "example": "2",
          "x-cc-api-group": "TRADE"
        },
        "TIMESTAMP": {
          "type": "number",
          "description": "The timestamp in seconds as reported by the market / exchange or the received timestamp if the market / exchange does not provide one.",
          "example": 1417412423,
          "x-cc-api-group": "TRADE"
        },
        "TIMESTAMP_NS": {
          "type": "number",
          "description": "The nanosecond part of the reported timestamp.",
          "example": 76000000,
          "x-cc-api-group": "TRADE"
        },
        "RECEIVED_TIMESTAMP": {
          "type": "number",
          "description": "The timestamp in seconds when the trade was received. This may differ from the trade timestamp by milliseconds to seconds depending on the market / exchange API options and rate limits.",
          "example": 1642010854,
          "x-cc-api-group": "TRADE"
        },
        "RECEIVED_TIMESTAMP_NS": {
          "type": "number",
          "description": "The nanosecond part of the received timestamp.",
          "example": 980000000,
          "x-cc-api-group": "TRADE"
        },
        "QUANTITY": {
          "type": "number",
          "description": "The volume of the trade, given in the from instrument (base symbol / coin/ contract). For a spot BTC-USD trade, this is how much BTC was traded at the trade price. For a futures BTCUSDPERP, this is the BTC equivalent for the contracts traded.",
          "example": 0.01,
          "x-cc-api-group": "TRADE"
        },
        "PRICE": {
          "type": "number",
          "description": "The price in the to instrument (quote / counter symbol / coin) of the trade. For a BTC-USD trade, this is how much was paid for one BTC in USD. For futures, this will be the price of the contract.",
          "example": 300,
          "x-cc-api-group": "TRADE"
        },
        "QUOTE_QUANTITY": {
          "type": "number",
          "description": "The volume of the trade, given in the to instrument (quote / counter symbol / coin). This is equivalent to QUANTITY * PRICE. E.g. for a BTC-USD trade, this is how much USD was paid in total for the volume of BTC traded. For futures this is the quote currency equivalent for the contracts traded.",
          "example": 3,
          "x-cc-api-group": "TRADE"
        },
        "SOURCE": {
          "type": "string",
          "description": "The source of the trade update: POLLING, STREAMING, GO, BLOB etc.",
          "example": "POLLING",
          "x-cc-api-group": "TRADE"
        },
        "CCSEQ": {
          "type": "number",
          "description": "The internal sequence number for this trade, unique per market / exchange and trading pair. It should always increase by 1 with each new trade discovered, ensuring there are no gaps, though not necessarily in chronological order.",
          "example": 1,
          "x-cc-api-group": "TRADE"
        },
        "STATUS": {
          "type": "string",
          "description": "The status of the trade: VALID, INVALID_DUPLICATE, INVALID_CORRUPTED and INVALID_MIGRATED.",
          "example": "VALID",
          "x-cc-api-group": "STATUS"
        }
      }
    }
  },
  "Err": {
    "type": "object",
    "properties": {}
  }
}
```

### Last tick

This endpoint provides real-time trade and market data for selected instruments on a specified exchange. It delivers the most current price details alongside aggregated data over various time periods including hourly, daily, weekly, monthly, and annually. This comprehensive dataset not only includes the latest price but also offers detailed metrics on volume, open-high-low-close (OHLC) values, and changes over specified periods, making it a valuable resource for tracking market trends and making informed trading decisions.

#### Use Cases

- Real-time Market Monitoring: Traders and analysts can monitor real-time price movements and volume changes of selected instruments to make timely trading decisions.
- Historical Data Analysis: Financial analysts can access historical aggregated data to analyze market trends, perform back-testing of trading strategies, or conduct technical analysis.
- Reporting and Visualization: Data journalists and researchers can use the detailed data provided for creating reports or visual representations of market behaviors over various periods.
- Algorithmic Trading: Developers and firms can integrate this endpoint into algorithmic trading systems to feed real-time and historical data for automated trading decisions.

#### Target Audience

- Financial Analysts and Market Researchers who require detailed and up-to-date market data to analyze trends and prepare market forecasts.
- Trading Firms and Individual Traders who need real-time price information and historical data aggregates for effective trading strategy formulation and execution.
- Fintech Developers looking to integrate cryptocurrency market data into applications or trading platforms for enhanced functionality.
- Academic Researchers and Data Scientists interested in cryptocurrency market dynamics for academic and experimental purposes.

---

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v1_latest_tick

2. restapi:

```js
const baseUrl = "https://data-api.cryptocompare.com/spot/v1/latest/tick";
const params = {
  market: "coinbase",
  instruments: "BTC-USD,ETH-USD",
  apply_mapping: "true",
  api_key: "3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe",
};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
  method: "GET",
  headers: { "Content-type": "application/json; charset=UTF-8" },
};

fetch(url, options)
  .then((response) => response.json())
  .then((json) => console.log(json))
  .catch((err) => console.log(err));
```

3. response schema:

```json
{
  "Data": {
    "type": "object",
    "properties": {
      "TYPE": {
        "type": "string",
        "description": "The type of message this is. It helps identify the nature of the data being returned.",
        "example": "706",
        "x-cc-api-group": "ID"
      },
      "MARKET": {
        "type": "string",
        "description": "The market / exchange under consideration (e.g. coinbase, kraken, etc).",
        "x-cc-api-group": "ID"
      },
      "INSTRUMENT": {
        "type": "string",
        "description": "The unmapped instrument ID",
        "x-cc-api-group": "ID"
      },
      "MAPPED_INSTRUMENT": {
        "type": "string",
        "description": "The mapped instrument ID, derived from our mapping rules. This takes the form: \"BASE-QUOTE\" (e.g. BTC-USD). Only available on instruments that have been mapped.",
        "x-cc-api-group": "MAPPING"
      },
      "BASE": {
        "type": "string",
        "description": "Represents the base asset or coin symbol, commonly known as the ticker (e.g., BTC). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
        "x-cc-api-group": "MAPPING"
      },
      "QUOTE": {
        "type": "string",
        "description": "Represents the quote asset or counter coin symbol, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
        "x-cc-api-group": "MAPPING"
      },
      "BASE_ID": {
        "type": "number",
        "description": "Represents the internal CCData ID for the base asset or coin (e.g., 1 for BTC). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
        "x-cc-api-group": "MAPPING_ADVANCED"
      },
      "QUOTE_ID": {
        "type": "number",
        "description": "Represents the internal CCData ID for the quote asset or counter coin (e.g., 5 for USD). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
        "x-cc-api-group": "MAPPING_ADVANCED"
      },
      "TRANSFORM_FUNCTION": {
        "type": "string",
        "description": "The transform function. This is the function we apply when we do mapping to change values into easier human readable ones and to make sure the mapped direction BASE - QUOTE is constant accross instruments.",
        "x-cc-api-group": "MAPPING_ADVANCED"
      },
      "CCSEQ": {
        "type": "number",
        "description": "Our internal sequence number for this tick update. This is unique per market / exchange and trading pair / instrument. It will always be increasing by 1 for each new tick update we send.",
        "x-cc-api-group": "VALUE"
      },
      "PRICE": {
        "type": "number",
        "description": "The price in the to asset (quote / number symbol / coin) of the latest trade. I.e. for a BTC-USD trade, how much was paid for one BTC in USD).",
        "x-cc-api-group": "VALUE"
      },
      "PRICE_FLAG": {
        "type": "string",
        "description": "The flag indicating whether the price has increased, decreased, or not changed",
        "x-cc-api-group": "VALUE"
      },
      "PRICE_LAST_UPDATE_TS": {
        "type": "number",
        "description": "The timestamp in seconds as reported by the market / exchange. If the market /exchange does not provide this information, the received timestamp will be returned.",
        "x-cc-api-group": "VALUE"
      },
      "PRICE_LAST_UPDATE_TS_NS": {
        "type": "number",
        "description": "The nanoseconds part of the timestamp as reported by the market / exchange. If the market /exchange does not provide this information, the received nanoseconds part of the timestamp will be returned.",
        "x-cc-api-group": "VALUE"
      },
      "LAST_TRADE_QUANTITY": {
        "type": "number",
        "description": "The quantity of the latest trade in the from symbol (base / coin).",
        "x-cc-api-group": "LAST_UPDATE"
      },
      "LAST_TRADE_QUOTE_QUANTITY": {
        "type": "number",
        "description": "The volume of the latest trade in the to asset / quote.",
        "x-cc-api-group": "LAST_UPDATE"
      },
      "LAST_TRADE_ID": {
        "type": "string",
        "description": "The ID of the latest trade.",
        "x-cc-api-group": "LAST_UPDATE"
      },
      "LAST_TRADE_CCSEQ": {
        "type": "number",
        "description": "The CCSEQ of the latest trade.",
        "x-cc-api-group": "LAST_UPDATE"
      },
      "LAST_TRADE_SIDE": {
        "type": "string",
        "description": "The side of the latest trade.",
        "x-cc-api-group": "LAST_UPDATE"
      },
      "LAST_PROCESSED_TRADE_TS": {
        "type": "number",
        "description": "The timestamp in seconds that the last trade was processed, as reported by the market / exchange. If the market / exchange does not provide this information, the timestamp that the trade was received will be returned.",
        "x-cc-api-group": "LAST_PROCESSED"
      },
      "LAST_PROCESSED_TRADE_TS_NS": {
        "type": "number",
        "description": "The nanosecond part of the timestamp that the last trade was processed, as reported by the market / exchange. If the market / exchange does not provide this information, the nanosecond part of the timestamp that the trade was received will be returned.",
        "x-cc-api-group": "LAST_PROCESSED"
      },
      "LAST_PROCESSED_TRADE_PRICE": {
        "type": "number",
        "description": "The price in the quote asset of the last trade processed, as reported by the market / exchange.",
        "x-cc-api-group": "LAST_PROCESSED"
      },
      "LAST_PROCESSED_TRADE_QUANTITY": {
        "type": "number",
        "description": "The quantity of the last processed trade in the from symbol (base / coin).",
        "x-cc-api-group": "LAST_PROCESSED"
      },
      "LAST_PROCESSED_TRADE_QUOTE_QUANTITY": {
        "type": "number",
        "description": "The  volume of the last processed trade in the to asset / quote.",
        "x-cc-api-group": "LAST_PROCESSED"
      },
      "LAST_PROCESSED_TRADE_SIDE": {
        "type": "string",
        "description": "The side of the last processed trade.",
        "x-cc-api-group": "LAST_PROCESSED"
      },
      "LAST_PROCESSED_TRADE_CCSEQ": {
        "type": "number",
        "description": "The CCSEQ of the latest trade.",
        "x-cc-api-group": "LAST_PROCESSED"
      },
      "BEST_BID": {
        "type": "number",
        "description": "The price of the best bid in the to asset (quote / numberer symbol / coin). For a BTC-USD order book, this will be the highest price a person is willing to pay for some BTC in USD, as quoted for 1 full BTC.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_BID_QUANTITY": {
        "type": "number",
        "description": "The quantity of the best bid in the from asset (base / coin). For a BTC-USD order book , this will be the amount of BTC someone is willing to buy at the best price.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_BID_QUOTE_QUANTITY": {
        "type": "number",
        "description": "The quote quantity of the best bid in the to asset (quote / numberer symbol / coin). For a BTC-USD order book, this will be the total USD committed to purchasing BTC at the best price.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_BID_LAST_UPDATE_TS": {
        "type": "number",
        "description": "The timestamp (in seconds) indicating the most recent update to the best bid in the order book.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_BID_LAST_UPDATE_TS_NS": {
        "type": "number",
        "description": "The nanosecond component of the timestamp indicating the most recent update to the best bid in the order book. The value is numerical and provides granular time data for high-frequency trading or other time-sensitive operations.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_BID_POSITION_IN_BOOK_UPDATE_TS": {
        "type": "number",
        "description": "The timestamp (in seconds) indicating best bid position entry/update time in the order book, as reported by the market / exchange. If the market / exchange does not provide this information, the received timestamp will be returned. This is not the time it was promoted to best bid but the time it was added/updated in the order book.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_BID_POSITION_IN_BOOK_UPDATE_TS_NS": {
        "type": "number",
        "description": "The nanosecond component of the timestamp indicating best bid position entry or update time in the order book. The value is numerical and provides granular time data for high-frequency trading or other time-sensitive operations.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_ASK": {
        "type": "number",
        "description": "The price of the best ask in the to asset (quote / numberer symbol / coin). For a BTC-USD order book, this will be the best price someone is willing to sell some BTC in USD, as quoted for 1 full BTC.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_ASK_QUANTITY": {
        "type": "number",
        "description": "The quantity of the best ask in the from asset (base / coin). For a BTC-USD order book, this will be the amount of BTC a person is willing to sell at the best price.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_ASK_QUOTE_QUANTITY": {
        "type": "number",
        "description": "The quote quantity of the best ask in the to asset (quote / numberer symbol / coin). For a BTC-USD order book, this will be the total USD committed to selling BTC at the best price.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_ASK_LAST_UPDATE_TS": {
        "type": "number",
        "description": "The timestamp (in seconds) indicating the most recent update to the best ask in the order book.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_ASK_LAST_UPDATE_TS_NS": {
        "type": "number",
        "description": "The nanosecond component of the timestamp indicating the most recent update to the best ask in the order book. The value is numerical and provides granular time data for high-frequency trading or other time-sensitive operations.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_ASK_POSITION_IN_BOOK_UPDATE_TS": {
        "type": "number",
        "description": "The timestamp (in seconds) indicating best ask position entry/update time in the order book, as reported by the market / exchange. If the market / exchange does not provide this information, the received timestamp will be returned. This is not the time it was promoted to best ask but the time it was added/updated in the order book.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "BEST_ASK_POSITION_IN_BOOK_UPDATE_TS_NS": {
        "type": "number",
        "description": "The nanosecond component of the timestamp indicating best ask position entry or update time in the order book. The value is numerical and provides granular time data for high-frequency trading or other time-sensitive operations.",
        "x-cc-api-group": "TOP_OF_BOOK"
      },
      "CURRENT_HOUR_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from the start of the current hour until now. Given in the base asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quantities from the start of the current hour until now. Given in the base asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from the start of the current hour until now. Given in the base asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all trade quote quantities from the start of the current hour until now. Given in the base asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from the start of the current hour until now. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from the start of the current hour until now. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from the start of the current hour until now. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from the start of the current hour until now. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_OPEN": {
        "type": "number",
        "description": "The open price for the current hour, this is based on the closest trade occurring before the start of the current hour. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_HIGH": {
        "type": "number",
        "description": "The highest trade price of the current hour. If there were no updates in the time period, the open price will be given. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_LOW": {
        "type": "number",
        "description": "The lowest trade price of the current hour. If there were no updates in the time period, the open price will be given. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades that have occurred since the start of the current hour.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades since the start of the current hour.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades since the start of the current hour.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades since the start of the current hour.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_CHANGE": {
        "type": "number",
        "description": "The value change from the current hour. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_HOUR_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the current hour. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "CURRENT_HOUR"
      },
      "CURRENT_DAY_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from the start of the current day (00:00:00 GMT/UTC) until now. Given in the base asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quantities from the start of the current day (00:00:00 GMT/UTC) until now. Given in the base asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from the start of the current day (00:00:00 GMT/UTC) until now. Given in the base asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities from the start of the current day (00:00:00 GMT/UTC) until now. Given in the base asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from the start of the current day (00:00:00 GMT/UTC) until now. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from the start of the current day (00:00:00 GMT/UTC) until now. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from the start of the current day (00:00:00 GMT/UTC) until now. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from the start of the current day (00:00:00 GMT/UTC) until now. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_OPEN": {
        "type": "number",
        "description": "The open price for the current day, this is based on the closest trade occurring before the start of the current day (00:00:00 GMT/UTC). Given in the quote asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_HIGH": {
        "type": "number",
        "description": "The highest trade price of the current day (00:00:00 GMT/UTC). If there were no updates in the time period, the open price will be given. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_LOW": {
        "type": "number",
        "description": "The lowest trade price of the current day (00:00:00 GMT/UTC). If there were no updates in the time period, the open price will be given. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades that have occurred since the start of the current day (00:00:00 GMT/UTC).",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades since the start of the current day (00:00:00 GMT/UTC).",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades since the start of the current day (00:00:00 GMT/UTC).",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades since the start of the current day (00:00:00 GMT/UTC).",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_CHANGE": {
        "type": "number",
        "description": "The value change from the current DAY. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_DAY_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the current DAY. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "CURRENT_DAY"
      },
      "CURRENT_WEEK_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from Monday (00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quantities from Monday (00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from Monday (00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities from Monday (00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from Monday (00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from Monday (00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from Monday (00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from Monday (00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_OPEN": {
        "type": "number",
        "description": "The price of the closest trade to Monday (00:00:00 GMT/UTC) of this week. In a highly liquid market, this would be the last trade that happened on the previous Sunday at (23:59:59 999 GMT/UTC). This will always be supplied and there is no need to do any calculation to get the full weekly value. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_HIGH": {
        "type": "number",
        "description": "The highest traded price of the week excluding the current day. The period will run from Monday - 00:00:00 GMT/UTC to the beginning - 00:00:00 GMT/UTC of the current day of the week. If today is Monday, this value will be the same as CURRENT_WEEK_OPEN. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_LOW": {
        "type": "number",
        "description": "The lowest traded price of the week excluding the current day. The period will run from Monday - 00:00:00 GMT/UTC to the beginning - 00:00:00 GMT/UTC of the current day of the week. If today is Monday, this value will be CURRENT_WEEK_LOW. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades between Monday (00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades between Monday (00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades between Monday (00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades between Monday (00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the week. If today is Monday, this value will be 0.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_CHANGE": {
        "type": "number",
        "description": "The value change from the current WEEK. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_WEEK_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the current WEEK. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "CURRENT_WEEK"
      },
      "CURRENT_MONTH_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the first of the month, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quantities from the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the first of the month, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the first of the month, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities from the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the first of the month, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the first of the month, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the first of the month, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the first of the month, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the first of the month, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_OPEN": {
        "type": "number",
        "description": "The price of the closest trade to the 1st day (00:00:00 GMT/UTC) of this month. In a highly liquid market, this would be the last trade that happened on the previous month at (23:59:59 999 GMT/UTC). This will always be supplied and there is no need to do any calculation to get the full monthly value. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_HIGH": {
        "type": "number",
        "description": "The highest traded price of the month excluding the current day. The period will run from the 1st of the month - 00:00:00 GMT/UTC to the beginning - 00:00:00 GMT/UTC of the current day of the month. If today is the 1st of the month, this value will be CURRENT_MONTH_OPEN. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_LOW": {
        "type": "number",
        "description": "The lowest traded price of the month excluding the current day. The period will run from the 1st of the month - 00:00:00 GMT/UTC to the beginning - 00:00:00 GMT/UTC of the current day of the month. If today is the 1st of the month, this value will be CURRENT_MONTH_OPEN. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades between the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the 1st of the month, this value will be 0.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades between the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the 1st of the month, this value will be 0.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades between the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the 1st of the month, this value will be 0.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades between the 1st of the month (xxxx:xx:01 00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the month. If today is the 1st of the month, this value will be 0.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_CHANGE": {
        "type": "number",
        "description": "The value change from the current MONTH. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_MONTH_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the current MONTH. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "CURRENT_MONTH"
      },
      "CURRENT_YEAR_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quantities from the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities from the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0. Given in the base asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) to the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_OPEN": {
        "type": "number",
        "description": "The price of the closest trade to the 1st of January (00:00:00 GMT/UTC) of this year. In a highly liquid market, this would be the last trade that happened on on the 31st of December of the previous year (23:59:59 999 GMT/UTC). This will always be supplied and there is no need to do any calculation to get the full yearly value. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_HIGH": {
        "type": "number",
        "description": "The highest traded price of the year excluding the current day. The period runs from the 1st of January - 00:00:00 GMT/UTC to the beginning - 00:00:00 GMT/UTC of the current day of the year. If today is the 1st of January, this value will be CURRENT_YEAR_OPEN. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_LOW": {
        "type": "number",
        "description": "The lowest traded price of the year excluding the current day. The period runs from the 1st of January - 00:00:00 GMT/UTC to the beginning - 00:00:00 GMT/UTC of the current day of the year. If today is the 1st of January, this value will be CURRENT_YEAR_OPEN. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades between the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades between the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades between the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades between the 1st of January (xxxx:01:01 00:00:00 GMT/UTC) and the beginning (00:00:00 GMT/UTC) of the current day of the year. If today is the 1st of January, this value will be 0.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_CHANGE": {
        "type": "number",
        "description": "The value change from the current YEAR. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "CURRENT_YEAR_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the current YEAR. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "CURRENT_YEAR"
      },
      "MOVING_24_HOUR_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from 24 hours ago up to the beginning of the current hour (23 hours in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quantities from 24 hours ago up to the beginning of the current hour (23 hours in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from 24 hours ago up to the beginning of the current hour (23 hours in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities from 24 hours ago up to the beginning of the current hour (23 hours in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from 24 hours ago up to the beginning of the current hour (23 hours in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from 24 hours ago up to the beginning of the current hour (23 hours in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from 24 hours ago up to the beginning of the current hour (23 hours in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from 24 hours ago up to the beginning of the current hour (23 hours in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_OPEN": {
        "type": "number",
        "description": "The price of the closest trade to the period start date (23 hours + current hour ago). This will always be supplied and there is no need to do any calculation to get the full 24 hour value. Given in the quote asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_HIGH": {
        "type": "number",
        "description": "The highest traded price of the period. Here, the period runs from 24 hours ago up to the beginning of the current hour (23 hours in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_LOW": {
        "type": "number",
        "description": "The lowest traded price of the period. Here, the period runs from 24 hours ago up to the beginning of the current hour (23 hours in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades that have occurred in the period running from 24 hours ago to the beginning (xx:00:00) of the current hour (23 hours in total).",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades that have occurred in the period running from 24 hours ago to the beginning (xx:00:00) of the current hour (23 hours in total).",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades that have occurred in the period running from 24 hours ago to the beginning (xx:00:00) of the current hour (23 hours in total).",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades that have occurred in the period running from 24 hours ago to the beginning (xx:00:00) of the current hour (23 hours in total).",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_CHANGE": {
        "type": "number",
        "description": "The value change from the MOVING_24_HOUR_CHANGE. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_24_HOUR_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the MOVING_24_HOUR_CHANGE. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "MOVING_24_HOUR"
      },
      "MOVING_7_DAY_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from 7 days ago up to the beginning of the current day (6 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quantities from 7 days ago up to the beginning of the current day (6 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from 7 days ago up to the beginning of the current day (6 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities from 7 days ago up to the beginning of the current day (6 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from 7 days ago up to the beginning of the current day (6 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from 7 days ago up to the beginning of the current day (6 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from 7 days ago up to the beginning of the current day (6 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from 7 days ago up to the beginning of the current day (6 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_OPEN": {
        "type": "number",
        "description": "The price of the closest trade to the period start date (6 days + current day - 00:00:00 GMT/UTC to now). This will always be supplied and there is no need to do any calculation to get the full 7 day value. Given in the quote asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_HIGH": {
        "type": "number",
        "description": "The highest traded price of the period. Here, the period runs from 7 days ago up to the beginning of the current day (6 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_LOW": {
        "type": "number",
        "description": "The lowest traded price of the period. Here, the period runs from 7 days ago up to the beginning of the current day (6 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades that have occurred in the period running from 7 days ago to the beginning (00:00:00 GMT/UTC) of the current day (6 days in total).",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades that have occurred in the period running from 7 days ago to the beginning (00:00:00 GMT/UTC) of the current day (6 days in total).",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades that have occurred in the period running from 7 days ago to the beginning (00:00:00 GMT/UTC) of the current day (6 days in total).",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades that have occurred in the period running from 7 days ago to the beginning (00:00:00 GMT/UTC) of the current day (6 days in total).",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_CHANGE": {
        "type": "number",
        "description": "The value change from the MOVING_7_DAY_CHANGE. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_7_DAY_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the MOVING_7_DAY_CHANGE. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "MOVING_7_DAY"
      },
      "MOVING_30_DAY_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from 30 days ago up to the beginning of the current day (29 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quantities from 30 days ago up to the beginning of the current day (29 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from 30 days ago up to the beginning of the current day (29 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities from 30 days ago up to the beginning of the current day (29 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from 30 days ago up to the beginning of the current day (29 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from 30 days ago up to the beginning of the current day (29 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from 30 days ago up to the beginning of the current day (29 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from 30 days ago up to the beginning of the current day (29 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_OPEN": {
        "type": "number",
        "description": "The price of the closest trade to the period start date (29 days + current day - 00:00:00 GMT/UTC to now).  This will always be supplied and there is no need to do any calculation to get the full 30 day value. Given in the quote asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_HIGH": {
        "type": "number",
        "description": "The highest traded price of the period. Here, the period runs from 30 days ago up to the beginning of the current day (29 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_LOW": {
        "type": "number",
        "description": "The lowest traded price of the period. Here, the period runs from 30 days ago up to the beginning of the current day (29 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades that have occurred in the period running from 30 days ago to the beginning (00:00:00 GMT/UTC) of the current day (29 days in total).",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades that have occurred in the period running from 30 days ago to the beginning (00:00:00 GMT/UTC) of the current day (29 days in total).",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades that have occurred in the period running from 30 days ago to the beginning (00:00:00 GMT/UTC) of the current day (29 days in total).",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades that have occurred in the period running from 30 days ago to the beginning (00:00:00 GMT/UTC) of the current day (29 days in total).",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_CHANGE": {
        "type": "number",
        "description": "The value change from the MOVING_30_DAY_CHANGE. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_30_DAY_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the MOVING_30_DAY_CHANGE. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "MOVING_30_DAY"
      },
      "MOVING_90_DAY_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from 90 days ago up to the beginning of the current day (89 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all trade quantities from 90 days ago up to the beginning of the current day (89 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from 90 days ago up to the beginning of the current day (89 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities from 90 days ago up to the beginning of the current day (89 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from 90 days ago up to the beginning of the current day (89 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from 90 days ago up to the beginning of the current day (89 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from 90 days ago up to the beginning of the current day (89 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from 90 days ago up to the beginning of the current day (89 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_OPEN": {
        "type": "number",
        "description": "The price of the closest trade to the period start date (89 days + current day - 00:00:00 GMT/UTC to now).  This will always be supplied and there is no need to do any calculation to get the full 90 day value. Given in the quote asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_HIGH": {
        "type": "number",
        "description": "The highest value between the MOVING_90_DAY_OPEN and the highest traded price of the period. Here, the period runs from 90 days ago up to the beginning of the current day (89 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_LOW": {
        "type": "number",
        "description": "The lowest traded price of the period. Here, the period runs from 90 days ago up to the beginning of the current day (89 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades that have occurred in the period running from 90 days ago to the beginning (00:00:00 GMT/UTC) of the current day (89 days in total).",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades that have occurred in the period running from 90 days ago to the beginning (00:00:00 GMT/UTC) of the current day (89 days in total).",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades that have occurred in the period running from 90 days ago to the beginning (00:00:00 GMT/UTC) of the current day (89 days in total).",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades that have occurred in the period running from 90 days ago to the beginning (00:00:00 GMT/UTC) of the current day (89 days in total).",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_CHANGE": {
        "type": "number",
        "description": "The value change from the MOVING_90_DAY_CHANGE. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_90_DAY_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the MOVING_90_DAY_CHANGE. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "MOVING_90_DAY"
      },
      "MOVING_180_DAY_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from 180 days ago up to the beginning of the current day (179 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all trade quantities from 180 days ago up to the beginning of the current day (179 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from 180 days ago up to the beginning of the current day (179 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities from 180 days ago up to the beginning of the current day (179 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from 180 days ago up to the beginning of the current day (179 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from 180 days ago up to the beginning of the current day (179 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from 180 days ago up to the beginning of the current day (179 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from 180 days ago up to the beginning of the current day (179 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_OPEN": {
        "type": "number",
        "description": "The price of the closest trade to the period start date (179 days + current day - 00:00:00 GMT/UTC to now). This will always be supplied and there is no need to do any calculation to get the full 180 day value. Given in the quote asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_HIGH": {
        "type": "number",
        "description": "The  highest traded price of the period. Here, the period runs from 180 days ago up to the beginning of the current day (179 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_LOW": {
        "type": "number",
        "description": "The lowest traded price of the period. Here, the period runs from 180 days ago up to the beginning of the current day (179 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades that have occurred in the period from 180 days ago to the beginning (00:00:00 GMT/UTC) of the current day (179 days in total).",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades that have occurred in the period from 180 days ago to the beginning (00:00:00 GMT/UTC) of the current day (179 days in total).",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades that have occurred in the period from 180 days ago to the beginning (00:00:00 GMT/UTC) of the current day (179 days in total).",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades that have occurred in the period from 180 days ago to the beginning (00:00:00 GMT/UTC) of the current day (179 days in total).",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_CHANGE": {
        "type": "number",
        "description": "The value change from the MOVING_180_DAY_CHANGE. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_180_DAY_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the MOVING_180_DAY_CHANGE. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "MOVING_180_DAY"
      },
      "MOVING_365_DAY_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities from 365 days ago up to the beginning of the current day (364 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all trade quantities from 365 days ago up to the beginning of the current day (364 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities from 365 days ago up to the beginning of the current day (364 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities from 365 days ago up to the beginning of the current day (364 days in total). Given in the base asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities from 365 days ago up to the beginning of the current day (364 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities from 365 days ago up to the beginning of the current day (364 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities from 365 days ago up to the beginning of the current day (364 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities from 365 days ago up to the beginning of the current day (364 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_OPEN": {
        "type": "number",
        "description": "The price of the closest trade to the period start date (364 days + current day - 00:00:00 GMT/UTC to now).  This will always be supplied and there is no need to do any calculation to get the full 365 day value. Given in the quote asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_HIGH": {
        "type": "number",
        "description": "The highest price of the period. Here, the period runs from 365 days ago up to the beginning of the current day (364 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_LOW": {
        "type": "number",
        "description": "The lowest traded price of the period. Here, the period runs from 365 days ago up to the beginning of the current day (364 days in total). Given in the quote asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of trades that have occurred during the period running from 365 days ago to the beginning (00:00:00 GMT/UTC) of the current day (364 days in total).",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of buy trades that have occurred during the period running from 365 days ago to the beginning (00:00:00 GMT/UTC) of the current day (364 days in total).",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of sell trades that have occurred during the period running from 365 days ago to the beginning (00:00:00 GMT/UTC) of the current day (364 days in total).",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of unknown trades that have occurred during the period running from 365 days ago to the beginning (00:00:00 GMT/UTC) of the current day (364 days in total).",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_CHANGE": {
        "type": "number",
        "description": "The value change from the MOVING_365_DAY_CHANGE. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "MOVING_365_DAY_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the MOVING_365_DAY_CHANGE. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "MOVING_365_DAY"
      },
      "LIFETIME_FIRST_TRADE_TS": {
        "type": "number",
        "description": "The timestamp of the first trade ever recorded for the instrument",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quantities of all the trades of this instrument. Given in the base asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quantities of all the trades of this instrument. Given in the base asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quantities of all the trades of this instrument. Given in the base asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quantities of all the trades of this instrument. Given in the base asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_QUOTE_VOLUME": {
        "type": "number",
        "description": "The sum of all trade quote quantities of all the trades of this instrument. Given in the quote asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_QUOTE_VOLUME_BUY": {
        "type": "number",
        "description": "The sum of all buy trade quote quantities of all the trades of this instrument. Given in the quote asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_QUOTE_VOLUME_SELL": {
        "type": "number",
        "description": "The sum of all sell trade quote quantities of all the trades of this instrument. Given in the quote asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_QUOTE_VOLUME_UNKNOWN": {
        "type": "number",
        "description": "The sum of all unknown trade quote quantities of all the trades of this instrument. Given in the quote asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_OPEN": {
        "type": "number",
        "description": "The price of the first trade of the instrument. Given in the quote asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_HIGH": {
        "type": "number",
        "description": "The price of the highest trade ever executed for this instrument. Given in the quote asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_HIGH_TS": {
        "type": "number",
        "description": "The the timestamp of the highest trade ever executed for this instrument. Given in the quote asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_LOW": {
        "type": "number",
        "description": "The price of the lowest trade ever executed for this instrument. Given in the quote asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_LOW_TS": {
        "type": "number",
        "description": "The timestamp of the lowest trade ever executed for this instrument. Given in the quote asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_TOTAL_TRADES": {
        "type": "number",
        "description": "The total number of all trades that have ever been executed for this instrument.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_TOTAL_TRADES_BUY": {
        "type": "number",
        "description": "The total number of all buy trades that have ever been executed for this instrument.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_TOTAL_TRADES_SELL": {
        "type": "number",
        "description": "The total number of all sell trades that have ever been executed for this instrument.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_TOTAL_TRADES_UNKNOWN": {
        "type": "number",
        "description": "The total number of all unknown trades that have ever been executed for this instrument.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_CHANGE": {
        "type": "number",
        "description": "The value change from the LIFETIME_CHANGE. If there were no updates in the time period, the value change will be 0. Given in the quote asset.",
        "x-cc-api-group": "LIFETIME"
      },
      "LIFETIME_CHANGE_PERCENTAGE": {
        "type": "number",
        "description": "The percentage change from the current LIFETIME_CHANGE. If there were no updates in the time period, the percentage change will be 0.",
        "x-cc-api-group": "LIFETIME"
      }
    }
  },
  "Err": {
    "type": "object",
    "description": "This object provides detailed information about an error encountered while processing the request. It includes an error code, a message explaining the error, and additional context about the parameters or values that caused the issue. This helps clients identify and resolve issues with their requests.",
    "properties": {
      "type": {
        "type": "integer",
        "description": "A public facing error type. If you want to treat a specific error use the type.",
        "format": "int32",
        "example": 1
      },
      "message": {
        "type": "string",
        "description": "A message describing the error",
        "example": "Not found: market parameter. Value test_market_does_not_exist not integrated yet. We list all markets in lowercase and transform the parameter sent, make sure you check the https://data-api.cryptocompare.com/spot/v1/markets endpoint for a list of all the supported TRADE_SPOT markets"
      },
      "other_info": {
        "type": "object",
        "properties": {
          "param": {
            "type": "string",
            "description": "The parameter that is responsible for the error",
            "example": "market"
          },
          "values": {
            "type": "array",
            "description": "The values responsible for the error",
            "example": ["test_market_does_not_exist"],
            "items": {
              "type": "string"
            }
          }
        }
      }
    }
  }
}
```

### Order book

This endpoint is an advanced resource tailored for users requiring accurate, minute-by-minute market metrics derived from order book snapshots in spot markets. Unlike capturing snapshots themselves, this endpoint provides calculated metrics such as the best bid and ask prices, mid-price, spread percentages, and detailed depth and slippage metrics at specific percentage levels. It ensures consistent data collection at the exact start of each minute, allowing for precise comparisons across different exchanges and instruments. By focusing on metrics built from raw order book messages, the endpoint is ideal for those who need high-resolution and synchronized market data for comprehensive analysis and decision-making.

#### Use Cases

Algorithmic Trading and Strategy Backtesting: Traders and quantitative analysts can utilize precise minute-by-minute metrics to simulate trading strategies and optimize algorithms based on historical data.
Market Dynamics Analysis: Provides detailed insights into market liquidity, depth, and price movements, enabling researchers to analyze market conditions and volatility more effectively.
Risk Assessment and Compliance: Helps in monitoring compliance with trading standards and assessing risks by providing precise metrics at defined moments.
Investment Decision Support: Offers institutional investors and financial professionals critical data points for better decision-making regarding large-scale investments and trades.

#### Target Audience

Quantitative Analysts and Algorithmic Traders: Professionals developing and refining trading algorithms.
Financial Market Researchers: Analysts needing in-depth analysis of market conditions and liquidity.
Compliance Officers and Risk Managers: Those responsible for adherence to financial regulations and risk assessments.
Institutional Investors: Stakeholders managing large portfolios and requiring consistent and detailed market metrics.

#### L2 metric minute

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v1_historical_orderbook_l2_metrics_minute

2. restapi:

```js
const baseUrl =
  "https://data-api.cryptocompare.com/spot/v1/historical/orderbook/l2/metrics/minute";
const params = {
  market: "coinbase",
  instrument: "BTC-USD",
  depth_percentage_levels: "0.5,2,5",
  slippage_size_limits: "50000,100000",
  limit: 5,
  apply_mapping: "true",
  response_format: "JSON",
  api_key: "3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe",
};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
  method: "GET",
  headers: { "Content-type": "application/json; charset=UTF-8" },
};

fetch(url, options)
  .then((response) => response.json())
  .then((json) => console.log(json))
  .catch((err) => console.log(err));
```

3. response schema:

```json
{
  "Data": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "UNIT": {
          "type": "string",
          "description": "The unit of the historical period update: MINUTE for minute, HOUR for hour and DAY for day.",
          "example": "MINUTE"
        },
        "TIMESTAMP": {
          "type": "number",
          "description": "The timestamp in seconds of the minute. It would be every minute at the beginning of the minute.",
          "example": 1707436800
        },
        "TYPE": {
          "type": "string",
          "description": "Type of the message. We currently support two types: 961 for SPOT_MAPPED_ORDERBOOK_SNAPSHOT_METRICS and 796 for UNMAPPED_ORDERBOOK_SNAPSHOT_METRICS.",
          "example": "961",
          "x-cc-api-group": "ID"
        },
        "MARKET": {
          "type": "string",
          "description": "The market / exchange under consideration (e.g. gemini, kraken, coinbase, etc).",
          "example": "coinbase",
          "x-cc-api-group": "ID"
        },
        "INSTRUMENT": {
          "type": "string",
          "description": "The unmapped instrument ID",
          "x-cc-api-group": "ID"
        },
        "CCSEQ": {
          "type": "number",
          "description": "Our internal sequence number for the last order book update applied to underlying order book snapshot, this is unique per exchange and instrument. Should always be increasing by 1 for each new order book update.",
          "x-cc-api-group": "ID"
        },
        "MAPPED_INSTRUMENT": {
          "type": "string",
          "description": "The instrument ID, as derived from our mapping rules. This takes the form \"BASE-QUOTE\" (e.g. BTC-USD). Only available on instruments that have been mapped.",
          "x-cc-api-group": "MAPPING"
        },
        "BASE": {
          "type": "string",
          "description": "Represents the base asset or coin symbol, commonly known as the ticker (e.g., BTC). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "MAPPING"
        },
        "QUOTE": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "MAPPING"
        },
        "DEPTH_ASSET": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol for the depth of the order book, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "ID"
        },
        "SLIPPAGE_ASSET": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol for slippage, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "ID"
        },
        "BEST_BID": {
          "type": "number",
          "description": "The price of the best bid in the to asset (quote / numberer symbol / coin). For a BTC-USD order book, this will be the highest price a person is willing to pay for some BTC in USD, as quoted for 1 full BTC.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "BEST_BID_QUANTITY": {
          "type": "number",
          "description": "The quantity of the best bid in the from asset (base / coin). For a BTC-USD order book , this will be the amount of BTC someone is willing to buy at the best price.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "BEST_BID_QUOTE_QUANTITY": {
          "type": "number",
          "description": "The quote quantity of the best bid in the to asset (quote / numberer symbol / coin). For a BTC-USD order book, this will be the total USD committed to purchasing BTC at the best price.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "BEST_ASK": {
          "type": "number",
          "description": "The price of the best ask in the to asset (quote / numberer symbol / coin). For a BTC-USD order book, this will be the best price someone is willing to sell some BTC in USD, as quoted for 1 full BTC.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "BEST_ASK_QUANTITY": {
          "type": "number",
          "description": "The quantity of the best ask in the from asset (base / coin). For a BTC-USD order book, this will be the amount of BTC a person is willing to sell at the best price.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "BEST_ASK_QUOTE_QUANTITY": {
          "type": "number",
          "description": "The quote quantity of the best ask in the to asset (quote / numberer symbol / coin). For a BTC-USD order book, this will be the total USD committed to selling BTC at the best price.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "MID_PRICE": {
          "type": "number",
          "description": "Represents the mid-price between the best bid and best ask prices in the order book for a specific instrument.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "SPREAD_PERCENTAGE": {
          "type": "number",
          "description": "Represents the percentage difference between the best bid and best ask prices in the order book for a specific instrument.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "SPREAD": {
          "type": "number",
          "description": "Represents the absolute difference between the best bid and best ask prices in the order book for a specific instrument.",
          "x-cc-api-group": "TOP_OF_BOOK"
        }
      },
      "additionalProperties": {
        "type": "number",
        "description": "Contains calculated metrics for market depth and slippage limits, tailored for adaptive trading strategies. Depth fields are prefixed with DEPTH_ and quantify the market depth at specified percentages away from the best ask or bid prices, serving as indicators of liquidity and market stability. Slippage fields, prefixed with SLIPPAGE_, outline the average or maximum slippage values for trading, available in both specific price points and raw figures. Note: slippage metrics can return null for high order values if the market depth is insufficient to fill the order.",
        "pattern": "/^(DEPTH_(BEST|MID)_PRICE_(ASK|BID)_([0-9]+(.[0-9]+)?)_PERCENT|SLIPPAGE_((BEST|MID)_PRICE|RAW)_(AVG|MAX)_(ASK|BID)_([0-9]+(.[0-9]+)?))$/"
      }
    }
  },
  "Warn": {
    "type": "object",
    "description": "This object is used when multiple parameters are validated and a partial response is returned due to some invalid request parameters. It informs the client of the issues encountered while processing the request and provides details about the specific parameters involved.",
    "properties": {
      "type": {
        "type": "integer",
        "description": "A public facing warning type. If you want to treat a specific warning use the type.",
        "format": "int32",
        "example": 1
      },
      "message": {
        "type": "string",
        "description": "A message describing the warning",
        "example": "There are multiple instruments matching your query for WETH-USDT on uniswapv3. We have provided the best match based on our criteria. Other matches include: 0x4e68ccd3e89f51c3074ca5072bbac773960dfa36_2. To select a different match just pass the pool smart contract address and the chain id."
      },
      "other_info": {
        "type": "object",
        "properties": {
          "param": {
            "type": "string",
            "description": "The parameter that is responsible for the warning",
            "example": "instrument"
          },
          "values": {
            "type": "object",
            "description": "The values responsible for the warning",
            "example": {},
            "items": {
              "type": "object",
              "properties": {}
            }
          }
        }
      }
    }
  },
  "Err": {
    "type": "object",
    "properties": {}
  }
}
```

#### L2 snapshots minute

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v2_historical_orderbook_l2_snapshots_minute

2. restapi:

```js
const baseUrl =
  "https://data-api.cryptocompare.com/spot/v2/historical/orderbook/l2/snapshots/minute";
const params = {
  market: "coinbase",
  instrument: "BTC-USD",
  limit: 5,
  depth: 100,
  apply_mapping: "true",
  response_format: "JSON",
  api_key: "3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe",
};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
  method: "GET",
  headers: { "Content-type": "application/json; charset=UTF-8" },
};

fetch(url, options)
  .then((response) => response.json())
  .then((json) => console.log(json))
  .catch((err) => console.log(err));
```

3. response schema:

```json
{
  "Data": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "UNIT": {
          "type": "string",
          "description": "The unit of the historical period update: MINUTE for minute, HOUR for hour and DAY for day.",
          "example": "MINUTE"
        },
        "TIMESTAMP": {
          "type": "number",
          "description": "This field represents the UNIX timestamp, recorded in seconds, that marks the start of each minute. It serves as a precise point-in-time identifier, ensuring that the associated data is accurately timestamped at the very beginning of each minute. This timestamp is crucial for synchronizing and comparing data points across different time series or datasets, facilitating accurate time-based analysis and reporting.",
          "example": 1707436800
        },
        "TYPE": {
          "type": "string",
          "description": "Type of the message. We currently support two types: 797 for UNMAPPED_ORDERBOOK_SNAPSHOT_HISTORY and 956 for SPOT_MAPPED_ORDERBOOK_SNAPSHOT_HISTORY.",
          "example": "956"
        },
        "MARKET": {
          "type": "string",
          "description": "The market / exchange under consideration (e.g. gemini, kraken, coinbase, etc).",
          "example": "coinbase"
        },
        "INSTRUMENT": {
          "type": "string",
          "description": "The unmapped instrument ID"
        },
        "CCSEQ": {
          "type": "number",
          "description": "Our internal sequence number for the last order book update applied to underlying order book snapshot, this is unique per exchange and instrument. Should always be increasing by 1 for each new order book update."
        },
        "MAPPED_INSTRUMENT": {
          "type": "string",
          "description": "The instrument ID, as derived from our mapping rules. This takes the form \"BASE-QUOTE\" (e.g. BTC-USD). Only available on instruments that have been mapped."
        },
        "BASE": {
          "type": "string",
          "description": "Represents the base asset or coin symbol, commonly known as the ticker (e.g., BTC). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping."
        },
        "QUOTE": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping."
        },
        "TOTAL_AVAILABLE_ASKS": {
          "type": "number",
          "description": "Represents the total number of Level 2 ask positions available in the order book for a specific spot instrument. This metric provides insight into the depth of the market on the sell side, indicating the number of distinct price levels at which sellers are willing to transact."
        },
        "TOTAL_AVAILABLE_BIDS": {
          "type": "number",
          "description": "Represents the total number of Level 2 bid positions available in the order book for a specific spot instrument. It reflects the market depth on the buy side, showing the number of different price levels at which buyers are placing their bids."
        },
        "ASKS": {
          "type": "array",
          "description": "Details the list of best ask prices in the order book for a specific spot instrument, highlighting the lowest prices at which sellers are willing to sell their holdings, along with the quantity available at each price level.",
          "items": {
            "type": "object",
            "properties": {
              "PRICE": {
                "type": "number",
                "description": "The asking price for each unit of the instrument in the quote currency or asset. For a BTC-USD trade, it denotes the USD price per BTC."
              },
              "QUANTITY": {
                "type": "number",
                "description": "Indicates the volume of the instrument available at the specified ask price."
              },
              "LAST_UPDATE": {
                "type": "number",
                "description": "The timestamp of the most recent update to an ask price in the order book, given in seconds. If the market / exchange does not provide this information, the received timestamp will be returned."
              },
              "LAST_UPDATE_NS": {
                "type": "number",
                "description": "Provides the nanosecond part of the last update timestamp for more precise timing. If the market / exchange does not provide this information, the received nanoseconds part of the timestamp will be returned."
              }
            }
          }
        },
        "BIDS": {
          "type": "array",
          "description": "Lists the best bid prices in the order book for a specific spot instrument, showing the highest prices buyers are willing to pay, along with the quantity they are willing to buy at each price level.",
          "items": {
            "type": "object",
            "properties": {
              "PRICE": {
                "type": "number",
                "description": "Represents the bid price for the instrument in the quote currency or asset, such as the USD price offered for one unit of BTC in a BTC-USD trade."
              },
              "QUANTITY": {
                "type": "number",
                "description": "Shows the amount of the instrument buyers are looking to purchase at the given bid price."
              },
              "LAST_UPDATE": {
                "type": "number",
                "description": "Timestamp indicating the last time a bid price was updated in the order book, measured in seconds. If the market / exchange does not provide this information, the received timestamp will be returned."
              },
              "LAST_UPDATE_NS": {
                "type": "number",
                "description": "Provides the nanoseconds part of the last update timestamp for enhanced precision. If the market / exchange does not provide this information, the received nanoseconds part of the timestamp will be returned."
              }
            }
          }
        }
      }
    }
  },
  "Err": {
    "type": "object",
    "properties": {}
  }
}
```

#### L2 consolidated metrics minute

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v1_historical_orderbook_l2_consolidated_metrics_minute

2. restapi:

```js
const baseUrl =
  "https://data-api.cryptocompare.com/spot/v1/historical/orderbook/l2/consolidated/metrics/minute";
const params = {
  instrument: "BTC-USD",
  markets: "kraken,coinbase",
  depth_percentage_levels: "0.5,2,5",
  slippage_size_limits: "100000,500000,1000000",
  limit: 5,
  response_format: "JSON",
  api_key: "3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe",
};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
  method: "GET",
  headers: { "Content-type": "application/json; charset=UTF-8" },
};

fetch(url, options)
  .then((response) => response.json())
  .then((json) => console.log(json))
  .catch((err) => console.log(err));
```

3. response schema:

```json
{
  "Data": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "UNIT": {
          "type": "string",
          "description": "The unit of the historical period update: MINUTE for minute, HOUR for hour and DAY for day.",
          "example": "MINUTE"
        },
        "TIMESTAMP": {
          "type": "number",
          "description": "The timestamp in seconds of the minute. It would be every minute at the beginning of the minute.",
          "example": 1707436800
        },
        "TYPE": {
          "type": "string",
          "description": "Type of the message. We currently support two types: 1540 for SPOT_MAPPED_ORDERBOOK_CONSOLIDATED_SNAPSHOT_METRICS and 1530 for UNMAPPED_ORDERBOOK_CONSOLIDATED_SNAPSHOT_METRICS.",
          "example": "1540",
          "x-cc-api-group": "ID"
        },
        "CONSOLIDATED_ORDER_BOOKS": {
          "type": "array",
          "description": "Details the list of consolidated markets.",
          "items": {
            "type": "object",
            "properties": {
              "MARKET": {
                "type": "string",
                "description": "The market / exchange under consideration (e.g. gemini, kraken, coinbase, etc)"
              },
              "INSTRUMENT": {
                "type": "string",
                "description": "The unmapped instrument ID"
              },
              "CCSEQ": {
                "type": "number",
                "description": "Our internal sequence number for the last order book update applied to underlying order book snapshot, this is unique per exchange and instrument. Should always be increasing by 1 for each new order book update."
              }
            }
          },
          "x-cc-api-group": "ID"
        },
        "MAPPED_INSTRUMENT": {
          "type": "string",
          "description": "The instrument ID, as derived from our mapping rules. This takes the form \"BASE-QUOTE\" (e.g. BTC-USD). Only available on instruments that have been mapped.",
          "x-cc-api-group": "MAPPING"
        },
        "BASE": {
          "type": "string",
          "description": "Represents the base asset or coin symbol, commonly known as the ticker (e.g., BTC). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "MAPPING"
        },
        "QUOTE": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "MAPPING"
        },
        "DEPTH_ASSET": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol for the depth of the order book, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "ID"
        },
        "SLIPPAGE_ASSET": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol for slippage, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping.",
          "x-cc-api-group": "ID"
        },
        "CONSOLIDATED_BEST_BID": {
          "type": "number",
          "description": "The price of the best bid in the to asset (quote / numberer symbol / coin). For a BTC-USD order book, this will be the highest price a person is willing to pay for some BTC in USD, as quoted for 1 full BTC.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "CONSOLIDATED_BEST_BID_QUANTITY": {
          "type": "number",
          "description": "The quantity of the best bid in the from asset (base / coin). For a BTC-USD order book , this will be the amount of BTC someone is willing to buy at the best price.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "CONSOLIDATED_BEST_BID_MARKET": {
          "type": "string",
          "description": "The market / exchange with the best bid. (e.g. gemini, kraken, coinbase, etc)",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "CONSOLIDATED_BEST_ASK": {
          "type": "number",
          "description": "The price of the best ask in the to asset (quote / numberer symbol / coin). For a BTC-USD order book, this will be the best price someone is willing to sell some BTC in USD, as quoted for 1 full BTC.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "CONSOLIDATED_BEST_ASK_QUANTITY": {
          "type": "number",
          "description": "The quantity of the best ask in the from asset (base / coin). For a BTC-USD order book, this will be the amount of BTC a person is willing to sell at the best price.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "CONSOLIDATED_BEST_ASK_MARKET": {
          "type": "string",
          "description": "The market / exchange with the best ask. (e.g. gemini, kraken, coinbase, etc)",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "CONSOLIDATED_MID_PRICE": {
          "type": "number",
          "description": "Represents the mid-price between the best bid and best ask prices in the order book for a specific instrument.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "CONSOLIDATED_SPREAD_PERCENTAGE": {
          "type": "number",
          "description": "Represents the percentage difference between the best bid and best ask prices in the order book for a specific instrument.",
          "x-cc-api-group": "TOP_OF_BOOK"
        },
        "CONSOLIDATED_SPREAD": {
          "type": "number",
          "description": "Represents the absolute difference between the best bid and best ask prices in the order book for a specific instrument.",
          "x-cc-api-group": "TOP_OF_BOOK"
        }
      },
      "additionalProperties": {
        "type": "number",
        "description": "Contains calculated metrics for market depth and slippage limits, tailored for adaptive trading strategies. Depth fields are prefixed with DEPTH_ and quantify the market depth at specified percentages away from the best ask or bid prices, serving as indicators of liquidity and market stability. Slippage fields, prefixed with SLIPPAGE_, outline the average or maximum slippage values for trading, available in both specific price points and raw figures. Note: slippage metrics can return null for high order values if the market depth is insufficient to fill the order.",
        "pattern": "/^(DEPTH_(BEST|MID)_PRICE_(ASK|BID)_([0-9]+(.[0-9]+)?)_PERCENT|SLIPPAGE_((BEST|MID)_PRICE|RAW)_(AVG|MAX)_(ASK|BID)_([0-9]+(.[0-9]+)?))$/"
      }
    }
  },
  "Warn": {
    "type": "object",
    "description": "This object is used when multiple parameters are validated and a partial response is returned due to some invalid request parameters. It informs the client of the issues encountered while processing the request and provides details about the specific parameters involved.",
    "properties": {
      "type": {
        "type": "integer",
        "description": "A public facing warning type. If you want to treat a specific warning use the type.",
        "format": "int32",
        "example": 1
      },
      "message": {
        "type": "string",
        "description": "A message describing the warning",
        "example": "There are multiple instruments matching your query for WETH-USDT on uniswapv3. We have provided the best match based on our criteria. Other matches include: 0x4e68ccd3e89f51c3074ca5072bbac773960dfa36_2. To select a different match just pass the pool smart contract address and the chain id."
      },
      "other_info": {
        "type": "object",
        "properties": {
          "param": {
            "type": "string",
            "description": "The parameter that is responsible for the warning",
            "example": "instrument"
          },
          "values": {
            "type": "object",
            "description": "The values responsible for the warning",
            "example": {},
            "items": {
              "type": "object",
              "properties": {}
            }
          }
        }
      }
    }
  },
  "Err": {
    "type": "object",
    "properties": {}
  }
}
```

#### L2 consolidated snapshots minute

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v1_historical_orderbook_l2_consolidated_snapshots_minute

2. restapi:

```js
const baseUrl =
  "https://data-api.cryptocompare.com/spot/v1/historical/orderbook/l2/consolidated/snapshots/minute";
const params = {
  instrument: "BTC-USD",
  markets: "kraken,coinbase",
  limit: 5,
  depth: 100,
  response_format: "JSON",
  api_key: "3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe",
};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
  method: "GET",
  headers: { "Content-type": "application/json; charset=UTF-8" },
};

fetch(url, options)
  .then((response) => response.json())
  .then((json) => console.log(json))
  .catch((err) => console.log(err));
```

3. response schema:

```json
{
  "Data": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "UNIT": {
          "type": "string",
          "description": "The unit of the historical period update: MINUTE for minute, HOUR for hour and DAY for day.",
          "example": "MINUTE"
        },
        "TIMESTAMP": {
          "type": "number",
          "description": "This field represents the UNIX timestamp, recorded in seconds, that marks the start of each minute. It serves as a precise point-in-time identifier, ensuring that the associated data is accurately timestamped at the very beginning of each minute. This timestamp is crucial for synchronizing and comparing data points across different time series or datasets, facilitating accurate time-based analysis and reporting.",
          "example": 1707436800
        },
        "TYPE": {
          "type": "string",
          "description": "Type of the message. We currently support two types: 1531 for UNMAPPED_ORDERBOOK_CONSOLIDATED_SNAPSHOT_HISTORY and 1541 for SPOT_MAPPED_ORDERBOOK_CONSOLIDATED_SNAPSHOT_HISTORY.",
          "example": "1541"
        },
        "MARKET": {
          "type": "string",
          "description": "The market / exchange under consideration (e.g. gemini, kraken, coinbase, etc).",
          "example": "coinbase"
        },
        "CONSOLIDATED_ORDER_BOOKS": {
          "type": "array",
          "description": "Details the list of consolidated markets.",
          "items": {
            "type": "object",
            "properties": {
              "MARKET": {
                "type": "string",
                "description": "The market / exchange under consideration (e.g. gemini, kraken, coinbase, etc)"
              },
              "INSTRUMENT": {
                "type": "string",
                "description": "The unmapped instrument ID"
              },
              "CCSEQ": {
                "type": "number",
                "description": "Our internal sequence number for the last order book update applied to underlying order book snapshot, this is unique per exchange and instrument. Should always be increasing by 1 for each new order book update."
              }
            }
          }
        },
        "MAPPED_INSTRUMENT": {
          "type": "string",
          "description": "The instrument ID, as derived from our mapping rules. This takes the form \"BASE-QUOTE\" (e.g. BTC-USD). Only available on instruments that have been mapped."
        },
        "BASE": {
          "type": "string",
          "description": "Represents the base asset or coin symbol, commonly known as the ticker (e.g., BTC). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping."
        },
        "QUOTE": {
          "type": "string",
          "description": "Represents the quote asset or counter coin symbol, commonly known as the ticker (e.g., USD). This symbol may change in cases of asset rebranding. Applicable only to instruments with a mapping."
        },
        "TOTAL_AVAILABLE_ASKS": {
          "type": "number",
          "description": "Represents the total number of Level 2 ask positions available in the order book for a specific spot instrument. This metric provides insight into the depth of the market on the sell side, indicating the number of distinct price levels at which sellers are willing to transact."
        },
        "TOTAL_AVAILABLE_BIDS": {
          "type": "number",
          "description": "Represents the total number of Level 2 bid positions available in the order book for a specific spot instrument. It reflects the market depth on the buy side, showing the number of different price levels at which buyers are placing their bids."
        },
        "ASKS": {
          "type": "array",
          "description": "Details the list of best ask prices in the order book for a specific spot instrument, highlighting the lowest prices at which sellers are willing to sell their holdings, along with the quantity available at each price level.",
          "items": {
            "type": "object",
            "properties": {
              "MARKET": {
                "type": "string",
                "description": "The market / exchange under consideration (e.g. gemini, kraken, coinbase, etc)"
              },
              "PRICE": {
                "type": "number",
                "description": "The asking price for each unit of the instrument in the quote currency or asset. For a BTC-USD trade, it denotes the USD price per BTC."
              },
              "QUANTITY": {
                "type": "number",
                "description": "Indicates the volume of the instrument available at the specified ask price."
              },
              "LAST_UPDATE": {
                "type": "number",
                "description": "The timestamp of the most recent update to an ask price in the order book, given in seconds. If the market / exchange does not provide this information, the received timestamp will be returned."
              },
              "LAST_UPDATE_NS": {
                "type": "number",
                "description": "Provides the nanosecond part of the last update timestamp for more precise timing. If the market / exchange does not provide this information, the received nanoseconds part of the timestamp will be returned."
              }
            }
          }
        },
        "BIDS": {
          "type": "array",
          "description": "Lists the best bid prices in the order book for a specific spot instrument, showing the highest prices buyers are willing to pay, along with the quantity they are willing to buy at each price level.",
          "items": {
            "type": "object",
            "properties": {
              "MARKET": {
                "type": "string",
                "description": "The market / exchange under consideration (e.g. gemini, kraken, coinbase, etc)"
              },
              "PRICE": {
                "type": "number",
                "description": "Represents the bid price for the instrument in the quote currency or asset, such as the USD price offered for one unit of BTC in a BTC-USD trade."
              },
              "QUANTITY": {
                "type": "number",
                "description": "Shows the amount of the instrument buyers are looking to purchase at the given bid price."
              },
              "LAST_UPDATE": {
                "type": "number",
                "description": "Timestamp indicating the last time a bid price was updated in the order book, measured in seconds. If the market / exchange does not provide this information, the received timestamp will be returned."
              },
              "LAST_UPDATE_NS": {
                "type": "number",
                "description": "Provides the nanoseconds part of the last update timestamp for enhanced precision. If the market / exchange does not provide this information, the received nanoseconds part of the timestamp will be returned."
              }
            }
          }
        }
      }
    }
  },
  "Warn": {
    "type": "object",
    "description": "This object is used when multiple parameters are validated and a partial response is returned due to some invalid request parameters. It informs the client of the issues encountered while processing the request and provides details about the specific parameters involved.",
    "properties": {
      "type": {
        "type": "integer",
        "description": "A public facing warning type. If you want to treat a specific warning use the type.",
        "format": "int32",
        "example": 1
      },
      "message": {
        "type": "string",
        "description": "A message describing the warning",
        "example": "There are multiple instruments matching your query for WETH-USDT on uniswapv3. We have provided the best match based on our criteria. Other matches include: 0x4e68ccd3e89f51c3074ca5072bbac773960dfa36_2. To select a different match just pass the pool smart contract address and the chain id."
      },
      "other_info": {
        "type": "object",
        "properties": {
          "param": {
            "type": "string",
            "description": "The parameter that is responsible for the warning",
            "example": "instrument"
          },
          "values": {
            "type": "object",
            "description": "The values responsible for the warning",
            "example": {},
            "items": {
              "type": "object",
              "properties": {}
            }
          }
        }
      }
    }
  },
  "Err": {
    "type": "object",
    "properties": {}
  }
}
```

### Instrument metadata

This endpoint, specific to the Spot segment of the API, delivers vital metadata about financial instruments traded on specified exchanges, focusing solely on non-price related information. This endpoint is crucial for internal use, offering a comprehensive dataset that includes mappings, operational statuses, and historical data (first seen/last seen timestamps) about each instrument. Unlike the Markets + Instruments endpoint, which provides a more streamlined subset of this data, the Instrument Metadata endpoint is designed for extensive internal analysis and integration, ensuring that organizations have access to all relevant details needed for managing and evaluating trading instruments.

#### Use Cases

- Internal Data Management: Ideal for financial institutions requiring complete data oversight and internal record-keeping of trading instruments.
- Comprehensive Data Integration: Supports complex integrations where extensive instrument metadata is crucial, far beyond the basic market data.
- Regulatory Compliance and Reporting: Facilitates compliance with trading regulations by providing exhaustive historical and status data necessary for reporting and monitoring.
- Advanced Research and Analysis: Offers the necessary data depth for detailed market research or backtesting strategies by providing thorough historical access and status insights.

#### Target Audience

- Data Managers in Financial Institutions: Professionals tasked with managing and maintaining a comprehensive dataset of financial instruments.
- System Integrators and IT Professionals: Users who integrate and maintain financial data systems requiring extensive data about each instrument.
- Compliance and Regulatory Officers: Professionals needing detailed instrument histories and status information for compliance and monitoring.
- Financial Researchers and Analysts: Analysts and researchers who need deep, detailed metadata for advanced financial analysis or historical research.

This endpoint serves as an essential resource for organizations that rely on having exhaustive, detailed metadata about financial instruments. For users requiring less detailed information, the Markets + Instruments endpoint may be more appropriate, offering a more accessible view of instrument data that satisfies general market analysis needs without the depth provided here.

---

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v1_latest_instrument_metadata

2. restapi:

```js
const baseUrl =
  "https://data-api.cryptocompare.com/spot/v1/latest/instrument/metadata";
const params = {
  market: "coinbase",
  instruments: "BTC-USD,ETH-USD",
  apply_mapping: "true",
  api_key: "3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe",
};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
  method: "GET",
  headers: { "Content-type": "application/json; charset=UTF-8" },
};

fetch(url, options)
  .then((response) => response.json())
  .then((json) => console.log(json))
  .catch((err) => console.log(err));
```

3. response schema:

```json
{
  "Data": {
    "type": "object",
    "properties": {
      "METADATA_VERSION": {
        "type": "number",
        "description": "The version of metadata, used for version conversions/migrates.",
        "default": 8,
        "example": 8,
        "x-cc-api-group": "STATUS"
      },
      "INSTRUMENT_STATUS": {
        "type": "string",
        "description": "The status of the instrument, we only poll / stream / connect to the ACTIVE ones, for the RETIRED / IGNORED / EXPIRED / READY_FOR_DECOMMISSIONING means we no longer query/stream data.",
        "default": "ACTIVE",
        "example": "ACTIVE",
        "x-cc-api-group": "STATUS"
      },
      "INSTRUMENT": {
        "type": "string",
        "description": "The instrument ID as it is on the exchange with small modifications - we do not allow the following characters inside isntrument ids: ,/&?",
        "x-cc-api-group": "GENERAL"
      },
      "INSTRUMENT_MAPPING": {
        "type": "object",
        "description": "The current mapping information for this instrument",
        "properties": {},
        "default": {},
        "example": {},
        "x-cc-api-group": "GENERAL"
      },
      "INSTRUMENT_EXTERNAL_DATA": {
        "type": "string",
        "description": "The full data we get from the polling endpoint for this specific instrument. This is a JSON stringified object with different properties per exchange.",
        "x-cc-api-group": "GENERAL"
      },
      "PROCESSING_TRADES_FROM_BLOB_STATUS": {
        "type": "string",
        "description": "This states the status of blob migration for this instrument on this exchange.",
        "x-cc-api-group": "INTERNAL"
      },
      "ARCHIVE_STATUS": {
        "type": "string",
        "description": "The archive status of the instrument",
        "x-cc-api-group": "MIGRATION"
      },
      "HOST_MIGRATION_STATUS": {
        "type": "string",
        "description": "The migration status of the symbol, we only poll / stream / connect empty or SETTLED",
        "x-cc-api-group": "MIGRATION"
      },
      "HOST_MIGRATION_SOURCE": {
        "type": "string",
        "description": "The migration source vm hostname.",
        "x-cc-api-group": "MIGRATION"
      },
      "HOST_MIGRATION_DESTINATION": {
        "type": "string",
        "description": "The migration destination vm hostname.",
        "x-cc-api-group": "MIGRATION"
      },
      "ORDERBOOK_MAX_DEPTH": {
        "type": "number",
        "description": "The maximum number of positions to keep in the orderbook, for each side.",
        "x-cc-api-group": "GENERAL"
      },
      "FIRST_OB_L2_MINUTE_SNAPSHOT_TS": {
        "type": "number",
        "description": "Timestamp of the initial Level 2 minute snapshot.",
        "x-cc-api-group": "GENERAL"
      },
      "INSTRUMENT_TRADE_SPOT_REST_URI": {
        "type": "string",
        "description": "This is used to build up the request in some cases, this is where we put the id we use when querying for TRADE_SPOT.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_TRADE_SPOT_REST_URL": {
        "type": "string",
        "description": "The URL we send to the proxy swarm to get TRADE_SPOT for the instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_TRADE_SPOT_STREAMING_SUBSCRIPTION": {
        "type": "string",
        "description": "This is used to build up the subscription in some cases, this is where we put the id we use when subscribing for TRADE_SPOT on this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_TRADE_SPOT_IS_READY_FOR_STREAMING_INTEGRATION": {
        "type": "boolean",
        "description": "This flags the exchange instrument as in ready to consume TRADE_SPOT via a streaming integration.",
        "default": false,
        "example": false,
        "x-cc-api-group": "SOURCE"
      },
      "TOTAL_TRADES_SPOT": {
        "type": "number",
        "description": "This is both the CCSEQ and the total TRADES_SPOT we have processed on this instrument",
        "x-cc-api-group": "INTERNAL"
      },
      "LAST_CONCURRENT_BATCH_OF_TRADES_SPOT_MS": {
        "type": "number",
        "description": "The timestamp last encountered where the batch of trades from TRADES_SPOT all occured at the same time. This is an issue when making the next request that requires polling by timestamp as a start/from parameter",
        "x-cc-api-group": "INTERNAL"
      },
      "INSTRUMENT_TRADE_SPOT_FROM_POLLING_REST_URI_LAST_RESPONSE_TS": {
        "type": "number",
        "description": "The last time we received a request from the proxy swarm with TRADE_SPOT for this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_TRADE_SPOT_FROM_POLLING_REST_URI_LAST_REQUEST_TS": {
        "type": "number",
        "description": "The last time we sent a request to the proxy swarm to get TRADE_SPOT for the instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_TRADE_SPOT_FROM_POLLING_REST_URI_NEXT_REQUEST_TS": {
        "type": "number",
        "description": "The next time we expect to make a request for TRADE_SPOT on this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_TRADE_SPOT_FROM_POLLING_LAST_PROXIED_REST_REQUEST": {
        "type": "object",
        "description": "The last proxied REST request we sent to the proxy swarm to get TRADE_SPOT for the instrument.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_POLLING": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_POLLING": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_POLLING_EXTERNAL": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_POLLING_EXTERNAL": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_TRADE_SPOT_FROM_POLLING_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper TRADE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_STREAMING": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_STREAMING": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_STREAMING_EXTERNAL": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_STREAMING_EXTERNAL": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_TRADE_SPOT_FROM_STREAMING_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper TRADE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_GO": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_GO": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_GO_EXTERNAL": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_GO_EXTERNAL": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_TRADE_SPOT_FROM_GO_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper TRADE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_BLOB": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_BLOB": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_BLOB_EXTERNAL": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_BLOB_EXTERNAL": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_TRADE_SPOT_FROM_BLOB_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper TRADE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_CALCULATED": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_CALCULATED": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_CALCULATED_EXTERNAL": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_CALCULATED_EXTERNAL": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_TRADE_SPOT_FROM_CALCULATED_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper TRADE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_TRADE_SPOT_FROM_BACKFILL_REST_URI_LAST_RESPONSE_TS": {
        "type": "number",
        "description": "The last time we received a request from the proxy swarm with TRADE_SPOT for this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_TRADE_SPOT_FROM_BACKFILL_REST_URI_LAST_REQUEST_TS": {
        "type": "number",
        "description": "The last time we sent a request to the proxy swarm to get TRADE_SPOT for the instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_TRADE_SPOT_FROM_BACKFILL_REST_URI_NEXT_REQUEST_TS": {
        "type": "number",
        "description": "The next time we expect to make a request for TRADE_SPOT on this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_TRADE_SPOT_FROM_BACKFILL_LAST_PROXIED_REST_REQUEST": {
        "type": "object",
        "description": "The last proxied REST request we sent to the proxy swarm to get TRADE_SPOT for the instrument.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_BACKFILL": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_BACKFILL": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_BACKFILL_EXTERNAL": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_BACKFILL_EXTERNAL": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_TRADE_SPOT_FROM_BACKFILL_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper TRADE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_FIX": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_FIX": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_FIX_EXTERNAL": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_FIX_EXTERNAL": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_TRADE_SPOT_FROM_FIX_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper TRADE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_EOD": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_EOD": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "SIDE": {
            "type": "string"
          },
          "ID": {
            "type": "string"
          },
          "TIMESTAMP": {
            "type": "number"
          },
          "TIMESTAMP_NS": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP": {
            "type": "number"
          },
          "RECEIVED_TIMESTAMP_NS": {
            "type": "number"
          },
          "QUANTITY": {
            "type": "number"
          },
          "PRICE": {
            "type": "number"
          },
          "QUOTE_QUANTITY": {
            "type": "number"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_TRADE_SPOT_FROM_EOD_EXTERNAL": {
        "type": "object",
        "description": "This is the first TRADE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_TRADE_SPOT_FROM_EOD_EXTERNAL": {
        "type": "object",
        "description": "This is the last TRADE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_TRADE_SPOT_FROM_EOD_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper TRADE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_REST_URI": {
        "type": "string",
        "description": "This is used to build up the request in some cases, this is where we put the id we use when querying for OB_L2_SNAPSHOT_SPOT.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_REST_URL": {
        "type": "string",
        "description": "The URL we send to the proxy swarm to get OB_L2_SNAPSHOT_SPOT for the instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_STREAMING_SUBSCRIPTION": {
        "type": "string",
        "description": "This is used to build up the subscription in some cases, this is where we put the id we use when subscribing for OB_L2_SNAPSHOT_SPOT on this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_IS_READY_FOR_STREAMING_INTEGRATION": {
        "type": "boolean",
        "description": "This flags the exchange instrument as in ready to consume OB_L2_SNAPSHOT_SPOT via a streaming integration.",
        "default": false,
        "example": false,
        "x-cc-api-group": "SOURCE"
      },
      "TOTAL_OB_L2_SNAPSHOTS_SPOT": {
        "type": "number",
        "description": "This is both the CCSEQ and the total OB_L2_SNAPSHOTS_SPOT we have processed on this instrument",
        "x-cc-api-group": "INTERNAL"
      },
      "LAST_CONCURRENT_BATCH_OF_OB_L2_SNAPSHOTS_SPOT_MS": {
        "type": "number",
        "description": "The timestamp last encountered where the batch of trades from OB_L2_SNAPSHOTS_SPOT all occured at the same time. This is an issue when making the next request that requires polling by timestamp as a start/from parameter",
        "x-cc-api-group": "INTERNAL"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_FROM_POLLING_REST_URI_LAST_RESPONSE_TS": {
        "type": "number",
        "description": "The last time we received a request from the proxy swarm with OB_L2_SNAPSHOT_SPOT for this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_FROM_POLLING_REST_URI_LAST_REQUEST_TS": {
        "type": "number",
        "description": "The last time we sent a request to the proxy swarm to get OB_L2_SNAPSHOT_SPOT for the instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_FROM_POLLING_REST_URI_NEXT_REQUEST_TS": {
        "type": "number",
        "description": "The next time we expect to make a request for OB_L2_SNAPSHOT_SPOT on this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_FROM_POLLING_LAST_PROXIED_REST_REQUEST": {
        "type": "object",
        "description": "The last proxied REST request we sent to the proxy swarm to get OB_L2_SNAPSHOT_SPOT for the instrument.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_POLLING": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_POLLING": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_POLLING_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_POLLING_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_SNAPSHOT_SPOT_FROM_POLLING_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_SNAPSHOT_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_STREAMING": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_STREAMING": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_STREAMING_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_STREAMING_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_SNAPSHOT_SPOT_FROM_STREAMING_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_SNAPSHOT_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_GO": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_GO": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_GO_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_GO_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_SNAPSHOT_SPOT_FROM_GO_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_SNAPSHOT_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_BLOB": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_BLOB": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_BLOB_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_BLOB_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_SNAPSHOT_SPOT_FROM_BLOB_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_SNAPSHOT_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_CALCULATED": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_CALCULATED": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_CALCULATED_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_CALCULATED_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_SNAPSHOT_SPOT_FROM_CALCULATED_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_SNAPSHOT_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_FROM_BACKFILL_REST_URI_LAST_RESPONSE_TS": {
        "type": "number",
        "description": "The last time we received a request from the proxy swarm with OB_L2_SNAPSHOT_SPOT for this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_FROM_BACKFILL_REST_URI_LAST_REQUEST_TS": {
        "type": "number",
        "description": "The last time we sent a request to the proxy swarm to get OB_L2_SNAPSHOT_SPOT for the instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_FROM_BACKFILL_REST_URI_NEXT_REQUEST_TS": {
        "type": "number",
        "description": "The next time we expect to make a request for OB_L2_SNAPSHOT_SPOT on this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_SNAPSHOT_SPOT_FROM_BACKFILL_LAST_PROXIED_REST_REQUEST": {
        "type": "object",
        "description": "The last proxied REST request we sent to the proxy swarm to get OB_L2_SNAPSHOT_SPOT for the instrument.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_BACKFILL": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_BACKFILL": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_BACKFILL_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_BACKFILL_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_SNAPSHOT_SPOT_FROM_BACKFILL_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_SNAPSHOT_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_FIX": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_FIX": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_FIX_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_FIX_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_SNAPSHOT_SPOT_FROM_FIX_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_SNAPSHOT_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_EOD": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_EOD": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_SNAPSHOT_SPOT_FROM_EOD_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_SNAPSHOT_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_SNAPSHOT_SPOT_FROM_EOD_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_SNAPSHOT_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_SNAPSHOT_SPOT_FROM_EOD_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_SNAPSHOT_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_REST_URI": {
        "type": "string",
        "description": "This is used to build up the request in some cases, this is where we put the id we use when querying for OB_L2_UPDATE_SPOT.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_REST_URL": {
        "type": "string",
        "description": "The URL we send to the proxy swarm to get OB_L2_UPDATE_SPOT for the instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_STREAMING_SUBSCRIPTION": {
        "type": "string",
        "description": "This is used to build up the subscription in some cases, this is where we put the id we use when subscribing for OB_L2_UPDATE_SPOT on this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_IS_READY_FOR_STREAMING_INTEGRATION": {
        "type": "boolean",
        "description": "This flags the exchange instrument as in ready to consume OB_L2_UPDATE_SPOT via a streaming integration.",
        "default": false,
        "example": false,
        "x-cc-api-group": "SOURCE"
      },
      "TOTAL_OB_L2_UPDATES_SPOT": {
        "type": "number",
        "description": "This is both the CCSEQ and the total OB_L2_UPDATES_SPOT we have processed on this instrument",
        "x-cc-api-group": "INTERNAL"
      },
      "LAST_CONCURRENT_BATCH_OF_OB_L2_UPDATES_SPOT_MS": {
        "type": "number",
        "description": "The timestamp last encountered where the batch of trades from OB_L2_UPDATES_SPOT all occured at the same time. This is an issue when making the next request that requires polling by timestamp as a start/from parameter",
        "x-cc-api-group": "INTERNAL"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_FROM_POLLING_REST_URI_LAST_RESPONSE_TS": {
        "type": "number",
        "description": "The last time we received a request from the proxy swarm with OB_L2_UPDATE_SPOT for this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_FROM_POLLING_REST_URI_LAST_REQUEST_TS": {
        "type": "number",
        "description": "The last time we sent a request to the proxy swarm to get OB_L2_UPDATE_SPOT for the instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_FROM_POLLING_REST_URI_NEXT_REQUEST_TS": {
        "type": "number",
        "description": "The next time we expect to make a request for OB_L2_UPDATE_SPOT on this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_FROM_POLLING_LAST_PROXIED_REST_REQUEST": {
        "type": "object",
        "description": "The last proxied REST request we sent to the proxy swarm to get OB_L2_UPDATE_SPOT for the instrument.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_POLLING": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_POLLING": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_POLLING_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_POLLING_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_UPDATE_SPOT_FROM_POLLING_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_UPDATE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_STREAMING": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_STREAMING": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_STREAMING_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_STREAMING_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_UPDATE_SPOT_FROM_STREAMING_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_UPDATE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_GO": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_GO": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_GO_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_GO_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_UPDATE_SPOT_FROM_GO_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_UPDATE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_BLOB": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_BLOB": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_BLOB_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_BLOB_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_UPDATE_SPOT_FROM_BLOB_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_UPDATE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_CALCULATED": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_CALCULATED": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_CALCULATED_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_CALCULATED_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_UPDATE_SPOT_FROM_CALCULATED_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_UPDATE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_FROM_BACKFILL_REST_URI_LAST_RESPONSE_TS": {
        "type": "number",
        "description": "The last time we received a request from the proxy swarm with OB_L2_UPDATE_SPOT for this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_FROM_BACKFILL_REST_URI_LAST_REQUEST_TS": {
        "type": "number",
        "description": "The last time we sent a request to the proxy swarm to get OB_L2_UPDATE_SPOT for the instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_FROM_BACKFILL_REST_URI_NEXT_REQUEST_TS": {
        "type": "number",
        "description": "The next time we expect to make a request for OB_L2_UPDATE_SPOT on this instrument.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_OB_L2_UPDATE_SPOT_FROM_BACKFILL_LAST_PROXIED_REST_REQUEST": {
        "type": "object",
        "description": "The last proxied REST request we sent to the proxy swarm to get OB_L2_UPDATE_SPOT for the instrument.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_BACKFILL": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_BACKFILL": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_BACKFILL_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_BACKFILL_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_UPDATE_SPOT_FROM_BACKFILL_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_UPDATE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_FIX": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_FIX": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_FIX_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_FIX_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_UPDATE_SPOT_FROM_FIX_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_UPDATE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_EOD": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_EOD": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific source type in internal format.",
        "properties": {
          "TYPE": {
            "type": "string"
          },
          "MARKET": {
            "type": "string"
          },
          "SEQ": {
            "type": "number"
          },
          "SEQ_END": {
            "type": "number"
          },
          "INSTRUMENT": {
            "type": "string"
          },
          "BASE": {
            "type": "string"
          },
          "QUOTE": {
            "type": "string"
          },
          "EXCHANGE_NS": {
            "type": "number"
          },
          "RECEIVED_NS": {
            "type": "number"
          },
          "BIDS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "ASKS": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "UNAGGREGATED": {
            "type": "boolean"
          }
        },
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_OB_L2_UPDATE_SPOT_FROM_EOD_EXTERNAL": {
        "type": "object",
        "description": "This is the first OB_L2_UPDATE_SPOT that we have seen on the specific source type in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "LAST_OB_L2_UPDATE_SPOT_FROM_EOD_EXTERNAL": {
        "type": "object",
        "description": "This is the last OB_L2_UPDATE_SPOT that we have seen on the specific trade source in external format.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "UNSTRUCTURED_OB_L2_UPDATE_SPOT_FROM_EOD_INTERNAL_DATA": {
        "type": "object",
        "description": "This is any extra helper OB_L2_UPDATE_SPOT data that we would need for creating polling requests or subscribing with non standard information and anything that is very specific to one exchange API/Integration and it does not fit any of the other existing fields and is definitly only updated or written in only one service.",
        "properties": {},
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_SOURCE_POLLING": {
        "type": "string",
        "description": "Where do we get the instrument id / INSTRUMENT_{messageName}_REST_URI / INSTRUMENT_{messageName}_STREAMING_SUBSCRIPTION etc from.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_SOURCE_STREAMING": {
        "type": "string",
        "description": "Where do we get the instrument id / INSTRUMENT_{messageName}_REST_URI / INSTRUMENT_{messageName}_STREAMING_SUBSCRIPTION etc from.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_SOURCE_GO": {
        "type": "string",
        "description": "Where do we get the instrument id / INSTRUMENT_{messageName}_REST_URI / INSTRUMENT_{messageName}_STREAMING_SUBSCRIPTION etc from.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_SOURCE_BLOB": {
        "type": "string",
        "description": "Where do we get the instrument id / INSTRUMENT_{messageName}_REST_URI / INSTRUMENT_{messageName}_STREAMING_SUBSCRIPTION etc from.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_SOURCE_CALCULATED": {
        "type": "string",
        "description": "Where do we get the instrument id / INSTRUMENT_{messageName}_REST_URI / INSTRUMENT_{messageName}_STREAMING_SUBSCRIPTION etc from.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_SOURCE_BACKFILL": {
        "type": "string",
        "description": "Where do we get the instrument id / INSTRUMENT_{messageName}_REST_URI / INSTRUMENT_{messageName}_STREAMING_SUBSCRIPTION etc from.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_SOURCE_FIX": {
        "type": "string",
        "description": "Where do we get the instrument id / INSTRUMENT_{messageName}_REST_URI / INSTRUMENT_{messageName}_STREAMING_SUBSCRIPTION etc from.",
        "x-cc-api-group": "SOURCE"
      },
      "INSTRUMENT_SOURCE_EOD": {
        "type": "string",
        "description": "Where do we get the instrument id / INSTRUMENT_{messageName}_REST_URI / INSTRUMENT_{messageName}_STREAMING_SUBSCRIPTION etc from.",
        "x-cc-api-group": "SOURCE"
      },
      "FIRST_SEEN_ON_POLLING_TS": {
        "type": "number",
        "description": "This is the first time instrument was seen on instrumentListSourceType POLLING.",
        "x-cc-api-group": "STATUS"
      },
      "LAST_SEEN_ON_POLLING_TS": {
        "type": "number",
        "description": "This is the last time instrument was seen on instrumentListSourceType POLLING.",
        "x-cc-api-group": "STATUS"
      },
      "FIRST_SEEN_ON_STREAMING_TS": {
        "type": "number",
        "description": "This is the first time instrument was seen on instrumentListSourceType STREAMING.",
        "x-cc-api-group": "STATUS"
      },
      "LAST_SEEN_ON_STREAMING_TS": {
        "type": "number",
        "description": "This is the last time instrument was seen on instrumentListSourceType STREAMING.",
        "x-cc-api-group": "STATUS"
      },
      "FIRST_SEEN_ON_NSQ_TS": {
        "type": "number",
        "description": "This is the first time instrument was seen on instrumentListSourceType NSQ.",
        "x-cc-api-group": "STATUS"
      },
      "LAST_SEEN_ON_NSQ_TS": {
        "type": "number",
        "description": "This is the last time instrument was seen on instrumentListSourceType NSQ.",
        "x-cc-api-group": "STATUS"
      },
      "FIRST_SEEN_ON_BLOB_TS": {
        "type": "number",
        "description": "This is the first time instrument was seen on instrumentListSourceType BLOB.",
        "x-cc-api-group": "STATUS"
      },
      "LAST_SEEN_ON_BLOB_TS": {
        "type": "number",
        "description": "This is the last time instrument was seen on instrumentListSourceType BLOB.",
        "x-cc-api-group": "STATUS"
      },
      "FIRST_SEEN_ON_HARDCODED_TS": {
        "type": "number",
        "description": "This is the first time instrument was seen on instrumentListSourceType HARDCODED.",
        "x-cc-api-group": "STATUS"
      },
      "LAST_SEEN_ON_HARDCODED_TS": {
        "type": "number",
        "description": "This is the last time instrument was seen on instrumentListSourceType HARDCODED.",
        "x-cc-api-group": "STATUS"
      },
      "FIRST_SEEN_ON_INDEX_COMPOSITION_TS": {
        "type": "number",
        "description": "This is the first time instrument was seen on instrumentListSourceType INDEX_COMPOSITION.",
        "x-cc-api-group": "STATUS"
      },
      "LAST_SEEN_ON_INDEX_COMPOSITION_TS": {
        "type": "number",
        "description": "This is the last time instrument was seen on instrumentListSourceType INDEX_COMPOSITION.",
        "x-cc-api-group": "STATUS"
      },
      "FIRST_SEEN_ON_FIX_TS": {
        "type": "number",
        "description": "This is the first time instrument was seen on instrumentListSourceType FIX.",
        "x-cc-api-group": "STATUS"
      },
      "LAST_SEEN_ON_FIX_TS": {
        "type": "number",
        "description": "This is the last time instrument was seen on instrumentListSourceType FIX.",
        "x-cc-api-group": "STATUS"
      },
      "FIRST_SEEN_ON_BACKFILL_TS": {
        "type": "number",
        "description": "This is the first time instrument was seen on instrumentListSourceType BACKFILL.",
        "x-cc-api-group": "STATUS"
      },
      "LAST_SEEN_ON_BACKFILL_TS": {
        "type": "number",
        "description": "This is the last time instrument was seen on instrumentListSourceType BACKFILL.",
        "x-cc-api-group": "STATUS"
      },
      "FIRST_SEEN_ON_EOD_CONFIG_TS": {
        "type": "number",
        "description": "This is the first time instrument was seen on instrumentListSourceType EOD_CONFIG.",
        "x-cc-api-group": "STATUS"
      },
      "LAST_SEEN_ON_EOD_CONFIG_TS": {
        "type": "number",
        "description": "This is the last time instrument was seen on instrumentListSourceType EOD_CONFIG.",
        "x-cc-api-group": "STATUS"
      }
    }
  },
  "Err": {
    "type": "object",
    "description": "This object provides detailed information about an error encountered while processing the request. It includes an error code, a message explaining the error, and additional context about the parameters or values that caused the issue. This helps clients identify and resolve issues with their requests.",
    "properties": {
      "type": {
        "type": "integer",
        "description": "A public facing error type. If you want to treat a specific error use the type.",
        "format": "int32",
        "example": 1
      },
      "message": {
        "type": "string",
        "description": "A message describing the error",
        "example": "Not found: market parameter. Value test_market_does_not_exist not integrated yet. We list all markets in lowercase and transform the parameter sent, make sure you check the https://data-api.cryptocompare.com/spot/v1/markets endpoint for a list of all the supported TRADE_SPOT markets"
      },
      "other_info": {
        "type": "object",
        "properties": {
          "param": {
            "type": "string",
            "description": "The parameter that is responsible for the error",
            "example": "market"
          },
          "values": {
            "type": "array",
            "description": "The values responsible for the error",
            "example": ["test_market_does_not_exist"],
            "items": {
              "type": "string"
            }
          }
        }
      }
    }
  }
}
```

### Markets

This endpoint provides comprehensive information about various cryptocurrency spot markets. By specifying a market through the "market" parameter, users can retrieve details about a specific market, such as its trading pairs, volume, operational status, and other relevant metadata. If no specific market is indicated, the endpoint delivers data on all available markets. This functionality is essential for users looking to explore and compare the characteristics and trading conditions of different cryptocurrency exchanges or market segments, assisting in market analysis, strategic planning, and decision-making.

#### Use Cases
- Market Comparison: Enables investors and analysts to compare and contrast various cryptocurrency markets, helping them to identify the most active or most suitable markets for their trading strategies.
- Strategic Planning: Businesses and entrepreneurs can use detailed market data to plan entry into specific cryptocurrency markets or adjust their offerings based on the characteristics of each market.
- Educational Resource: Provides a valuable tool for educators and students studying the cryptocurrency ecosystem, offering a broad overview of available markets and their features.
- API Integration: Developers can integrate this endpoint into applications that require dynamic information about cryptocurrency markets, enhancing the utility and information richness of such applications.

#### Target Audience
- Cryptocurrency Traders and Investment Analysts looking for detailed insights into various markets for better trading decisions.
- Financial Institutions and Consultancy Firms that need a comprehensive understanding of the cryptocurrency market landscape to advise clients or plan business strategies.
- Academic Researchers studying the cryptocurrency market's structure, behavior, and evolution.
- Fintech Developers building applications that require up-to-date information on multiple cryptocurrency markets.

---

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v1_markets

2. restapi:

```js
const baseUrl = 'https://data-api.cryptocompare.com/spot/v1/markets';
const params = {"market":"kraken","api_key":"3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe"};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
    method: 'GET',
    headers:  {"Content-type":"application/json; charset=UTF-8"},
};

fetch(url, options)
    .then((response) => response.json())
    .then((json) => console.log(json))
    .catch((err) => console.log(err));
```

3. response schema:

```json
{
    "Data": {
        "type": "object",
        "properties": {
            "TYPE": {
                "type": "string",
                "description": "Type of the message.",
                "example": "602"
            },
            "EXCHANGE_STATUS": {
                "type": "string",
                "description": "The status of the echange. We only poll / stream / connect to the ACTIVE ones, for the RETIRED ones we no longer query for data",
                "default": "ACTIVE",
                "example": "ACTIVE"
            },
            "MAPPED_INSTRUMENTS_TOTAL": {
                "type": "integer",
                "description": "The total number of instruments that have been verified by our mapping team and have been properly assigned with a base, quote, mapping function, and other necessary fields. This is done to ensure that pairs like XXBTZUSD are accurately mapped to BTC-USD and that the pair refers to the correct assets rather than using the same asset id to represent different assets.",
                "example": 1337
            },
            "UNMAPPED_INSTRUMENTS_TOTAL": {
                "type": "integer",
                "description": "The number of instruments that have not yet been verified by our mapping team.",
                "example": 42
            },
            "INSTRUMENT_STATUS": {
                "type": "object",
                "description": "An object with the total number of instrument for each of the available instrument statuses.",
                "properties": {
                    "ACTIVE": {
                        "type": "integer",
                        "description": "The total number of instruments currently available on the market, which are considered active. An active instrument is defined as an instrument from which we retrieve data and have either already mapped or are planning to map.",
                        "example": 1353
                    },
                    "IGNORED": {
                        "type": "integer",
                        "description": "The total number of instruments available on the market that are classified as ignored, meaning that we do not plan to map them. Ignored instruments are those from which we do retrieve data but do not have any intention to map.",
                        "example": 0
                    },
                    "RETIRED": {
                        "type": "integer",
                        "description": "The total number of instruments that are classified as retired, meaning that they are no longer actively traded on the market. These instruments have ceased trading, and as such, we do not retrieve data from them but we have mapped them already.",
                        "example": 25
                    },
                    "EXPIRED": {
                        "type": "integer",
                        "description": "The total number of instruments that are classified as expired, meaning that they are mapped instruments that are no longer actively traded on the market. These expired instruments are typically futures or options instruments that have reached their expiration date and are no longer available for trading. While we have previously mapped these instruments, we do not retrieve any data from them since they are no longer actively traded.",
                        "example": 1
                    }
                }
            },
            "TOTAL_TRADES_SPOT": {
                "type": "integer",
                "description": "The total number of spot trades that this exchange has processed.",
                "example": 852577
            },
            "HAS_ORDERBOOK_L2_MINUTE_SNAPSHOTS_ENABLED": {
                "type": "boolean",
                "description": "Boolean field denoting if we have historical minute orderbook snapshots endabled for this exchange.",
                "example": true
            }
        }
    },
    "Err": {
        "type": "object",
        "properties": {}
    }
}
```

### Markets + instruments

#### mapped

This endpoint retrieves a comprehensive dictionary of mapped instruments across one or more spot markets, filtered by a specified state or status. Each entry in the dictionary uses the instrument ID—standardized by the mapping team—as the key, ensuring consistency and ease of reference. This endpoint is particularly valuable for users needing precise and standardized information on trading instruments, facilitating the tracking, comparison, and analysis of different instruments within and across various spot markets. It is ideal for applications that depend on uniform identifiers to integrate and interpret market data effectively.

##### Use Cases
- Data Integration: Enables financial platforms and analytical tools to integrate and standardize market data from various sources, using mapped instrument IDs for consistent data handling and display.
- Market Analysis: Traders and analysts can use this data to compare instruments across markets, understanding similarities and differences in trading conditions or market responses.
- Regulatory Compliance: Helps compliance officers ensure that trading activities involving specific instruments adhere to regulatory standards across different markets.
- Portfolio Management: Investment managers can utilize standardized instrument identifiers to manage portfolios more efficiently, ensuring accurate tracking and reporting of assets distributed across multiple markets.

##### Target Audience
- Fintech Developers and Data Scientists who require standardized instrument identifiers to enhance data accuracy and utility in their applications.
- Financial Analysts and Portfolio Managers who need detailed, standardized information on instruments for market analysis and portfolio management.
- Regulatory and Compliance Professionals looking for a reliable reference to monitor and report on trading activities accurately.
- Market Researchers analyzing market structure and instrument behavior across various trading platforms.

---

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v1_markets_instruments

2. restapi:

```js
const baseUrl = 'https://data-api.cryptocompare.com/spot/v1/markets/instruments';
const params = {"market":"kraken","instruments":"BTC-USD,ETH-USD","instrument_status":"ACTIVE","api_key":"3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe"};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
    method: 'GET',
    headers:  {"Content-type":"application/json; charset=UTF-8"},
};

fetch(url, options)
    .then((response) => response.json())
    .then((json) => console.log(json))
    .catch((err) => console.log(err));
```

3. response schema:

```json
{
    "Data": {
        "type": "object",
        "properties": {
            "TYPE": {
                "type": "string",
                "description": "Type of the message.",
                "example": "602"
            },
            "EXCHANGE_STATUS": {
                "type": "string",
                "description": "The status of the echange. We only poll / stream / connect to the ACTIVE ones, for the RETIRED ones we no longer query for data",
                "default": "ACTIVE",
                "example": "ACTIVE"
            },
            "MAPPED_INSTRUMENTS_TOTAL": {
                "type": "integer",
                "description": "The total number of instruments that have been verified by our mapping team and have been properly assigned with a base, quote, mapping function, and other necessary fields. This is done to ensure that pairs like XXBTZUSD are accurately mapped to BTC-USD and that the pair refers to the correct assets rather than using the same asset id to represent different assets.",
                "example": 1337
            },
            "UNMAPPED_INSTRUMENTS_TOTAL": {
                "type": "integer",
                "description": "The number of instruments that have not yet been verified by our mapping team.",
                "example": 42
            },
            "INSTRUMENT_STATUS": {
                "type": "object",
                "description": "An object with the total number of instrument for each of the available instrument statuses.",
                "properties": {
                    "ACTIVE": {
                        "type": "integer",
                        "description": "The total number of instruments currently available on the market, which are considered active. An active instrument is defined as an instrument from which we retrieve data and have either already mapped or are planning to map.",
                        "example": 1353
                    },
                    "IGNORED": {
                        "type": "integer",
                        "description": "The total number of instruments available on the market that are classified as ignored, meaning that we do not plan to map them. Ignored instruments are those from which we do retrieve data but do not have any intention to map.",
                        "example": 0
                    },
                    "RETIRED": {
                        "type": "integer",
                        "description": "The total number of instruments that are classified as retired, meaning that they are no longer actively traded on the market. These instruments have ceased trading, and as such, we do not retrieve data from them but we have mapped them already.",
                        "example": 25
                    },
                    "EXPIRED": {
                        "type": "integer",
                        "description": "The total number of instruments that are classified as expired, meaning that they are mapped instruments that are no longer actively traded on the market. These expired instruments are typically futures or options instruments that have reached their expiration date and are no longer available for trading. While we have previously mapped these instruments, we do not retrieve any data from them since they are no longer actively traded.",
                        "example": 1
                    }
                }
            },
            "TOTAL_TRADES_SPOT": {
                "type": "integer",
                "description": "The total number of spot trades that this exchange has processed.",
                "example": 852577
            },
            "HAS_ORDERBOOK_L2_MINUTE_SNAPSHOTS_ENABLED": {
                "type": "boolean",
                "description": "Boolean field denoting if we have historical minute orderbook snapshots endabled for this exchange.",
                "example": true
            },
            "instruments": {
                "type": "object",
                "description": "The list of instruments requested. It could be a selected few or all for each market.",
                "properties": {
                    "BTC-USD": {
                        "type": "object",
                        "description": "All the relevant data for the particular mapped or unmapped instrument id.",
                        "properties": {
                            "TYPE": {
                                "type": "string",
                                "description": "Type of the message.",
                                "example": "612"
                            },
                            "INSTRUMENT_STATUS": {
                                "type": "string",
                                "description": "Status of the current instrument",
                                "example": "ACTIVE"
                            },
                            "INSTRUMENT": {
                                "type": "string",
                                "description": "The internal exchange defined instrument id.",
                                "example": "BTCUSDT"
                            },
                            "HISTO_SHARD": {
                                "type": "string",
                                "description": "Our internal shard for historical OHLCV+ (minute/hour/day) market data. Minute data is only held in the historical database for up to 3 weeks and we ship it to blob storage afterwards. The API utilizes multiple replicas of a single shard in a round-robin manner.",
                                "example": "PG_COLLECT_01"
                            },
                            "INSTRUMENT_MAPPING": {
                                "type": "object",
                                "description": "The current mapping information for this instrument.",
                                "properties": {
                                    "MAPPED_INSTRUMENT": {
                                        "type": "string",
                                        "description": "The current mapping dsv for this instrument.",
                                        "example": "BTC-USD"
                                    },
                                    "BASE": {
                                        "type": "string",
                                        "description": "The current mapping information for this instrument.",
                                        "example": "BTC"
                                    },
                                    "QUOTE": {
                                        "type": "string",
                                        "description": "The current mapping vs for this instrument.",
                                        "example": "USD"
                                    },
                                    "BASE_ID": {
                                        "type": "string",
                                        "description": "Represents the internal CCData ID for the base asset or coin (e.g., 1 for BTC). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
                                        "example": "BTC"
                                    },
                                    "QUOTE_ID": {
                                        "type": "string",
                                        "description": "Represents the internal CCData ID for the quote asset or counter coin (e.g., 5 for USD). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
                                        "example": "USD"
                                    },
                                    "TRANSFORM_FUNCTION": {
                                        "type": "string",
                                        "description": "The current mapping vsscds for this instrument.",
                                        "example": "INVERT"
                                    },
                                    "CREATED_ON": {
                                        "type": "number",
                                        "description": "Timestamp for when this mapping was created.",
                                        "example": 1433121597
                                    }
                                }
                            },
                            "MAPPED_INSTRUMENT": {
                                "type": "string",
                                "description": "The ccdata mapped instrument ID.",
                                "example": "BTC-USDT"
                            },
                            "HAS_TRADES_SPOT": {
                                "type": "boolean",
                                "description": "A boolean field indicating whether the instrument has spot trades or not. ",
                                "example": true
                            },
                            "FIRST_TRADE_SPOT_TIMESTAMP": {
                                "type": "number",
                                "description": "The first spot defi trade timestamp.",
                                "example": 1677283205
                            },
                            "LAST_TRADE_SPOT_TIMESTAMP": {
                                "type": "number",
                                "description": "The last spot defi trade timestamp.",
                                "example": 1677283205
                            },
                            "TOTAL_TRADES_SPOT": {
                                "type": "number",
                                "description": "The total number of spot trades that this exchange has processed.",
                                "example": 852577
                            }
                        }
                    }
                }
            }
        }
    },
    "Err": {
        "type": "object",
        "properties": {}
    }
}
```

#### unmapped

This endpoint provides a list of instruments across one or more markets, catalogued by their current state or status, using the instrument IDs as defined by the individual markets. This list includes both instruments that have been mapped by CCData.io and those yet to be standardized. The endpoint is essential for users who require a broad and unfiltered view of market instruments, including preliminary data on newly introduced or less common instruments. This functionality is particularly useful for tracking market developments and ensuring comprehensive market coverage in data analysis and trading strategies.

#### Use Cases
- Market Surveillance: Helps in monitoring a wide array of instruments, including newly listed or exotic ones not yet mapped, for signs of emerging trends or unusual activities.
- Data Enrichment: Provides raw, unstandardized data that can be useful for data science projects that aim to cleanse, standardize, and integrate diverse datasets.
- Regulatory Oversight: Regulatory bodies can use this detailed, inclusive dataset to ensure that all market activities, including those involving unmapped instruments, comply with trading regulations.
- Strategic Market Analysis: Analysts and traders can analyze instruments across various markets to identify trading opportunities and risks in lesser-known or emerging instruments.

##### Target Audience
- Data Analysts and Market Researchers who need access to a comprehensive range of instruments for complete market analysis.
- Regulatory Authorities and Compliance Officers requiring extensive listings of market instruments for oversight and enforcement purposes.
- Financial Technology Developers creating tools and platforms that require integration of a wide range of market data, including preliminary or unmapped instruments.
- Investment Strategists and Portfolio Managers looking for opportunities or performing due diligence in less conventional market segments.

---

1. reference: https://developers.cryptocompare.com/documentation/data-api/spot_v1_markets_instruments_unmapped

2. restapi:

```json
const baseUrl = 'https://data-api.cryptocompare.com/spot/v1/markets/instruments/unmapped';
const params = {"market":"kraken","instruments":"XXBTZUSD,XETHZUSD","instrument_status":"ACTIVE","api_key":"3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe"};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
    method: 'GET',
    headers:  {"Content-type":"application/json; charset=UTF-8"},
};

fetch(url, options)
    .then((response) => response.json())
    .then((json) => console.log(json))
    .catch((err) => console.log(err));
```

3. response schema:

```json
{
    "Data": {
        "type": "object",
        "properties": {
            "TYPE": {
                "type": "string",
                "description": "Type of the message.",
                "example": "602"
            },
            "EXCHANGE_STATUS": {
                "type": "string",
                "description": "The status of the echange. We only poll / stream / connect to the ACTIVE ones, for the RETIRED ones we no longer query for data",
                "default": "ACTIVE",
                "example": "ACTIVE"
            },
            "MAPPED_INSTRUMENTS_TOTAL": {
                "type": "integer",
                "description": "The total number of instruments that have been verified by our mapping team and have been properly assigned with a base, quote, mapping function, and other necessary fields. This is done to ensure that pairs like XXBTZUSD are accurately mapped to BTC-USD and that the pair refers to the correct assets rather than using the same asset id to represent different assets.",
                "example": 1337
            },
            "UNMAPPED_INSTRUMENTS_TOTAL": {
                "type": "integer",
                "description": "The number of instruments that have not yet been verified by our mapping team.",
                "example": 42
            },
            "INSTRUMENT_STATUS": {
                "type": "object",
                "description": "An object with the total number of instrument for each of the available instrument statuses.",
                "properties": {
                    "ACTIVE": {
                        "type": "integer",
                        "description": "The total number of instruments currently available on the market, which are considered active. An active instrument is defined as an instrument from which we retrieve data and have either already mapped or are planning to map.",
                        "example": 1353
                    },
                    "IGNORED": {
                        "type": "integer",
                        "description": "The total number of instruments available on the market that are classified as ignored, meaning that we do not plan to map them. Ignored instruments are those from which we do retrieve data but do not have any intention to map.",
                        "example": 0
                    },
                    "RETIRED": {
                        "type": "integer",
                        "description": "The total number of instruments that are classified as retired, meaning that they are no longer actively traded on the market. These instruments have ceased trading, and as such, we do not retrieve data from them but we have mapped them already.",
                        "example": 25
                    },
                    "EXPIRED": {
                        "type": "integer",
                        "description": "The total number of instruments that are classified as expired, meaning that they are mapped instruments that are no longer actively traded on the market. These expired instruments are typically futures or options instruments that have reached their expiration date and are no longer available for trading. While we have previously mapped these instruments, we do not retrieve any data from them since they are no longer actively traded.",
                        "example": 1
                    }
                }
            },
            "TOTAL_TRADES_SPOT": {
                "type": "integer",
                "description": "The total number of spot trades that this exchange has processed.",
                "example": 852577
            },
            "HAS_ORDERBOOK_L2_MINUTE_SNAPSHOTS_ENABLED": {
                "type": "boolean",
                "description": "Boolean field denoting if we have historical minute orderbook snapshots endabled for this exchange.",
                "example": true
            },
            "instruments": {
                "type": "object",
                "description": "The list of instruments requested. It could be a selected few or all for each market.",
                "properties": {
                    "BTC-USD": {
                        "type": "object",
                        "description": "All the relevant data for the particular mapped or unmapped instrument id.",
                        "properties": {
                            "TYPE": {
                                "type": "string",
                                "description": "Type of the message.",
                                "example": "612"
                            },
                            "INSTRUMENT_STATUS": {
                                "type": "string",
                                "description": "Status of the current instrument",
                                "example": "ACTIVE"
                            },
                            "INSTRUMENT": {
                                "type": "string",
                                "description": "The internal exchange defined instrument id.",
                                "example": "BTCUSDT"
                            },
                            "HISTO_SHARD": {
                                "type": "string",
                                "description": "Our internal shard for historical OHLCV+ (minute/hour/day) market data. Minute data is only held in the historical database for up to 3 weeks and we ship it to blob storage afterwards. The API utilizes multiple replicas of a single shard in a round-robin manner.",
                                "example": "PG_COLLECT_01"
                            },
                            "INSTRUMENT_MAPPING": {
                                "type": "object",
                                "description": "The current mapping information for this instrument.",
                                "properties": {
                                    "MAPPED_INSTRUMENT": {
                                        "type": "string",
                                        "description": "The current mapping dsv for this instrument.",
                                        "example": "BTC-USD"
                                    },
                                    "BASE": {
                                        "type": "string",
                                        "description": "The current mapping information for this instrument.",
                                        "example": "BTC"
                                    },
                                    "QUOTE": {
                                        "type": "string",
                                        "description": "The current mapping vs for this instrument.",
                                        "example": "USD"
                                    },
                                    "BASE_ID": {
                                        "type": "string",
                                        "description": "Represents the internal CCData ID for the base asset or coin (e.g., 1 for BTC). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
                                        "example": "BTC"
                                    },
                                    "QUOTE_ID": {
                                        "type": "string",
                                        "description": "Represents the internal CCData ID for the quote asset or counter coin (e.g., 5 for USD). This ID is unique and immutable, ensuring consistent identification. Applicable only to instruments with a mapping.",
                                        "example": "USD"
                                    },
                                    "TRANSFORM_FUNCTION": {
                                        "type": "string",
                                        "description": "The current mapping vsscds for this instrument.",
                                        "example": "INVERT"
                                    },
                                    "CREATED_ON": {
                                        "type": "number",
                                        "description": "Timestamp for when this mapping was created.",
                                        "example": 1433121597
                                    }
                                }
                            },
                            "MAPPED_INSTRUMENT": {
                                "type": "string",
                                "description": "The ccdata mapped instrument ID.",
                                "example": "BTC-USDT"
                            },
                            "HAS_TRADES_SPOT": {
                                "type": "boolean",
                                "description": "A boolean field indicating whether the instrument has spot trades or not. ",
                                "example": true
                            },
                            "FIRST_TRADE_SPOT_TIMESTAMP": {
                                "type": "number",
                                "description": "The first spot defi trade timestamp.",
                                "example": 1677283205
                            },
                            "LAST_TRADE_SPOT_TIMESTAMP": {
                                "type": "number",
                                "description": "The last spot defi trade timestamp.",
                                "example": 1677283205
                            },
                            "TOTAL_TRADES_SPOT": {
                                "type": "number",
                                "description": "The total number of spot trades that this exchange has processed.",
                                "example": 852577
                            }
                        }
                    }
                }
            }
        }
    },
    "Err": {
        "type": "object",
        "properties": {}
    }
}
```