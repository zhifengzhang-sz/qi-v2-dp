@import "../table.css"

### Project structure

```
js/
├── common/
│   ├── data_sources/
│   │   ├── restapi/
│   │   │   ├── CryptoCompareClient.ts
│   │   │   └── TwelveDataClient.ts
│   │   ├── websocket/
│   │   │   ├── CryptoCompareWSClient.ts
│   │   │   └── TwelveDataWSClient.ts
│   ├── kafka
│   │   └── publisher/
│   │   │   └── KafkaPublisher.ts\
│   │   └── consumer/
│   │   │   └── KafkaConsumer.ts\
│   ├── databases/
│   │   ├── models/
│   ├── utils/
│   │   ├── cache.ts
│   │   └── logger.ts
```

### data sources

#### restapi

##### cryptocompare

**Response**

<div class="table">
    <div class="table-caption">
      <span class="table-number">Table 1:</span>
      Response
    </div>

| Response                   | Description                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| 200(OK)                    | Success response from the API.                                                                         |
| 400(Bad Request)           | The 400 error occurs when some of the data sent is malformed.                                          |
| 401(Unauthorized)          | The 401 error occurs when you don't use a valid API Key on an endpoint that requires authentication.   |
| 403(Forbidden)             | The 403 error occurs when you don't use a valid API Key on an endpoint that requires authentication.   |
| 404(Not Found)             | The 404 error can either be returned when some/all of parameters sent are not found within our system. This could be beacuse parameters like market, instrument, news source, symbol, asset_id etc. are invalid |
| 405(Method Not Allowed)    | The 405 error occurs the user tries to use a http method (GET,POST,PUT etc) that is not supported.     |
| 429(Too Many Requests)     | The 429 error occurs when you go over the API Key limit. Rate limits are eforced on a second (resets every second), minute (resers every minute), hour (resets every hour), day (resets every day) and month (resets every month) granularity. You can upgrade your account and access higher rate limits. |
| 500(Internal Server Error) | The 500 error occurs our API is up but does not know how to / can't handle the request.                |
| 502(Bad Gateway)           | The 502 error occurs when our API is not running. This error is returned by our proxy / load balancer. |
| 503(Service Unavailable)   | The 503 error occurs when there is an issue with one of our data sources and we can't even return a partial answer. |

</div>

Requests from cryptocompare for the following data items:

1. [**version**](https://developers.cryptocompare.com/documentation/data-api/info_v1_version): This endpoint returns the current API version, allowing clients to track any updates or changes to the API. The version includes three key components: the main version tied to the base URL, which only changes if there’s a URL update (ensuring no breaking changes without a URL change); a format version number that reflects breaking changes, though this rarely changes and would be announced 6 months in advance; and an internal package version that tracks system deployments. Clients can use this information to ensure compatibility with the latest API updates.
   - request parameters: none
   - response schema: see [Version.json](./response_schemas/Version.json)
   - javascript code: see [Version.js](./scripts/Version.js)

2. [**rate limit**](https://developers.cryptocompare.com/documentation/data-api/admin_v2_rate_limit): This endpoint allows clients to check their current rate limit status. Making a call to this endpoint counts against your rate limit. It is recommended to use the X-RateLimit-* headers returned in each response to monitor your rate limits without calling this endpoint directly.
   - request parameters: none
   - response schema: see [RateLimit.json](./response_schemas/RateLimit.json)
   - javascript code: see [RateLimit.js](./scripts/RateLimit.js)

3. [**summary list**](): The Asset Summary List endpoint efficiently retrieves a summarized list of all digital assets, grouped by their respective asset types. It provides essential information for each asset, including the ID, SYMBOL, ASSET_TYPE, NAME, and LOGO_URL. Designed for straightforward and fast access to basic asset details, this endpoint is particularly useful for applications requiring a quick overview of a large number of assets without delving into more complex data.
   - request parameters:
     - asset_type (string): This parameter can be used to filter the returned assets based on their type. Allowed values: `BLOCKCHAIN`,`FIAT`,`TOKEN`,`STOCK`,`INDEX`,`COMMODITY` or it can be left empty to get all types.
        - type: string
     - filters(array): 
        - Allowed values: `HAS_CODE_REPOSITORIES`,`HAS_SUBREDDITS`,`HAS_TWITTER_ACCOUNTS`,`HAS_DISCORD_SERVERS`,`HAS_TELEGRAM_GROUPS`,`HAS_SUPPORTED_PLATFORM`,`IS_SUPPORTING_OTHER_ASSETS`
        - type: array
        - default: []
     - assets (array): Specify a list of digital assets for which you want to retrieve information by providing either its unique `SYMBOL` or the CCData internal asset ID. When using the `SYMBOL`, provide a string that corresponds to the asset's common ticker symbol. When using the internal asset ID, provide an integer or bigint that uniquely identifies the asset within CCData. For assets with numerical `SYMBOLS`, use the `asset_lookup_priority` field to clarify whether the numerical value should be matched as a `SYMBOL` or an `ID`.
       - type: array
       - default: []
       - minItems: 0
       - maxItems: 200
     - asset_lookup_priority (string): This parameter specifies the matching priority for the asset key provided in the asset parameter. You can choose to match against the list of asset SYMBOLS or CCData internal asset IDSs. Note that asset SYMBOLS may change due to rebrands or token switches, but the CCData internal asset `ID` remains consistent.
       - type: string
       - default: `SYMBOL`
   - response schema: see [SummaryList.json](./response_schemas/SummaryList.json)
   - javascript code: see [SummaryList.js]()

- List of markets: see [MarketList.js](./scripts/MarketList.js)

- most active
- ohlcv
- tick data


2. twelvedata: `TwelveDataClient.ts`

#### websocket

### kafka

1. publisher
2. consumer
