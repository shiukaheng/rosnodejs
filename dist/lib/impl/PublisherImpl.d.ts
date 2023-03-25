/// <reference types="node" />
import * as Udp from 'dgram';
import type { Socket } from 'net';
import { EventEmitter } from 'events';
import ClientStates from '../../utils/ClientStates';
import { PublisherOptions, TcpClientMap, UdpClientMap } from '../../types/Publisher';
import IRosNode from '../../types/RosNode';
import { MessageConstructor } from '../../types/Message';
import { SubscriberHeader } from '../../types/Subscriber';
/**
 * Implementation class for a Publisher. Handles registration, connecting to
 * subscribers, etc. Public-facing publisher classes will be given an instance
 * of this to use
 */
export default class PublisherImpl<M> extends EventEmitter {
    count: number;
    _topic: string;
    _type: string;
    _latching: boolean;
    _tcpNoDelay: boolean;
    _queueSize: number;
    _throttleMs: number;
    _resolve: boolean;
    _lastSentMsg: Buffer | null;
    _nodeHandle: IRosNode;
    _subClients: TcpClientMap;
    _udpSubClients: UdpClientMap;
    _messageHandler: MessageConstructor<M>;
    _state: ClientStates;
    _log: any;
    udpSocket: Udp.Socket | null;
    constructor(options: PublisherOptions<M>, nodeHandle: IRosNode);
    private _getSpinnerId;
    getTopic(): string;
    getType(): string;
    getLatching(): boolean;
    getNumSubscribers(): number;
    getClientUris(): string[];
    isUdpSubscriber(topic: string): boolean;
    getNode(): IRosNode;
    /**
     * Clears and closes all client connections for this publisher.
     */
    shutdown(): void;
    isShutdown(): boolean;
    publish(msg: M, throttleMs?: number): void;
    private _handleMsgQueue;
    private _sendMsgToUdpClients;
    handleSubscriberConnection(socket: Socket, name: string, header: SubscriberHeader): void;
    addUdpSubscriber(connId: number, host: string, port: number, dgramSize: number): void;
    removeUdpSubscriber(connId: string): void;
    private _register;
}
