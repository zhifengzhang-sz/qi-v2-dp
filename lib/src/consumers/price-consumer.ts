import type { CryptoPrice } from "../publishers/types";
// lib/consumers/price-consumer.ts
import { CryptoDataConsumer } from "./crypto-data-consumer";
import type { MessageHandler } from "./types";

export class PriceConsumer extends CryptoDataConsumer {
  onPriceUpdate(handler: MessageHandler<CryptoPrice>): void {
    this.onPriceData(handler);
  }
}
