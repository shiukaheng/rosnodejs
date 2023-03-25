/// <reference types="node" />
import Subscriber from './Subscriber';
import Publisher from './Publisher';
import ServiceClient from './ServiceClient';
import { EventEmitter } from 'events';
import IRosNode from '../types/RosNode';
import type Logger from '../utils/log/Logger';
import type * as XmlrpcTypes from '../types/XmlrpcTypes';
import type Spinner from '../types/Spinner';
import { PublisherOptions } from '../types/Publisher';
import { SubscriberOptions, SubscriberCallback } from '../types/Subscriber';
import { ServerOptions, ServerCallback, IServiceServer } from '../types/ServiceServer';
import { ServiceClientOptions } from '../types/ServiceClient';
declare type NodeOptions = {
    tcprosPort?: number;
    xmlrpcPort?: number;
    udprosPort?: number;
    forceExit?: boolean;
    spinner?: any;
};
/**
 * Create a ros node interface to the master
 * @param name {string} name of the node
 * @param rosMaster {string} full uri of ros maxter (http://localhost:11311)
 */
export default class RosNode extends EventEmitter implements IRosNode {
    private _udpConnectionCounter;
    _log: Logger;
    private _debugLog;
    private _slaveApiServer;
    private _xmlrpcPort;
    private _tcprosServer;
    private _udprosServer;
    private _tcprosPort;
    _udprosPort: number;
    private _nodeName;
    private _rosMasterAddress;
    private _masterApi;
    private _paramServerApi;
    private _publishers;
    private _subscribers;
    private _services;
    private _spinner;
    private _shutdown;
    private _exit;
    constructor(nodeName: string, rosMaster: string, options?: NodeOptions);
    getLogger(): Logger;
    getSpinner(): Spinner;
    getRosMasterUri(): string;
    advertise<M>(options: PublisherOptions<M>): Publisher<M>;
    subscribe<M>(options: SubscriberOptions<M>, callback?: SubscriberCallback<M>): Subscriber<M>;
    advertiseService<Req, Res>(options: ServerOptions<Req, Res>, callback: ServerCallback<Req, Res>): IServiceServer;
    serviceClient<Req, Res>(options: ServiceClientOptions<Req, Res>): ServiceClient<Req, Res>;
    unsubscribe(topic: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<void>;
    unadvertise(topic: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<void>;
    unadvertiseService(service: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<void>;
    hasSubscriber(topic: string): boolean;
    hasPublisher(topic: string): boolean;
    hasService(service: string): boolean;
    getNodeName(): string;
    registerService(service: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.RegisterService['Resp']>;
    unregisterService(service: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.UnregisterService['Resp']>;
    registerSubscriber(topic: string, type: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.RegisterSubscriber['Resp']>;
    unregisterSubscriber(topic: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.UnregisterSubscriber['Resp']>;
    registerPublisher(topic: string, type: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.RegisterPublisher['Resp']>;
    unregisterPublisher(topic: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.UnregisterPublisher['Resp']>;
    lookupNode(nodeName: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.LookupNode['Resp']>;
    lookupService(service: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.LookupService['Resp']>;
    getMasterUri(options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.GetMasterUri['Resp']>;
    getPublishedTopics(subgraph: string, options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.TopicInfo>;
    getTopicTypes(options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.TopicInfo>;
    getSystemState(options?: XmlrpcTypes.XmlrpcCallOptions): Promise<XmlrpcTypes.SystemState>;
    /**
     * Delays xmlrpc calls until our servers are set up
     * Since we need their ports for most of our calls.
     * @returns {Promise}
     * @private
     */
    private _whenReady;
    private _getXmlrpcUri;
    deleteParam(key: string): Promise<void>;
    setParam(key: string, value: any): Promise<void>;
    getParam<T>(key: string): Promise<T>;
    hasParam(key: string): Promise<boolean>;
    /**
     * Send a topic request to another ros node
     * @param remoteAddress {string} ip address/hostname of node
     * @param remotePort {number} port of node
     * @param topic {string} topic we want a connection for
     * @param protocols {object} communication protocols this node supports (just TCPROS, really)
     */
    requestTopic(remoteAddress: string, remotePort: number, topic: string, protocols: any[]): Promise<XmlrpcTypes.RequestTopic['Resp']>;
    serversReady(): boolean;
    shutdown(): Promise<void>;
    isShutdown(): boolean;
    private _setupSlaveApi;
    private _setupTcprosServer;
    private _setupUdprosServer;
    private _handleTopicRequest;
    /**
     * Handle publisher update message from master
     * @param err was there an error
     * @param params {Array} [caller_id, topic, publishers]
     * @param callback function(err, resp) call when done handling message
     */
    private _handlePublisherUpdate;
    private _handleParamUpdate;
    private _handleGetPublications;
    private _handleGetSubscriptions;
    private _handleGetPid;
    private _handleShutdown;
    private _handleGetMasterUri;
    private _handleGetBusInfo;
    private _handleGetBusStats;
    /**
     * Initializes the spinner for this node.
     * @param [spinnerOpts] {object} either an instance of a spinner to use or the parameters to configure one
     * @param [spinnerOpts.type] {string} type of spinner to create
     */
    private _setupSpinner;
    _setupExitHandler(forceExit?: boolean): void;
}
export {};
