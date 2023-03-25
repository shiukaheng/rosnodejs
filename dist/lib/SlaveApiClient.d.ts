import * as xmlrpc from 'xmlrpc-rosnodejs';
import * as XmlTypes from '../types/XmlrpcTypes';
export default class SlaveApiClient {
    _xmlrpcClient: xmlrpc.Client;
    constructor(host: string, port: number);
    requestTopic(callerId: string, topic: string, protocols: XmlTypes.Protocol[]): Promise<[number, string, [] | XmlTypes.Protocol]>;
}