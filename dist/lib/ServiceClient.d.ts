/// <reference types="node" />
import * as net from 'net';
import { DeserializeStream } from '../utils/serialization_utils';
import { EventEmitter } from 'events';
import { ServiceClientOptions } from '../types/ServiceClient';
import IRosNode from '../types/RosNode';
/**
 * @class ServiceClient
 * ServiceClient provides an interface to querying a service in ROS.
 * Typically ROS service calls are blocking. This isn't an option for JS though.
 * To accommodate multiple successive service calls, calls are queued along with
 * resolve/reject handlers created for that specific call. When a call completes, the
 * next call in the queue is handled
 */
export default class ServiceClient<Req, Res> extends EventEmitter {
    private _service;
    private _type;
    private _persist;
    private _maxQueueLength;
    private _resolve;
    private _calling;
    private _log;
    private _nodeHandle;
    private _messageHandler;
    private _serviceClient;
    private _callQueue;
    private _currentCall;
    private _isShutdown;
    constructor(options: ServiceClientOptions<Req, Res>, nodeHandle: IRosNode);
    getService(): string;
    getType(): string;
    getPersist(): boolean;
    isCallInProgress(): boolean;
    close(): void;
    shutdown(): void;
    isShutdown(): boolean;
    call(request: Req): Promise<Res>;
    private _executeCall;
    private _scheduleNextCall;
    private _initiateServiceConnection;
    private _sendRequest;
    private _connectToService;
    private _createCallSocketAndHandlers;
    _cacheSocketIfPersistent(call: CallType<Req, Res>): void;
}
/**
 * @class ServiceCall
 * A small utility class for ServiceClient...
 * basically just a struct.
 */
interface ServiceCall<Req, Res> {
    request: Req;
    resolve: (v: Res) => void;
    reject: (e: any) => void;
    initialized: boolean;
    serviceClient: net.Socket | null;
    deserializer: DeserializeStream | null;
}
export declare type CallType<Req, Res> = ServiceCall<Req, Res>;
export {};