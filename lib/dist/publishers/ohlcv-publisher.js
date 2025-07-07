// lib/publishers/ohlcv-publisher.ts
import { CryptoDataPublisher } from "./crypto-data-publisher";
export class OHLCVPublisher extends CryptoDataPublisher {
  async publishOHLCV(ohlcv) {
    return super.publishOHLCV(ohlcv);
  }
  async publishOHLCVBatch(ohlcvData) {
    return super.publishOHLCVBatch(ohlcvData);
  }
}
