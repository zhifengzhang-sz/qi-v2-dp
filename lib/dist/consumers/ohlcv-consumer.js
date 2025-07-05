// lib/consumers/ohlcv-consumer.ts
import { CryptoDataConsumer } from "./crypto-data-consumer";
export class OHLCVConsumer extends CryptoDataConsumer {
    onOHLCVUpdate(handler) {
        this.onOHLCVData(handler);
    }
}
