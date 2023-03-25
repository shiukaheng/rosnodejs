/// <reference path="../../types.d.ts" />
import * as bunyan from 'bunyan';
import Logger, { Options as LoggerOptions } from '../utils/log/Logger';
import type { GetLoggers, SetLoggerLevel } from '../types/RosTypes';
import type { INodeHandle } from '../types/NodeHandle';
declare type NodeLoggerOptions = {
    streams?: bunyan.Stream[];
    level?: bunyan.LogLevel;
    getLoggers?: ExternalLogInterface['getLoggers'];
    setLoggerLevel?: ExternalLogInterface['setLoggerLevel'];
};
declare type RosLoggerOptions = {
    skipRosLogging?: boolean;
    waitOnRosOut?: boolean;
};
declare type ExternalLogInterface = {
    getLoggers?: (req: GetLoggers['Req'], resp: GetLoggers['Resp']) => boolean;
    setLoggerLevel?: (req: SetLoggerLevel['Req'], resp: SetLoggerLevel['Resp']) => boolean;
};
export declare class LoggingManager {
    loggerMap: {
        [key: string]: Logger;
    };
    rootLogger: Logger;
    nameFromLevel: typeof bunyan.nameFromLevel;
    levelFromName: typeof bunyan.levelFromName;
    DEFAULT_LOGGER_NAME: string;
    private _cleanLoggersInterval;
    private _externalLog;
    constructor();
    initializeNodeLogger(nodeName: string, options?: NodeLoggerOptions): void;
    initializeRosOptions(nh: INodeHandle, options?: RosLoggerOptions): Promise<unknown>;
    trace: any;
    debug: any;
    info: any;
    warn: any;
    error: any;
    fatal: any;
    traceThrottle: any;
    debugThrottle: any;
    infoThrottle: any;
    warnThrottle: any;
    errorThrottle: any;
    fatalThrottle: any;
    traceOnce: any;
    debugOnce: any;
    infoOnce: any;
    warnOnce: any;
    errorOnce: any;
    fatalOnce: any;
    getLogger(loggerName?: string, options?: LoggerOptions): Logger;
    hasLogger(loggerName: string): boolean;
    removeLogger(loggerName: string): void;
    getLoggers(): string[];
    getStreams(): bunyan.Stream[];
    getStream(streamName: string): bunyan.Stream;
    setLevel(level: bunyan.LogLevel): void;
    addStream(stream: bunyan.Stream): void;
    clearStreams(): void;
    clearThrottledLogs(): void;
    stopLogCleanup(): void;
    private _generateLogger;
    private _handleGetLoggers;
    private _handleSetLoggerLevel;
    _forEachLogger(perLoggerCallback: (l: Logger) => void, includeRoot: boolean): void;
    _createChildLogger(childLoggerName: string, parentLogger: Logger, options: LoggerOptions): Logger;
}
declare const _default: LoggingManager;
export default _default;
