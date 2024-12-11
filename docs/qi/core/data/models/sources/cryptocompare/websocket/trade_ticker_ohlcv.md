### Trade

Subscribe to trades by specifying the market / exchange, base and quote currency in the following format:

>`0~{exchange}~{base}~{quote}`

Upon request, high tier Enterprise clients are able to receive all trades across all markets, but also all trades on a desired market / exchange with just one subscription. To use this feature, just replace * with any part of the message you want populated by us. For example 0~*~BTC~USD would give all trade snapshots and updates for BTC/USD across all markets BTC/USD trades as a pair.

>`0~*~*~*` (all trade snapshots and updates across all markets / exchanges)
>`0~{exchange}~*~*` (all trade snapshots and updates across one market / exchange)
>`0~{exchange}~{base}~*` (all trade snapshots and updates across one market / exchange for a specific base symbol)
>`0~*~{base}~{quote}` (all trade snapshots and updates across all markets / exchanges for a specific base - quote pair)

You will always get the latest 20 trades when you subscribe.

---

1. reference: https://developers.cryptocompare.com/documentation/legacy-websockets/Trade

2. websocket:

```js
let apiKey = "{your_api_key}";
const WebSocket = require('ws');
const ccStreamer = new WebSocket('wss://streamer.cryptocompare.com/v2?api_key=' + apiKey);

ccStreamer.on('open', function open() {
    const subRequest = {
        "action": "SubAdd",
        "subs": ["0~Coinbase~BTC~USD"]
    };
    ccStreamer.send(JSON.stringify(subRequest));
});

ccStreamer.on('message', function incoming(data) {
    console.log(data);
});
```

3. response schema:

```json
// this is where you paste your api key
let apiKey = "{your_api_key}";
const WebSocket = require('ws');
const ccStreamer = new WebSocket('wss://streamer.cryptocompare.com/v2?api_key=' + apiKey);

ccStreamer.on('open', function open() {
    const subRequest = {
        "action": "SubAdd",
        "subs": ["0~Coinbase~BTC~USD"]
    };
    ccStreamer.send(JSON.stringify(subRequest));
});

ccStreamer.on('message', function incoming(data) {
    console.log(data);
});
```


### Ticker

Subscribe to exchange ticker by specifying the exchange, base and quote currency in the following format:

>`2~{exchange}~{base}~{quote}`

You will always receive a full snapshot with all the available fields when you subscribe and get an update with only the fields that changed for every underlying trade / order book update. With a free API keys you will only get a maximum of one update per second.

Upon request, high tier Enterprise clients are able to receive all ticker snapshots and updates across all markets, but also all ticker snapshots and updates on a desired market / exchange with just one subscription. To use this feature, just replace * with any part of the message you want populated by us. For example 2~*~BTC~USD would give all ticker snapshots and updates for BTC/USD across all markets BTC/USD trades as a pair.

>`2~*~*~*` (all ticker snapshots and updates across all markets / exchanges)
>`2~{exchange}~*~*` (all ticker snapshots and updates across one market / exchange)
>`2~{exchange}~{base}~*` (all ticker snapshots and updates across one market / exchange for a specific base symbol)
>`2~*~{base}~{quote}` (all ticker snapshots and updates across all markets / exchanges for a specific base - quote pair)

---

1. reference: https://developers.cryptocompare.com/documentation/legacy-websockets/Ticker

2. websocket:

```js
let apiKey = "{your_api_key}";
const WebSocket = require('ws');
const ccStreamer = new WebSocket('wss://streamer.cryptocompare.com/v2?api_key=' + apiKey);

ccStreamer.on('open', function open() {
    const subRequest = {
        "action": "SubAdd",
        "subs": ["2~Coinbase~BTC~USD"]
    };
    ccStreamer.send(JSON.stringify(subRequest));
});

ccStreamer.on('message', function incoming(data) {
    console.log(data);
});
```

3. response schema

```json
// this is where you paste your api key
let apiKey = "{your_api_key}";
const WebSocket = require('ws');
const ccStreamer = new WebSocket('wss://streamer.cryptocompare.com/v2?api_key=' + apiKey);

ccStreamer.on('open', function open() {
    const subRequest = {
        "action": "SubAdd",
        "subs": ["2~Coinbase~BTC~USD"]
    };
    ccStreamer.send(JSON.stringify(subRequest));
});

ccStreamer.on('message', function incoming(data) {
    console.log(data);
});
```

### OHLC

Subscribe to market / exchange historical data by specifying the exchange, base, quote and period (m, H or D for minute, hour and daily candles respectively):

>`24~{exchange or CCCAGG}~{base}~{quote}~{period}`

Upon request, high tier Enterprise clients are able to receive all updates across all markets, but also all updates on a desired market / exchange or a specific symbol or a specific time period with just one subscription. To use this feature, just replace * with any part of the message you want populated by us. For example 24~*~BTC~USD~* would give you minute, hour and day historical streaming for BTC/USD across all markets BTC/USD trades as a pair.

>`24~*~*~*~*` (all historical updates across all markets / exchanges)
>`24~{exchange or CCCAGG}~*~*~*` (all historical updates across one market / exchange)
>`24~{exchange or CCCAGG}~*~*~{period}` (all historical updates across one market / exchange for a specific time period)
>`24~{exchange or CCCAGG}~{base}~*~*` (all historical updates across one market / exchange for a specific base symbol on all periods)

Commercial and Commercial Pro level clients have access to minute, hour and day updates for a desired pair on a market / exchange with just one subscription

>`24~{exchange or CCCAGG}~{base}~{quote}~*`

A few things to keep in mind when consuming OHLCV data:

- You will always get an empty point for the latest time period as soon as it starts, after that if there was any trading activity you will get an update with the latest values
- You will get at least 1 message every minute for minute data, at least one message every hour for hourly data and at least one message every day for daily data
- Minute data is updated every 1 minute, hourly and daily data are updated every 5 minutes
- The vast majority of updates (>95%) will occur for the latest 5 periods of minute data, the latest 2 periods of hourly data in the first 10 minutes of the hour and the latest 2 periods of daily data in the first 10 minutes of the day
- Under normal operating conditions you won't get updates to the minute data older than 30 minutes in the past, updates to the hourly data older than 24 hours in the past and daily data older than 7 days
- In extreme circumstances you might get updates for any period in the past at any time, this could be because we are regenerating data for that exchange due to misreporting or we have extra information on trading activity from the exchange
- On a new pair (when the first trade happened in the last 30 minutes for minute data, the last 24 hours for hourly data or the last 7 days for daily data), in the initial snapshot, time slots before the first trade activity will have the OHLC as 0

All premium accounts also receive the latest 30 minutes, 24 hours and 7 days when they subscribe to a pair. Please refer to the Pricing page for further information.

---

1. reference: https://developers.cryptocompare.com/documentation/legacy-websockets/OHLCCandles

2. websocket

```js
let apiKey = "{your_api_key}";
const WebSocket = require('ws');
const ccStreamer = new WebSocket('wss://streamer.cryptocompare.com/v2?api_key=' + apiKey);

ccStreamer.on('open', function open() {
    const subRequest = {
        "action": "SubAdd",
        "subs": ["24~CCCAGG~BTC~USD~m"]
    };
    ccStreamer.send(JSON.stringify(subRequest));
});

ccStreamer.on('message', function incoming(data) {
    console.log(data);
});
```

3. response schema

```json
const apiKey = 3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe;
const ccStreamer = new WebSocket('wss://streamer.cryptocompare.com/v2?api_key=' + 3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe);
ccStreamer.onopen = function onStreamOpen() {
    const subRequest = {
        "action": "SubAdd",
        "subs": ["24~CCCAGG~BTC~USD~m"]
    };
    ccStreamer.send(JSON.stringify(subRequest));
}

ccStreamer.onmessage = function onStreamMessage(message) {
    const message = event.data;
    console.log("Received from Cryptocompare: " + message);
}
```

