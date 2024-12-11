/**
 * @fileoverview
 * @module ohlcv.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// data/models/sources/cryptocompare/ohlcv.ts
import { OHLCV } from "../../base/ohlcv.js";
import { CryptoCompareOHLCVData } from "./response.js";
import { TradeBreakdown, VolumeBreakdown } from "./types.js";

export class CryptoCompareOHLCV implements OHLCV {
  public readonly exchange: string;
  public readonly symbol: string;
  public readonly timestamp: number;
  public readonly open: number;
  public readonly high: number;
  public readonly low: number;
  public readonly close: number;
  public readonly volume: number;
  public readonly quoteVolume: number;
  public readonly trades: number;

  private readonly data: CryptoCompareOHLCVData;

  constructor(data: CryptoCompareOHLCVData) {
    this.data = data;

    this.exchange = data.MARKET;
    this.symbol = data.MAPPED_INSTRUMENT ?? data.INSTRUMENT;
    this.timestamp = data.TIMESTAMP * 1000;
    this.open = data.OPEN;
    this.high = data.HIGH;
    this.low = data.LOW;
    this.close = data.CLOSE;
    this.volume = data.VOLUME;
    this.quoteVolume = data.QUOTE_VOLUME;
    this.trades = data.TOTAL_TRADES;
  }

  getTradeBreakdown(): TradeBreakdown {
    return {
      buy: this.data.TOTAL_TRADES_BUY,
      sell: this.data.TOTAL_TRADES_SELL,
      unknown: this.data.TOTAL_TRADES_UNKNOWN,
    };
  }

  getVolumeBreakdown(): VolumeBreakdown {
    return {
      buy: this.data.VOLUME_BUY,
      sell: this.data.VOLUME_SELL,
      unknown: this.data.VOLUME_UNKNOWN,
      quoteBuy: this.data.QUOTE_VOLUME_BUY,
      quoteSell: this.data.QUOTE_VOLUME_SELL,
      quoteUnknown: this.data.QUOTE_VOLUME_UNKNOWN,
    };
  }

  getRawData(): CryptoCompareOHLCVData {
    return { ...this.data };
  }

  static fromResponse(data: CryptoCompareOHLCVData[]): CryptoCompareOHLCV[] {
    return data.map((item) => new CryptoCompareOHLCV(item));
  }
}
