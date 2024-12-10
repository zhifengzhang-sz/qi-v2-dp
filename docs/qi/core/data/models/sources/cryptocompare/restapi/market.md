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