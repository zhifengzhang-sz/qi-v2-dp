import type { CryptoPrice } from "../publishers/types";
import { CryptoDataConsumer } from "./crypto-data-consumer";
import type { MessageHandler } from "./types";
export declare class PriceConsumer extends CryptoDataConsumer {
    onPriceUpdate(handler: MessageHandler<CryptoPrice>): void;
}
