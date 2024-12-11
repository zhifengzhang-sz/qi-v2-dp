/**
 * @fileoverview
 * @module tick.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// data/models/sources/cryptocompare/tick.ts
import { Tick } from "../../base/tick.js";
import { CryptoCompareTickData } from "./response.js";
import { TradeSide } from "./types.js";

export interface ProcessedTrade {
  timestamp: number;
  timestampNs: number;
  price: number;
  quantity: number;
  quoteQuantity: number;
  side: TradeSide;
}

export class CryptoCompareTick implements Tick {
  public readonly exchange: string;
  public readonly symbol: string;
  public readonly timestamp: number;
  public readonly price: number;
  public readonly quantity: number;
  public readonly side: TradeSide;

  private readonly data: CryptoCompareTickData;

  constructor(data: CryptoCompareTickData) {
    this.data = data;

    this.exchange = data.MARKET;
    this.symbol = data.MAPPED_INSTRUMENT ?? data.INSTRUMENT;
    this.timestamp = data.PRICE_LAST_UPDATE_TS * 1000;
    this.price = data.PRICE;
    this.quantity = data.LAST_TRADE_QUANTITY;
    // Convert string to TradeSide type
    this.side = this.normalizeTradeSide(data.LAST_TRADE_SIDE);
  }

  private normalizeTradeSide(side: string): TradeSide {
    const normalizedSide = side.toLowerCase();
    if (normalizedSide === "buy" || normalizedSide === "sell") {
      return normalizedSide;
    }
    return "unknown";
  }

  getTimestampNs(): number {
    return this.data.PRICE_LAST_UPDATE_TS_NS;
  }

  getQuoteQuantity(): number {
    return this.data.LAST_TRADE_QUOTE_QUANTITY;
  }

  getSequence(): number {
    return this.data.CCSEQ;
  }

  getProcessedTrade(): ProcessedTrade {
    return {
      timestamp: this.data.LAST_PROCESSED_TRADE_TS * 1000,
      timestampNs: this.data.LAST_PROCESSED_TRADE_TS_NS,
      price: this.data.LAST_PROCESSED_TRADE_PRICE,
      quantity: this.data.LAST_PROCESSED_TRADE_QUANTITY,
      quoteQuantity: this.data.LAST_PROCESSED_TRADE_QUOTE_QUANTITY,
      side: this.normalizeTradeSide(this.data.LAST_PROCESSED_TRADE_SIDE),
    };
  }

  getRawData(): CryptoCompareTickData {
    return { ...this.data };
  }

  static fromResponse(data: CryptoCompareTickData[]): CryptoCompareTick[] {
    return data.map((item) => new CryptoCompareTick(item));
  }
}
