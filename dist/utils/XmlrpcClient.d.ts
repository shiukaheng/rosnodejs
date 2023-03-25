/// <reference path="../../types.d.ts" />
/// <reference types="node" />
import * as Events from 'events';
import * as XmlTypes from '../types/XmlrpcTypes';
import type Logger from './log/Logger';
declare type XmlrpcCallOptions = XmlTypes.XmlrpcCallOptions;
export default class XmlrpcClient extends Events.EventEmitter {
    private _xmlrpcClient;
    private _log;
    private _callQueue;
    private _timeout;
    private _timeoutId;
    private _failedAttempts;
    constructor(clientAddressInfo: {
        host: string;
        port: number;
    }, log: Logger);
    getClient(): any;
    call<T extends XmlTypes.XmlrpcCall>(method: string, data: T['Req'], options: XmlrpcCallOptions): Promise<T['Resp']>;
    clear(): void;
    _tryExecuteCall(): void;
    _shiftQueue(): void;
    _resetTimeout(): void;
    _scheduleTryAgain(): void;
}
export {};