import type { CryptoOHLCV } from "../publishers/types";
import { CryptoDataConsumer } from "./crypto-data-consumer";
import type { MessageHandler } from "./types";
export declare class OHLCVConsumer extends CryptoDataConsumer {
    onOHLCVUpdate(handler: MessageHandler<CryptoOHLCV>): void;
}
