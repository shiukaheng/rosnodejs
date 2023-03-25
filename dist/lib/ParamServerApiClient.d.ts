import type XmlrpcClient from '../utils/XmlrpcClient';
import * as XmlTypes from '../types/XmlrpcTypes';
declare type XmlrpcCallOptions = XmlTypes.XmlrpcCallOptions;
export default class ParamServerApiClient {
    private _log;
    private _xmlrpcClient;
    constructor(xmlrpcClient: XmlrpcClient);
    _call<T extends XmlTypes.XmlrpcCall>(method: string, data: T['Req'], options?: XmlrpcCallOptions): Promise<T['Resp']>;
    deleteParam(callerId: string, key: string): Promise<void>;
    setParam(callerId: string, key: string, value: any): Promise<void>;
    getParam<T = any>(callerId: string, key: string): Promise<T>;
    searchParam(callerId: string, key: string): void;
    subscribeParam(callerId: string, key: string): void;
    unsubscribeParam(callerId: string, key: string): void;
    hasParam(callerId: string, key: string): Promise<boolean>;
    getParamNames(callerId: string): Promise<any>;
}
export {};
