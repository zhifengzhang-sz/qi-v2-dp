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
