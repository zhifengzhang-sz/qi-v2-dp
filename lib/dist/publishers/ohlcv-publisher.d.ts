import { CryptoDataPublisher } from "./crypto-data-publisher";
import type { CryptoOHLCV, PublishResult } from "./types";
export declare class OHLCVPublisher extends CryptoDataPublisher {
  publishOHLCV(ohlcv: CryptoOHLCV): Promise<PublishResult>;
  publishOHLCVBatch(ohlcvData: CryptoOHLCV[]): Promise<PublishResult[]>;
}
