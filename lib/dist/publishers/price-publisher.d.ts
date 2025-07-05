import { CryptoDataPublisher } from "./crypto-data-publisher";
import type { CryptoPrice, PublishResult } from "./types";
export declare class PricePublisher extends CryptoDataPublisher {
    publishPrice(price: CryptoPrice): Promise<PublishResult>;
    publishPrices(prices: CryptoPrice[]): Promise<PublishResult[]>;
}
