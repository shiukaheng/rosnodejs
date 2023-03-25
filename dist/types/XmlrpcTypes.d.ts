export declare type XmlrpcCallOptions = {
    maxAttempts?: number;
};
export interface XmlrpcCall<TReq = any, TResp = any> {
    Req: TReq;
    Resp: TResp;
}
export interface RegisterService {
    Req: [string, string, string, string];
    Resp: [number, string, number];
}
export interface UnregisterService {
    Req: [string, string, string];
    Resp: [number, string, number];
}
export interface RegisterSubscriber {
    Req: [string, string, string, string];
    Resp: [number, string, string[]];
}
export interface UnregisterSubscriber {
    Req: [string, string, string];
    Resp: [number, string, number];
}
export interface RegisterPublisher {
    Req: [string, string, string, string];
    Resp: [number, string, string[]];
}
export interface UnregisterPublisher {
    Req: [string, string, string];
    Resp: [number, string, number];
}
export interface LookupNode {
    Req: [string, string];
    Resp: [number, string, string];
}
export interface GetPublishedTopics {
    Req: [string, string];
    Resp: [number, string, [string, string][]];
}
export interface GetTopicTypes {
    Req: [string];
    Resp: [number, string, [string, string][]];
}
declare type StateList = [string, string[]][];
export interface GetSystemState {
    Req: [string];
    Resp: [number, string, [StateList, StateList, StateList]];
}
export interface GetUri {
    Req: [string];
    Resp: [number, string, string];
}
export interface LookupService {
    Req: [string, string];
    Resp: [number, string, string];
}
export declare type Protocol = [string, ...any[]];
export interface RequestTopic {
    Req: [string, string, Protocol[]];
    Resp: [number, string, Protocol | []];
}
export interface GetBusStats {
    Req: [string];
    Resp: [number, string, any];
}
export declare type Stats = [number, string, 'i' | 'o' | 'b', string, string, boolean];
export interface GetBusInfo {
    Req: [string];
    Resp: [number, string, Stats[]];
}
export interface GetMasterUri {
    Req: [string];
    Resp: [number, string, string];
}
export interface Shutdown {
    Req: [string, string];
    Resp: [number, string, number];
}
export interface GetPid {
    Req: [string];
    Resp: [number, string, number];
}
export interface GetSubscriptions {
    Req: [string];
    Resp: [number, string, [string, string][]];
}
export interface GetPublications {
    Req: [string];
    Resp: [number, string, [string, string][]];
}
export interface ParamUpdate {
    Req: [string, string, any];
    Resp: [number, string, number];
}
export interface PublisherUpdate {
    Req: [string, string, string[]];
    Resp: [number, string, number];
}
export declare type SystemState = {
    publishers: {
        [key: string]: string[];
    };
    subscribers: {
        [key: string]: string[];
    };
    services: {
        [key: string]: string[];
    };
};
export declare type TopicInfo = {
    topics: {
        name: string;
        type: string;
    }[];
};
export {};
