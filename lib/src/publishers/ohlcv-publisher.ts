// lib/publishers/ohlcv-publisher.ts
import { CryptoDataPublisher } from "./crypto-data-publisher";
import type { CryptoOHLCV, PublishResult } from "./types";

export class OHLCVPublisher extends CryptoDataPublisher {
  async publishOHLCV(ohlcv: CryptoOHLCV): Promise<PublishResult> {
    return super.publishOHLCV(ohlcv);
  }

  async publishOHLCVBatch(ohlcvData: CryptoOHLCV[]): Promise<PublishResult[]> {
    return super.publishOHLCVBatch(ohlcvData);
  }
}
