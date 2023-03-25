declare type Formatter = (r: any) => string;
export declare type RosLogOptions = {
    queueSize?: number;
    formatter?: Formatter;
};
export default class RosLogStream {
    _formatter: Formatter;
    _nodeName: string;
    _rosoutPub: any;
    constructor(nh: any, rosgraphLogMsg: any, options?: RosLogOptions);
    getPub(): any;
    private _getRosLogLevel;
    write(rec: any): void;
}
export {};