import { INodeHandle, AdvertiseOptions, SubscribeOptions, ClientOptions } from "../types/NodeHandle";
import ActionClientInterface, { ActionClientInterfaceOptions } from './ActionClientInterface';
import ActionServerInterface, { ActionServerInterfaceOptions } from './ActionServerInterface';
import { IPublisher } from "../types/Publisher";
import { MessageConstructor, ServiceConstructor } from "../types/Message";
import { IServiceClient } from "../types/ServiceClient";
import { ISubscriber } from "../types/Subscriber";
import { ServerCallback, IServiceServer } from "../types/ServiceServer";
import IRosNode from "../types/RosNode";
/**
 * Handle class for nodes created with rosnodejs
 * @param node {RosNode} node that handle is attached to.
 * @param namespace {string} namespace of node. @default null
 */
export default class NodeHandle implements INodeHandle {
    private _node;
    private _namespace;
    constructor(node: IRosNode, namespace?: string | null);
    setNamespace(namespace: string | null): void;
    getNodeName(): string;
    isShutdown(): boolean;
    /**
     * Creates a ros publisher with the provided options
     * @param topic {string}
     * @param type {string|Object} string representing message type or instance
     * @param [options] {object}
     * @param [options.latching] {boolean} latch messages
     * @param [options.tpcNoDelay] {boolean} set TCP no delay option on Socket
     * @param [options.queueSize] {number} number of messages to queue when publishing
     * @param [options.throttleMs] {number} milliseconds to throttle when publishing
     * @return {Publisher}
     */
    advertise<M>(topic: string, type: string, options?: AdvertiseOptions): IPublisher<M>;
    /**
     * Creates a ros subscriber with the provided options
     * @param topic {string}
     * @param type {string|Object} string representing message type or instance
     * @param callback {function} function to call when message is received
     * @param [options] {object}
     * @param [options.queueSize] {number} number of messages to queue when subscribing
     * @param [options.throttleMs] {number} milliseconds to throttle when subscribing
     * @param [options.transports] {string[]} transports list
     * @return {Subscriber}
     */
    subscribe<M>(topic: string, type: string | MessageConstructor<M>, callback?: (msg: M, len?: number, nodeUri?: string) => void, options?: SubscribeOptions): ISubscriber<M>;
    /**
     * Creates a ros Service server with the provided options
     * @param service {string}
     * @param type {string|Object} string representing service type or instance
     * @param callback {function} function to call when this service is called
     *   e.g.
     *     (request, response) => {
     *       response.data = !request.data;
     *       return true;
     *     }
     * @return {ServiceServer}
     */
    advertiseService<Req, Res>(service: string, type: string | ServiceConstructor<Req, Res>, callback: ServerCallback<Req, Res>): IServiceServer;
    /**
     * Creates a ros Service client with the provided options
     * @param service {string}
     * @param type {string|Object} string representing service type or instance
     * @param options {Object} extra options to pass to service client
     * @return {ServiceClient}
     */
    serviceClient<Req, Res>(service: string, type: ServiceConstructor<Req, Res> | string, options?: ClientOptions): IServiceClient<Req, Res>;
    /**
     * @deprecated - use actionClientInterface
     */
    actionClient<G, F, R>(actionServer: string, type: string, options?: Omit<ActionClientInterfaceOptions, 'actionServer' | 'type' | 'nh'>): ActionClientInterface<G, F, R>;
    /**
     * Create an action client
     * @param  {String} actionServer name of the action server
     * (e.g., "/turtle_shape")
     * @param  {String} type action type
     * (e.g., "turtle_actionlib/Shape")
     * @return {[type]} an instance of ActionClientInterface
     */
    actionClientInterface<G, F, R>(actionServer: string, type: string, options?: Omit<ActionClientInterfaceOptions, 'actionServer' | 'type' | 'nh'>): ActionClientInterface<G, F, R>;
    actionServerInterface<G, F, R>(actionServer: string, type: string, options?: Omit<ActionServerInterfaceOptions, 'actionServer' | 'type' | 'nh'>): ActionServerInterface<G, F, R>;
    /**
     * Stop receiving callbacks for this topic
     * Unregisters subscriber from master
     * @param topic {string} topic to unsubscribe from
     */
    unsubscribe(topic: string): Promise<void>;
    /**
     * Stops publishing on this topic
     * Unregisters publisher from master
     * @param topic {string} topic to unadvertise
     */
    unadvertise(topic: string): Promise<void>;
    /**
     * Unregister service from master
     * @param service {string} service to unadvertise
     */
    unadvertiseService(service: string): Promise<void>;
    /**
     * Polls master for service
     * @param service {string} name of service
     * @param [timeout] {number} give up after some time
     * @return {Promise} resolved when service exists or timeout occurs. Returns true/false for service existence
     */
    waitForService(service: string, timeout?: number): Promise<boolean>;
    getMasterUri(): Promise<[number, string, string]>;
    /**
     * @typedef {Object} TopicList
     * @property {{name: string, type: string}[]} topics Array of topics
     */
    /**
     * Get list of topics that can be subscribed to. This does not return
     * topics that have no publishers.
     *
     * @param {string} subgraph Restrict topic names to match within the
     *                          specified subgraph. Subgraph namespace is
     *                          resolved relative to this node's namespace.
     *                          Will return all names if no subgraph is given.
     * @return {Promise.<TopicList>}
     */
    getPublishedTopics(subgraph?: string): Promise<import("../types/XmlrpcTypes").TopicInfo>;
    /**
     * Retrieve list topic names and their types.
     *
     * @return {Promise.<TopicList>}
     */
    getTopicTypes(): Promise<import("../types/XmlrpcTypes").TopicInfo>;
    /**
     * @typedef {Object} SystemState
     * @property {{...string:Array.<string>}} publishers An object with topic names as keys and
     * an array of publishers as values
     * @property {{...string:Array.<string>}} subscribers An object with topic names as keys and
     * an array of subscribers as values
     * @property {{...string:Array.<string>}} services An object with service names as keys and
     * an array of providers as values
     */
    /**
     * Retrieve list representation of system state (i.e. publishers,
     * subscribers, and services).
     *
     * @return {Promise.<SystemState>}
     */
    getSystemState(): Promise<import("../types/XmlrpcTypes").SystemState>;
    deleteParam(key: string): Promise<void>;
    setParam(key: string, value: any): Promise<void>;
    getParam(key: string): Promise<boolean>;
    hasParam(key: string): Promise<boolean>;
    resolveName(name: string, remap?: boolean, noValidate?: boolean): string;
    remapName(name: string): string;
}