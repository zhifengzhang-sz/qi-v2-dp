### Trade

Subscribe to trades by specifying the market / exchange, base and quote currency in the following format:

> `0~{exchange}~{base}~{quote}`

Upon request, high tier Enterprise clients are able to receive all trades across all markets, but also all trades on a desired market / exchange with just one subscription. To use this feature, just replace _ with any part of the message you want populated by us. For example 0~_~BTC~USD would give all trade snapshots and updates for BTC/USD across all markets BTC/USD trades as a pair.

> `0~*~*~*` (all trade snapshots and updates across all markets / exchanges)
> `0~{exchange}~*~*` (all trade snapshots and updates across one market / exchange)
> `0~{exchange}~{base}~*` (all trade snapshots and updates across one market / exchange for a specific base symbol)
> `0~*~{base}~{quote}` (all trade snapshots and updates across all markets / exchanges for a specific base - quote pair)

You will always get the latest 20 trades when you subscribe.

---

1. reference: https://developers.cryptocompare.com/documentation/legacy-websockets/Trade

2. websocket:

```js
let apiKey = "{your_api_key}";
const WebSocket = require("ws");
const ccStreamer = new WebSocket(
  "wss://streamer.cryptocompare.com/v2?api_key=" + apiKey
);

ccStreamer.on("open", function open() {
  const subRequest = {
    action: "SubAdd",
    subs: ["0~Coinbase~BTC~USD"],
  };
  ccStreamer.send(JSON.stringify(subRequest));
});

ccStreamer.on("message", function incoming(data) {
  console.log(data);
});
```

3. response schema:

```json
{
TYPE:{
type:"string"
description:"Type of the message, always 0 for trade type messages."
}
M:{
type:"string"
description:"The market / exchange you have requested (name of the market / exchange e.g. Coinbase, Kraken, etc.)"
}
FSYM:{
type:"string"
description:"The mapped from asset (base symbol / coin) you have requested (e.g. BTC, ETH, etc.)"
}
TSYM:{
type:"string"
description:"The mapped to asset (quote/counter symbol/coin) you have requested (e.g. BTC, USD, etc.)"
}
F:{
type:"string"
description:"The flag for the trade as a bitmask: &1 for SELL, &2 for BUY, &4 for UNKNOWN, and &8 for REVERSED (inverted). A flag of 1 would be a SELL, a flag of 9 would be a SELL + the trade was REVERSED (inverted). We reverse trades when we think the dominant pair should be on the right hand side of the trade. Uniswap, for example, has ETH trading into a lot of symbols; we record it as the other symbols trading into ETH and we invert the trade. We only use UNKNOWN when the underlying market/exchange API does not provide a side."
}
ID:{
type:"string"
description:"The trade id as reported by the market/exchange or the timestamp in seconds + 0 - 999 if they do not provide a trade id (for uniqueness under the assumption that there would not be more than 999 trades in the same second for exchanges that do not provide a trade id)."
}
TS:{
type:"timestamp"
description:"The timestamp in seconds as reported by the market/exchange or the received timestamp if the market/exchange does not provide one."
}
Q:{
type:"number"
description:"The from asset (base symbol / coin) volume of the trade (for a BTC-USD trade, how much BTC was traded at the trade price)."
}
P:{
type:"number"
description:"The price in the to asset (quote / counter symbol / coin) of the trade (for a BTC-USD trade, how much was paid for one BTC in USD)."
}
TOTAL:{
type:"number"
description:"The total volume in the to asset (quote / counter symbol / coin) of the trade (it is always Q * P so for a BTC-USD trade, how much USD was paid in total for the volume of BTC traded)."
}
RTS:{
type:"timestamp"
description:"The timestamp in seconds when we received the trade. This varies from a few milliseconds from the trade taking place on the market/exchange to a few seconds depending on the market/exchange API options/rate limits."
}
CCSEQ:{
type:"number"
description:"Our internal sequence number for this trade, unique per market/exchange and trading pair. Should always be increasing by 1 for each new trade we discover, not in chronological order, only available for a subset of markets/exchanges."
}
TSNS:{
type:"number"
description:"The nanosecond part of the reported timestamp, only available for a subset of markets/exchanges."
}
RTSNS:{
type:"number"
description:"The nanosecond part of the received timestamp, only available for a subset of markets/exchanges."
}
}
```

### Ticker

Subscribe to exchange ticker by specifying the exchange, base and quote currency in the following format:

> `2~{exchange}~{base}~{quote}`

You will always receive a full snapshot with all the available fields when you subscribe and get an update with only the fields that changed for every underlying trade / order book update. With a free API keys you will only get a maximum of one update per second.

Upon request, high tier Enterprise clients are able to receive all ticker snapshots and updates across all markets, but also all ticker snapshots and updates on a desired market / exchange with just one subscription. To use this feature, just replace _ with any part of the message you want populated by us. For example 2~_~BTC~USD would give all ticker snapshots and updates for BTC/USD across all markets BTC/USD trades as a pair.

> `2~*~*~*` (all ticker snapshots and updates across all markets / exchanges)
> `2~{exchange}~*~*` (all ticker snapshots and updates across one market / exchange)
> `2~{exchange}~{base}~*` (all ticker snapshots and updates across one market / exchange for a specific base symbol)
> `2~*~{base}~{quote}` (all ticker snapshots and updates across all markets / exchanges for a specific base - quote pair)

---

1. reference: https://developers.cryptocompare.com/documentation/legacy-websockets/Ticker

2. websocket:

```js
let apiKey = "{your_api_key}";
const WebSocket = require("ws");
const ccStreamer = new WebSocket(
  "wss://streamer.cryptocompare.com/v2?api_key=" + apiKey
);

ccStreamer.on("open", function open() {
  const subRequest = {
    action: "SubAdd",
    subs: ["2~Coinbase~BTC~USD"],
  };
  ccStreamer.send(JSON.stringify(subRequest));
});

ccStreamer.on("message", function incoming(data) {
  console.log(data);
});
```

3. response schema

```json
{
TYPE:{
type:"string"
description:"Type of the message, always 2 for market/ticker data and 5 for Aggregate Index (CCCAGG) data."
}
MARKET:{
type:"string"
description:"The market/exchange you have requested (name of the market e.g. Coinbase, Kraken, etc.)"
}
FROMSYMBOL:{
type:"string"
description:"The mapped from asset (base symbol/coin) you have requested (e.g. BTC, ETH, etc.)"
}
TOSYMBOL:{
type:"string"
description:"The mapped to asset (quote/counter symbol/coin) you have requested (e.g. BTC, USD, etc.)"
}
FLAGS:{
type:"number"
description:"The flags for the latest update: UP, DOWN, UNCHANGED, etc. (bitmask order of bits is MEDIANUNCHANGED(100000000000), MEDIANDOWN(10000000000), MEDIANUP(1000000000), ASKUNCHANGED(100000000), ASKDOWN(10000000), ASKUP(1000000), BIDUNCHANGED(100000), BIDDOWN(10000), BIDUP(1000), PRICEUNCHANGED(100), PRICEDOWN(10), PRICEUP(1). You need to compute FLAGS & 1 for PRICEUP... FLAGS & 512(100000000000) for MEDIANUNCHANGED."
}
PRICE:{
type:"number"
description:"The last trade price/index price for the pair on the requested market/exchange/index."
}
BID:{
type:"number"
description:"Latest BID price (not available for all markets/exchanges)."
}
ASK:{
type:"number"
description:"Latest ASK price (not available for all markets/exchanges)."
}
LASTUPDATE:{
type:"timestamp"
description:"The last time this pair was updated, for market/ticker data that is the last trade, for index data that is the last time the index was updated."
}
MEDIAN:{
type:"number"
description:"The mid price of the pair, only available on Aggregate Index (CCCAGG) and other indices is the median price of all the markets/exchanges included (we sort all the constituents by price and pick the middle one for even numbers of constituents or average the middle two for odd numbers)."
}
LASTVOLUME:{
type:"number"
description:"The from asset (base symbol/coin) volume of the last trade on the market/exchange/index."
}
LASTVOLUMETO:{
type:"number"
description:"The to asset (quote/counter symbol/coin) volume of the last trade on the market/exchange/index."
}
LASTTRADEID:{
type:"string"
description:"The ID of the latest trade on market/ticker data messages (2) or the ID of the latest trade that had an impact on the CCCAGG/index (5)."
}
VOLUMEDAY:{
type:"number"
description:"The sum of all the trade volumes in the from asset (base symbol/coin) of the day so far, since 00:00 GMT."
}
VOLUMEDAYTO:{
type:"number"
description:"The sum of all the trade volumes in to asset (quote/counter symbol/coin) of the day so far, since 00:00 GMT."
}
VOLUME24HOUR:{
type:"number"
description:"The sum of all the trade volumes in the to asset (base symbol/coin) of the last 23 hours + current hour, this is a rolling volume (e.g., at 16:41 it is the sum of all the trade volumes between 17:00 the previous day and 16:41 today)."
}
VOLUME24HOURTO:{
type:"number"
description:"The sum of all the trade volumes in to asset (quote/counter symbol/coin) of the last 23 hours + current hour, this is a rolling volume (e.g., at 16:41 it is the sum of all the trade volumes between 17:00 the previous day and 16:41 today)."
}
OPENDAY:{
type:"number"
description:"The open price at 00:00 GMT, this is based on the last trade before 00:00 GMT, it is not based on the first trade of the day. If there were no trades on the previous day then it is based on the last trade available."
}
HIGHDAY:{
type:"number"
description:"The highest price since 00:00 GMT. It is the max value between the highest trade price of the day and the open."
}
LOWDAY:{
type:"number"
description:"The lowest price since 00:00 GMT. It is the min value between the lowest trade price of the day and the open."
}
OPEN24HOUR:{
type:"number"
description:"The price 23 hours + current hour ago, this is a rolling open that changes once an hour (e.g., at 16:41 it is the open price of 17:00 the previous day)."
}
HIGH24HOUR:{
type:"number"
description:"The highest price in the last 23 hours + current hour, this is a rolling high (e.g., at 16:41 it is the highest price between the open at 17:00 the previous day and all the trades seen between 17:00 the previous day and 16:41 today)."
}
LOW24HOUR:{
type:"number"
description:"The lowest price in the last 23 hours + current hour, this is a rolling low (e.g., at 16:41 it is the lowest price between the open at 17:00 the previous day and all the trades seen between 17:00 the previous day and 16:41 today)."
}
LASTMARKET:{
type:"string"
description:"The latest market the pair traded on, only available on CCCAGG messages, and it is used to show the market of the latest trade that was included in the CCCAGG index."
}
VOLUMEHOUR:{
type:"number"
description:"The sum of all the trade volumes in the from asset (base symbol/coin) of the hour so far."
}
VOLUMEHOURTO:{
type:"number"
description:"The sum of all the trade volumes in to asset (quote/counter symbol/coin) of the hour so far."
}
OPENHOUR:{
type:"number"
description:"The open price at the beginning of the hour, based on the last trade before the current hour, not based on the first trade of the hour. If there were no trades in the previous hour, then it is based on the last trade available."
}
HIGHHOUR:{
type:"number"
description:"The highest price since the beginning of the hour. It is the max value between the highest trade price of the hour and the open."
}
LOWHOUR:{
type:"number"
description:"The lowest price since the beginning of the hour. It is the min value between the lowest trade price of the hour and the open."
}
TOPTIERVOLUME24HOUR:{
type:"number"
description:"The sum of all the trade volumes in the from asset (base symbol/coin) of the last 23 hours + current hour across exchanges that we rank as top tier, only available on CCCAGG/index messages."
}
TOPTIERVOLUME24HOURTO:{
type:"number"
description:"The sum of all the trade volumes in to asset (base symbol/coin) of the last 23 hours + current hour across exchanges that we rank as top tier, only available on CCCAGG/index messages."
}
}
```

### OHLC

Subscribe to market / exchange historical data by specifying the exchange, base, quote and period (m, H or D for minute, hour and daily candles respectively):

> `24~{exchange or CCCAGG}~{base}~{quote}~{period}`

Upon request, high tier Enterprise clients are able to receive all updates across all markets, but also all updates on a desired market / exchange or a specific symbol or a specific time period with just one subscription. To use this feature, just replace _ with any part of the message you want populated by us. For example 24~_~BTC~USD~\* would give you minute, hour and day historical streaming for BTC/USD across all markets BTC/USD trades as a pair.

> `24~*~*~*~*` (all historical updates across all markets / exchanges)
> `24~{exchange or CCCAGG}~*~*~*` (all historical updates across one market / exchange)
> `24~{exchange or CCCAGG}~*~*~{period}` (all historical updates across one market / exchange for a specific time period)
> `24~{exchange or CCCAGG}~{base}~*~*` (all historical updates across one market / exchange for a specific base symbol on all periods)

Commercial and Commercial Pro level clients have access to minute, hour and day updates for a desired pair on a market / exchange with just one subscription

> `24~{exchange or CCCAGG}~{base}~{quote}~*`

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
const WebSocket = require("ws");
const ccStreamer = new WebSocket(
  "wss://streamer.cryptocompare.com/v2?api_key=" + apiKey
);

ccStreamer.on("open", function open() {
  const subRequest = {
    action: "SubAdd",
    subs: ["24~CCCAGG~BTC~USD~m"],
  };
  ccStreamer.send(JSON.stringify(subRequest));
});

ccStreamer.on("message", function incoming(data) {
  console.log(data);
});
```

3. response schema

```json
{
TYPE:{
type:"string"
description:"Type of the message, for histo updates this is type 24"
}
MARKET:{
type:"string"
description:"The market you have requested (name of the market e.g. CCCAGG, Coinbase, Kraken, etc.)"
}
FROMSYMBOL:{
type:"string"
description:"The mapped from asset (base symbol / coin) you have requested (e.g. BTC, ETH, etc.)"
}
TOSYMBOL:{
type:"string"
description:"The mapped to asset (quote/counter symbol/coin) you have requested (e.g. BTC, USD, etc.)"
}
TS:{
type:"timestamp"
description:"The timestamp in seconds of the histo period, for minute it would be every minute at the beginning of the minute, for hour it would be the start of the hour, and for daily, it is 00:00 GMT"
}
UNIT:{
type:"string"
description:"The unit of the historical update: m for minute, H for hour, and D for day."
}
ACTION:{
type:"string"
description:"The action for the messages, A for add / this is a new historical period, U for update when we send an update to an older historical period, I for init - when we first load the data or for an empty period (no trades so we just send an empty period, can be treated as an A if you want to store empty periods). You will always get an update (U) message on a time period you already know (you either had an A or an I for it). An add (A) would always represent a period that had trading data and an init (I) would be either a time period in the initial snapshot or the start of a new empty time period."
}
OPEN:{
type:"number"
description:"The open price for the historical period, based on the closest trade before the period start."
}
HIGH:{
type:"number"
description:"The max between the open and the highest trade price in this time period (same as open when there are no trades in the time period)."
}
LOW:{
type:"number"
description:"The min between the open and the lowest trade price in this time period (same as open when there are no trades in the time period)."
}
CLOSE:{
type:"number"
description:"The price of the last trade in this time period (same as open when there are no trades in the time period)."
}
VOLUMEFROM:{
type:"number"
description:"The sum of all the trade volumes in the from asset (base symbol / coin) for the time period (0 when there are no trades in the time period)."
}
VOLUMETO:{
type:"number"
description:"The sum of all the trade volumes in the To asset (quote/counter symbol/coin) for the time period (0 when there are no trades in the time period)."
}
TOTALTRADES:{
type:"number"
description:"The total number of trades seen in this time period (0 when there are no trades in the time period)."
}
FIRSTTS:{
type:"timestamp"
description:"The timestamp in seconds of the first trade in this time period (only available when we have at least one trade in the time period)."
}
LASTTS:{
type:"timestamp"
description:"The timestamp in seconds of the last trade in this time period (only available when we have at least one trade in the time period)."
}
FIRSTPRICE:{
type:"number"
description:"The open based on the first trade in the time period (only available when we have at least one trade in the time period)."
}
MAXPRICE:{
type:"number"
description:"The highest value of the trades in the time period (only available when we have at least one trade in the time period)."
}
MINPRICE:{
type:"number"
description:"The lowest value of the trades in the time period (only available when we have at least one trade in the time period)."
}
LASTPRICE:{
type:"number"
description:"The last trade price in the time period (only available when we have at least one trade in the time period)."
}
}
```
