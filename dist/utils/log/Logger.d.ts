/// <reference path="../../../types.d.ts" />
import * as bunyan from 'bunyan';
export declare type Options = {
    name?: string;
    $parent?: bunyan.Logger;
    level?: bunyan.LogLevel;
    streams?: bunyan.Stream[];
    childOptions?: Options;
};
declare type ThrottleArgs = [string, ...any[]] | [any, string];
declare type ThrottledMethodType = (t: number, ...p: ThrottleArgs) => boolean;
declare type OnceMethodType = (...a: ThrottleArgs) => boolean;
/**
 * Logger is a minimal wrapper around a bunyan logger. It adds useful methods
 * to throttle/limit logging.
 * @class Logger
 */
export default class Logger {
    private _name;
    private _logger;
    private _throttledLogs;
    private _onceLogs;
    constructor(options?: Options);
    getStreams(): bunyan.Stream[];
    child(childOptions: Options): Logger;
    level(level?: bunyan.LogLevel): void;
    setLevel(level: number | string): void;
    getLevel(): number;
    getName(): string;
    addStream(stream: bunyan.Stream): void;
    clearStreams(): void;
    trace(...args: any[]): any;
    debug(...args: any[]): any;
    info(...args: any[]): any;
    warn(...args: any[]): any;
    error(...args: any[]): any;
    fatal(...args: any[]): any;
    traceThrottle: ThrottledMethodType;
    debugThrottle: ThrottledMethodType;
    infoThrottle: ThrottledMethodType;
    warnThrottle: ThrottledMethodType;
    errorThrottle: ThrottledMethodType;
    fatalThrottle: ThrottledMethodType;
    traceOnce: OnceMethodType;
    debugOnce: OnceMethodType;
    infoOnce: OnceMethodType;
    warnOnce: OnceMethodType;
    errorOnce: OnceMethodType;
    fatalOnce: OnceMethodType;
    /**
     * Handles throttling logic for each log statement. Throttles logs by attempting
     * to create a string log 'key' from the arguments.
     * @param throttleTimeMs {number}
     * @param args {Array} arguments provided to calling function
     * @return {boolean} should this log be throttled (if true, the log should not be written)
     */
    private _throttle;
    /**
     * Handles once logic for each log statement. Throttles logs by attempting
     * to create a string log 'key' from the arguments.
     * @param args {Array} arguments provided to calling function
     * @return {boolean} should this be written
     */
    _once(args: ThrottleArgs): boolean;
    _getThrottleMsg(args: ThrottleArgs): string | null;
    /**
     * Remove old throttled logs (logs that were throttled whose throttling time has passed) from the throttling map
     * @returns {Number} number of logs that were cleaned out
     */
    clearExpiredThrottledLogs(): number;
    getThrottledLogSize(): number;
}
export {};