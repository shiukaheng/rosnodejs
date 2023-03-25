import * as MsgSpec from './MessageSpec';
declare enum LoadStatus {
    LOADING = 0,
    LOADED = 1
}
declare type MessageEntry<T extends MsgSpec.RosMsgSpec> = {
    file: string;
    spec: T;
};
declare type MessageCache<T extends MsgSpec.RosMsgSpec> = {
    [key: string]: MessageEntry<T>;
};
declare type PackageMap = {
    [key: string]: {
        messages: MessageCache<MsgSpec.MsgSpec>;
        services: MessageCache<MsgSpec.SrvSpec>;
        actions: MessageCache<MsgSpec.ActionSpec>;
        localDeps: Set<string>;
    };
};
export default class MessageManager {
    _verbose: boolean;
    _loadingPkgs: Map<string, LoadStatus>;
    _packageCache: PackageMap;
    constructor(verbose?: boolean);
    log(...args: any[]): void;
    getCache(): PackageMap;
    getMessageSpec(msgType: string, type: 'msg'): MsgSpec.MsgSpec | null;
    getMessageSpec(msgType: string, type: 'srv'): MsgSpec.SrvSpec | null;
    buildPackageTree(outputDirectory: string, writeFiles?: boolean): Promise<void>;
    buildPackage(packageName: string, outputDirectory: string): Promise<void>;
    initTree(): Promise<void>;
    loadPackage(packageName: string, outputDirectory: string, loadDeps?: boolean, writeFiles?: boolean, filterDepFunc?: (d: string) => boolean): Promise<void>;
    initPackageWrite(packageName: string, jsMsgDir: string): Promise<void>;
    createPackageIndex(packageName: string, directory: string): Promise<void>;
    createIndex(packageName: string, directory: string, msgKey: 'messages' | 'services'): Promise<void>;
    createMessageIndex(packageName: string, directory: string): Promise<void>;
    createServiceIndex(packageName: string, directory: string): Promise<void>;
    packageHasMessages(packageName: string): boolean;
    packageHasServices(packageName: string): boolean;
    packageHasActions(packageName: string): boolean;
    writePackageMessages(packageName: string, jsMsgDir: string): Promise<void>;
    writePackageServices(packageName: string, jsMsgDir: string): Promise<void>;
    private _loadMessagesInCache;
}
export {};
