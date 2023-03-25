/// <reference types="node" />
import * as SerializationUtils from '../utils/serialization_utils';
declare type DeserializeStream = SerializationUtils.DeserializeStream;
import { EventEmitter } from 'events';
import { IServiceServer, ServerCallback, ServerOptions, ServiceConnectionHeader } from '../types/ServiceServer';
import { Socket } from 'net';
import IRosNode from '../types/RosNode';
export default class ServiceServer<Req, Res> extends EventEmitter implements IServiceServer {
    private _service;
    private _type;
    private _port;
    private _nodeHandle;
    private _log;
    private _requestCallback;
    private _messageHandler;
    private _state;
    private _clients;
    constructor(options: ServerOptions<Req, Res>, callback: ServerCallback<Req, Res>, nodeHandle: IRosNode);
    getService(): string;
    getType(): string;
    getServiceUri(): string;
    getClientUris(): string[];
    /**
     * The ROS client shutdown code is a little noodly. Users can close a client through
     * the ROS node or the client itself and both are correct. Either through a node.unadvertise()
     * call or a client.shutdown() call - in both instances a call needs to be made to the ROS master
     * and the client needs to tear itself down.
     */
    shutdown(): Promise<void>;
    isShutdown(): boolean;
    disconnect(): void;
    handleClientConnection(socket: Socket, uri: string, deserializer: DeserializeStream, header: ServiceConnectionHeader): void;
    private _handleMessage;
    private _register;
}
export {};
