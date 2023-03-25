/// <reference types="node" />
import { Transform } from 'stream';
/**
 * DeserializeStream handles parsing of message chunks for TCPROS
 * encoded messages. When a full message has been received, it
 * emits 'message' with the data for that message. All socket
 * communications should be piped through this.
 */
export declare class DeserializeStream extends Transform {
    private _inBody;
    private _messageConsumed;
    private _messageLen;
    private _messageBuffer;
    private _deserializeServiceResp;
    private _serviceRespSuccess;
    constructor(options?: any);
    _transform(chunk: Buffer, encoding: string, done: () => void): void;
    emitMessage(buffer: Buffer): void;
    setServiceRespDeserialize(): void;
}
export declare function PrependLength(buffer: Buffer): Buffer;
export declare function serializeStringFields(fields: string[]): Buffer;
export declare function deserializeStringFields(buffer: Buffer): string[];
export declare function serializeString(str: string): Buffer;
export declare function deserializeString(buffer: Buffer): string;
