import XmlrpcClient from '../utils/XmlrpcClient';
import * as XmlTypes from '../types/XmlrpcTypes';
declare type XmlrpcCallOptions = XmlTypes.XmlrpcCallOptions;
export default class MasterApiClient {
    _log: any;
    _xmlrpcClient: XmlrpcClient;
    constructor(rosMasterUri: string);
    getXmlrpcClient(): XmlrpcClient;
    _call<T extends XmlTypes.XmlrpcCall>(method: string, data: T['Req'], options?: XmlrpcCallOptions): Promise<T['Resp']>;
    registerService(callerId: string, service: string, serviceUri: string, uri: string, options: XmlrpcCallOptions): Promise<[number, string, number]>;
    unregisterService(callerId: string, service: string, serviceUri: string, options: XmlrpcCallOptions): Promise<[number, string, number]>;
    registerSubscriber(callerId: string, topic: string, topicType: string, uri: string, options: XmlrpcCallOptions): Promise<[number, string, string[]]>;
    unregisterSubscriber(callerId: string, topic: string, uri: string, options: XmlrpcCallOptions): Promise<[number, string, number]>;
    registerPublisher(callerId: string, topic: string, topicType: string, uri: string, options: XmlrpcCallOptions): Promise<[number, string, string[]]>;
    unregisterPublisher(callerId: string, topic: string, uri: string, options: XmlrpcCallOptions): Promise<[number, string, number]>;
    lookupNode(callerId: string, nodeName: string, options: XmlrpcCallOptions): Promise<[number, string, string]>;
    getPublishedTopics(callerId: string, subgraph: string, options: XmlrpcCallOptions): Promise<XmlTypes.TopicInfo>;
    getTopicTypes(callerId: string, options: XmlrpcCallOptions): Promise<XmlTypes.TopicInfo>;
    getSystemState(callerId: string, options: XmlrpcCallOptions): Promise<XmlTypes.SystemState>;
    getUri(callerId: string, options: XmlrpcCallOptions): Promise<[number, string, string]>;
    lookupService(callerId: string, service: string, options: XmlrpcCallOptions): Promise<[number, string, string]>;
}
export {};
