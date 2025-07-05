// lib/publishers/price-publisher.ts
import { CryptoDataPublisher } from "./crypto-data-publisher";
import type { CryptoPrice, PublishResult } from "./types";

export class PricePublisher extends CryptoDataPublisher {
  async publishPrice(price: CryptoPrice): Promise<PublishResult> {
    return super.publishPrice(price);
  }

  async publishPrices(prices: CryptoPrice[]): Promise<PublishResult[]> {
    return super.publishPrices(prices);
  }
}
