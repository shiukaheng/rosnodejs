/// <reference types="node" />
import { Socket } from 'net';
import { EventEmitter } from 'events';
import type Logger from '../../utils/log/Logger';
import ClientStates from '../../utils/ClientStates';
import { SubscriberOptions, SubscriberClientMap, UdpInfo } from '../../types/Subscriber';
import IRosNode from '../../types/RosNode';
import { MessageConstructor } from '../../types/Message';
/**
 * Implementation class for a Subscriber. Handles registration, connecting to
 * publishers, etc. Public-facing subscriber classes will be given an instance
 * of this to use
 */
export default class SubscriberImpl<M> extends EventEmitter {
    count: number;
    _topic: string;
    _type: string;
    _udp: boolean;
    _dgramSize?: number;
    _tcp: boolean;
    _udpFirst: boolean;
    _queueSize: number;
    _throttleMs: number;
    _tcpNoDelay: boolean;
    _nodeHandle: IRosNode;
    _messageHandler: MessageConstructor<M>;
    _pubClients: SubscriberClientMap;
    _pendingPubClients: SubscriberClientMap;
    _state: ClientStates;
    _log: Logger;
    _connectionId?: number;
    _udpMessage: UdpInfo;
    constructor(options: SubscriberOptions<M>, nodeHandle: IRosNode);
    private _getSpinnerId;
    getTopic(): string;
    getType(): string;
    getNumPublishers(): number;
    getNode(): IRosNode;
    getConnectionId(): number;
    getTransport(): string;
    handleMessageChunk(header: UdpInfo, dgramMsg: Buffer): void;
    shutdown(): void;
    isShutdown(): boolean;
    getClientUris(): string[];
    requestTopicFromPubs(pubs: string[]): void;
    _handlePublisherUpdate(publisherList: string[]): void;
    private _requestTopicFromPublisher;
    /**
     * disconnects and clears out the specified client
     * @param clientId {string}
     */
    private _disconnectClient;
    /**
     * Registers the subscriber with the ROS master
     * will connect to any existing publishers on the topic that are included in the response
     */
    private _register;
    /**
     * Handles the response to a topicRequest message (to connect to a publisher)
     * @param resp {Array} xmlrpc response to a topic request
     */
    private _handleTopicRequestResponse;
    _handleUdpTopicRequestResponse(resp: any, nodeUri: string): void;
    _handleTcpTopicRequestResponse(resp: any, nodeUri: string): void;
    /**
     * Convenience function - creates the connection header for this subscriber to send
     * @returns {string}
     */
    _createTcprosHandshake(): Buffer;
    _handleConnectionHeader(socket: Socket, nodeUri: string, msg: Buffer): void;
    /**
     * Handles a single message from a publisher. Passes message off to
     * Spinner if we're queueing, otherwise handles it immediately.
     * @param msg {string}
     */
    _handleMessage(msg: Buffer, nodeUri?: string): void;
    /**
     * Deserializes and events for the list of messages
     * @param msgQueue {Array} array of strings - each string is its own message.
     */
    _handleMsgQueue(msgQueue: [{
        msg: Buffer;
        nodeUri?: string;
    }]): void;
}