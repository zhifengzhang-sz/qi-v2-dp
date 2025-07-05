import type { CryptoOHLCV } from "../publishers/types";
// lib/consumers/ohlcv-consumer.ts
import { CryptoDataConsumer } from "./crypto-data-consumer";
import type { MessageHandler } from "./types";

export class OHLCVConsumer extends CryptoDataConsumer {
  onOHLCVUpdate(handler: MessageHandler<CryptoOHLCV>): void {
    this.onOHLCVData(handler);
  }
}
