# crypto data platform use cases

## trading applications

### real-time price monitoring
**timescaledb queries**
```sql
-- current price feeds for trading dashboard
select 
  symbol,
  close as current_price,
  timestamp,
  volume,
  (close - lag(close, 1) over (partition by symbol order by timestamp)) / 
    lag(close, 1) over (partition by symbol order by timestamp) * 100 as change_percent
from ohlcv 
where timestamp > now() - interval '5 minutes'
  and symbol in ('btcusd', 'ethusd', 'adausd')
order by symbol, timestamp desc;

-- price alerts for active trades
select o.symbol, o.close, a.threshold_price, a.alert_type
from ohlcv o
join price_alerts a on o.symbol = a.symbol
where o.timestamp > now() - interval '1 minute'
  and ((a.alert_type = 'above' and o.close > a.threshold_price) or
       (a.alert_type = 'below' and o.close < a.threshold_price));
```

### algorithmic trading signals
**clickhouse analytics**
```sql
-- rsi calculation for trading signals
with price_changes as (
  select 
    symbol,
    timestamp,
    close,
    close - lag(close) over (partition by symbol order by timestamp) as price_change
  from ohlcv
  where symbol = 'btcusd' 
    and timestamp >= now() - interval 30 day
),
rsi_components as (
  select 
    symbol,
    timestamp,
    close,
    avg(case when price_change > 0 then price_change else 0 end) 
      over (partition by symbol order by timestamp rows between 13 preceding and current row) as avg_gain,
    avg(case when price_change < 0 then abs(price_change) else 0 end) 
      over (partition by symbol order by timestamp rows between 13 preceding and current row) as avg_loss
  from price_changes
)
select 
  symbol,
  timestamp,
  close,
  100 - (100 / (1 + (avg_gain / nullif(avg_loss, 0)))) as rsi,
  case 
    when 100 - (100 / (1 + (avg_gain / nullif(avg_loss, 0)))) > 70 then 'overbought'
    when 100 - (100 / (1 + (avg_gain / nullif(avg_loss, 0)))) < 30 then 'oversold'
    else 'neutral'
  end as signal
from rsi_components
where timestamp >= now() - interval 7 day
order by timestamp desc;
```

## portfolio management

### portfolio tracking
**timescaledb operations**
```sql
-- user portfolio current value
select 
  p.user_id,
  p.symbol,
  p.quantity,
  o.close as current_price,
  p.quantity * o.close as current_value,
  p.quantity * p.avg_cost as cost_basis,
  (p.quantity * o.close) - (p.quantity * p.avg_cost) as unrealized_pnl
from user_portfolios p
join lateral (
  select close 
  from ohlcv 
  where symbol = p.symbol 
  order by timestamp desc 
  limit 1
) o on true
where p.user_id = 12345;

-- portfolio performance tracking
insert into portfolio_snapshots (user_id, timestamp, total_value, daily_pnl)
select 
  user_id,
  now(),
  sum(quantity * current_price) as total_value,
  sum(quantity * current_price) - lag(sum(quantity * current_price)) 
    over (partition by user_id order by date(now())) as daily_pnl
from user_portfolio_view
group by user_id;
```

### risk management
**clickhouse analytics**
```sql
-- portfolio risk metrics (var calculation)
with daily_returns as (
  select 
    symbol,
    todate(timestamp) as date,
    (last_value(close) over (partition by symbol, todate(timestamp) order by timestamp) - 
     first_value(close) over (partition by symbol, todate(timestamp) order by timestamp)) /
     first_value(close) over (partition by symbol, todate(timestamp) order by timestamp) as daily_return
  from ohlcv
  where timestamp >= today() - interval 252 day  -- 1 year of trading days
),
portfolio_returns as (
  select 
    date,
    sum(portfolio_weight * daily_return) as portfolio_return
  from daily_returns dr
  join portfolio_weights pw on dr.symbol = pw.symbol
  group by date
)
select 
  percentile(0.05)(portfolio_return) as var_95,
  percentile(0.01)(portfolio_return) as var_99,
  stddev(portfolio_return) as volatility,
  avg(portfolio_return) as avg_return,
  max(portfolio_return) as max_return,
  min(portfolio_return) as min_return
from portfolio_returns;
```

## market analysis

### market microstructure analysis
**clickhouse high-frequency analytics**
```sql
-- orderbook imbalance analysis
with minute_buckets as (
  select 
    symbol,
    tostartoftime(timestamp, interval 1 minute) as minute,
    avg(close) as price,
    sum(volume) as total_volume,
    count(*) as trade_count,
    max(high) - min(low) as price_range
  from ohlcv
  where timestamp >= now() - interval 1 day
    and symbol in ('btcusd', 'ethusd')
  group by symbol, minute
)
select 
  symbol,
  minute,
  price,
  total_volume,
  trade_count,
  price_range,
  total_volume / trade_count as avg_trade_size,
  case 
    when total_volume > avg(total_volume) over (partition by symbol order by minute rows between 10 preceding and current row) * 2 
    then 'high_volume'
    else 'normal'
  end as volume_regime
from minute_buckets
order by symbol, minute desc;
```

### correlation analysis
**clickhouse statistical analysis**
```sql
-- cross-asset correlation matrix
with daily_prices as (
  select 
    symbol,
    todate(timestamp) as date,
    last_value(close) over (partition by symbol, todate(timestamp) order by timestamp) as close_price
  from ohlcv
  where timestamp >= today() - interval 90 day
),
daily_returns as (
  select 
    symbol,
    date,
    (close_price - lag(close_price) over (partition by symbol order by date)) / 
     lag(close_price) over (partition by symbol order by date) as daily_return
  from daily_prices
)
select 
  a.symbol as symbol_a,
  b.symbol as symbol_b,
  corr(a.daily_return, b.daily_return) as correlation,
  count(*) as observations
from daily_returns a
join daily_returns b on a.date = b.date and a.symbol < b.symbol
where a.symbol in ('btcusd', 'ethusd', 'adausd', 'solusd')
  and b.symbol in ('btcusd', 'ethusd', 'adausd', 'solusd')
group by a.symbol, b.symbol
having count(*) >= 60  -- at least 60 days of data
order by correlation desc;
```

## backtesting and research

### strategy backtesting
**clickhouse historical analysis**
```sql
-- simple moving average crossover strategy backtest
with sma_signals as (
  select 
    symbol,
    timestamp,
    close,
    avg(close) over (partition by symbol order by timestamp rows between 19 preceding and current row) as sma_20,
    avg(close) over (partition by symbol order by timestamp rows between 49 preceding and current row) as sma_50,
    lag(avg(close) over (partition by symbol order by timestamp rows between 19 preceding and current row)) 
      over (partition by symbol order by timestamp) as prev_sma_20,
    lag(avg(close) over (partition by symbol order by timestamp rows between 49 preceding and current row)) 
      over (partition by symbol order by timestamp) as prev_sma_50
  from ohlcv
  where symbol = 'btcusd'
    and timestamp >= '2023-01-01'
    and timestamp <= '2024-01-01'
),
trades as (
  select 
    symbol,
    timestamp,
    close,
    case 
      when sma_20 > sma_50 and prev_sma_20 <= prev_sma_50 then 'buy'
      when sma_20 < sma_50 and prev_sma_20 >= prev_sma_50 then 'sell'
      else null
    end as signal
  from sma_signals
  where sma_20 is not null and sma_50 is not null
),
trade_pairs as (
  select 
    buy.timestamp as buy_time,
    buy.close as buy_price,
    sell.timestamp as sell_time,
    sell.close as sell_price,
    (sell.close - buy.close) / buy.close as return_pct,
    date_diff('day', buy.timestamp, sell.timestamp) as holding_days
  from trades buy
  join trades sell on sell.timestamp > buy.timestamp
    and sell.signal = 'sell'
    and buy.signal = 'buy'
    and sell.timestamp = (
      select min(s2.timestamp) 
      from trades s2 
      where s2.signal = 'sell' 
        and s2.timestamp > buy.timestamp
    )
)
select 
  count(*) as total_trades,
  avg(return_pct) * 100 as avg_return_pct,
  stddev(return_pct) * 100 as return_volatility,
  sum(case when return_pct > 0 then 1 else 0 end) / count(*) as win_rate,
  max(return_pct) * 100 as max_return,
  min(return_pct) * 100 as max_loss,
  avg(holding_days) as avg_holding_days,
  (avg(return_pct) / stddev(return_pct)) * sqrt(365) as annualized_sharpe
from trade_pairs;
```

### market regime detection
**clickhouse machine learning features**
```sql
-- market volatility regime identification
with volatility_features as (
  select 
    symbol,
    todate(timestamp) as date,
    stddev(close) over (partition by symbol, todate(timestamp)) as intraday_vol,
    (max(close) over (partition by symbol, todate(timestamp)) - 
     min(close) over (partition by symbol, todate(timestamp))) / 
     avg(close) over (partition by symbol, todate(timestamp)) as daily_range,
    sum(volume) over (partition by symbol, todate(timestamp)) as daily_volume
  from ohlcv
  where timestamp >= today() - interval 365 day
),
regime_features as (
  select 
    symbol,
    date,
    intraday_vol,
    daily_range,
    daily_volume,
    avg(intraday_vol) over (partition by symbol order by date rows between 19 preceding and current row) as vol_ma_20,
    avg(daily_volume) over (partition by symbol order by date rows between 19 preceding and current row) as volume_ma_20
  from volatility_features
)
select 
  symbol,
  date,
  intraday_vol,
  daily_range,
  daily_volume,
  case 
    when intraday_vol > vol_ma_20 * 1.5 and daily_volume > volume_ma_20 * 1.5 then 'high_volatility_high_volume'
    when intraday_vol > vol_ma_20 * 1.5 and daily_volume <= volume_ma_20 * 1.5 then 'high_volatility_low_volume'
    when intraday_vol <= vol_ma_20 * 1.5 and daily_volume > volume_ma_20 * 1.5 then 'low_volatility_high_volume'
    else 'normal'
  end as market_regime
from regime_features
where date >= today() - interval 30 day
order by symbol, date desc;
```

## operational analytics

### system performance monitoring
**timescaledb operational queries**
```sql
-- data ingestion monitoring
select 
  date_trunc('hour', created_at) as hour,
  symbol,
  count(*) as records_ingested,
  avg(extract(epoch from (created_at - to_timestamp(timestamp/1000)))) as ingestion_latency_seconds,
  max(extract(epoch from (created_at - to_timestamp(timestamp/1000)))) as max_latency_seconds
from ohlcv
where created_at >= now() - interval '24 hours'
group by hour, symbol
order by hour desc, symbol;

-- data quality monitoring
select 
  symbol,
  date_trunc('day', timestamp) as day,
  count(*) as total_records,
  count(case when close > 0 then 1 end) as valid_prices,
  count(case when volume > 0 then 1 end) as valid_volumes,
  count(case when high >= low and high >= close and high >= open and low <= close and low <= open then 1 end) as valid_ohlc,
  min(timestamp) as first_record,
  max(timestamp) as last_record
from ohlcv
where timestamp >= current_date - interval '7 days'
group by symbol, day
order by symbol, day desc;
```

### business intelligence
**clickhouse business analytics**
```sql
-- market share analysis
with market_metrics as (
  select 
    symbol,
    toyyyymm(timestamp) as month,
    sum(volume) as total_volume,
    avg(close) as avg_price,
    count(distinct todate(timestamp)) as trading_days
  from ohlcv
  where timestamp >= today() - interval 12 month
  group by symbol, month
)
select 
  month,
  symbol,
  total_volume,
  avg_price,
  trading_days,
  total_volume / sum(total_volume) over (partition by month) as volume_market_share,
  rank() over (partition by month order by total_volume desc) as volume_rank
from market_metrics
order by month desc, volume_rank;

-- trading pattern analysis
select 
  extract(hour from timestamp) as hour_of_day,
  extract(dow from timestamp) as day_of_week,
  symbol,
  avg(volume) as avg_volume,
  avg(high - low) as avg_price_range,
  count(*) as trade_count
from ohlcv
where timestamp >= now() - interval 30 day
  and symbol in ('btcusd', 'ethusd')
group by hour_of_day, day_of_week, symbol
order by symbol, day_of_week, hour_of_day;
```

## alert and notification systems

### price alerts
**timescaledb real-time processing**
```sql
-- price breakthrough alerts
with latest_prices as (
  select distinct on (symbol) 
    symbol,
    close,
    timestamp,
    lag(close) over (partition by symbol order by timestamp) as prev_close
  from ohlcv
  where timestamp >= now() - interval '5 minutes'
  order by symbol, timestamp desc
)
select 
  lp.symbol,
  lp.close,
  lp.prev_close,
  pa.threshold_price,
  pa.user_id,
  pa.alert_type,
  case 
    when pa.alert_type = 'breakout_above' and lp.close > pa.threshold_price and lp.prev_close <= pa.threshold_price then true
    when pa.alert_type = 'breakout_below' and lp.close < pa.threshold_price and lp.prev_close >= pa.threshold_price then true
    else false
  end as should_alert
from latest_prices lp
join price_alerts pa on lp.symbol = pa.symbol
where pa.is_active = true;
```

### volatility alerts
**clickhouse pattern detection**
```sql
-- unusual volatility detection
with volatility_analysis as (
  select 
    symbol,
    tostartoftime(timestamp, interval 15 minute) as time_bucket,
    (max(high) - min(low)) / avg(close) as volatility_15m,
    sum(volume) as volume_15m
  from ohlcv
  where timestamp >= now() - interval 1 day
  group by symbol, time_bucket
),
volatility_stats as (
  select 
    symbol,
    time_bucket,
    volatility_15m,
    volume_15m,
    avg(volatility_15m) over (partition by symbol order by time_bucket rows between 95 preceding and current row) as avg_vol_24h,
    stddev(volatility_15m) over (partition by symbol order by time_bucket rows between 95 preceding and current row) as stddev_vol_24h
  from volatility_analysis
)
select 
  symbol,
  time_bucket,
  volatility_15m,
  avg_vol_24h,
  volatility_15m / avg_vol_24h as vol_multiple,
  case 
    when volatility_15m > avg_vol_24h + (2 * stddev_vol_24h) then 'high_volatility_alert'
    when volume_15m > avg(volume_15m) over (partition by symbol order by time_bucket rows between 95 preceding and current row) * 3 then 'high_volume_alert'
    else 'normal'
  end as alert_type
from volatility_stats
where time_bucket >= now() - interval 2 hour
  and (volatility_15m > avg_vol_24h + (2 * stddev_vol_24h) or 
       volume_15m > avg(volume_15m) over (partition by symbol order by time_bucket rows between 95 preceding and current row) * 3)
order by time_bucket desc;
```

## integration examples

### api endpoints
```typescript
// real-time price api (timescaledb)
app.get('/api/prices/current/:symbol', async (req, res) => {
  const result = await timescale.query(`
    select close, volume, timestamp
    from ohlcv 
    where symbol = $1 
    order by timestamp desc 
    limit 1
  `, [req.params.symbol]);
  
  res.json(result.rows[0]);
});

// historical analysis api (clickhouse)
app.get('/api/analysis/volatility/:symbol', async (req, res) => {
  const result = await clickhouse.query(`
    select 
      todate(timestamp) as date,
      stddev(close) as daily_volatility,
      (max(close) - min(close)) / avg(close) as daily_range
    from ohlcv
    where symbol = {symbol:string}
      and timestamp >= today() - interval 30 day
    group by date
    order by date
  `, { symbol: req.params.symbol });
  
  res.json(result.data);
});
```

### streaming data pipeline
```typescript
// real-time data processor
redpandaConsumer.on('message', async (message) => {
  const ohlcvData = JSON.parse(message.value);
  
  // write to timescaledb for real-time queries
  await timescale.insertOhlcv([ohlcvData]);
  
  // write to clickhouse for analytics
  await clickhouse.insertOhlcv([ohlcvData]);
  
  // check for alerts
  const alerts = await checkPriceAlerts(ohlcvData);
  if (alerts.length > 0) {
    await sendNotifications(alerts);
  }
});
```

this comprehensive set of use cases demonstrates how the dual database architecture supports both real-time trading operations and complex analytical workloads, providing a complete foundation for a production crypto data platform.