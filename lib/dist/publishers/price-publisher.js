// lib/publishers/price-publisher.ts
import { CryptoDataPublisher } from "./crypto-data-publisher";
export class PricePublisher extends CryptoDataPublisher {
  async publishPrice(price) {
    return super.publishPrice(price);
  }
  async publishPrices(prices) {
    return super.publishPrices(prices);
  }
}
