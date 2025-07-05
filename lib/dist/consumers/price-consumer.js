// lib/consumers/price-consumer.ts
import { CryptoDataConsumer } from "./crypto-data-consumer";
export class PriceConsumer extends CryptoDataConsumer {
    onPriceUpdate(handler) {
        this.onPriceData(handler);
    }
}
