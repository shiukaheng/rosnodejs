"use strict";
/*
 *    Copyright 2016 Rethink Robotics
 *
 *    Copyright 2016 Chris Smith
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingManager = void 0;
/// <reference path="../../types.d.ts"/>
const bunyan = require("bunyan");
const Logger_1 = require("../utils/log/Logger");
const RosLogStream_1 = require("../utils/log/RosLogStream");
const ConsoleLogStream_1 = require("../utils/log/ConsoleLogStream");
const LogFormatter_1 = require("../utils/log/LogFormatter");
const msgUtils = require("../utils/message_utils");
//-----------------------------------------------------------------------
const DEFAULT_LOGGER_NAME = 'ros';
const LOG_CLEANUP_INTERVAL_MS = 30000; // 30 seconds
// TODO: put this in a config file somewhere
const KNOWN_LOGS = [
    {
        name: `${DEFAULT_LOGGER_NAME}.superdebug`,
        level: bunyan.FATAL
    },
    {
        name: `${DEFAULT_LOGGER_NAME}.rosnodejs`,
        level: bunyan.WARN
    },
    {
        name: `${DEFAULT_LOGGER_NAME}.masterapi`,
        level: bunyan.WARN
    },
    {
        name: `${DEFAULT_LOGGER_NAME}.params`,
        level: bunyan.WARN
    },
    {
        name: `${DEFAULT_LOGGER_NAME}.spinner`,
        level: bunyan.ERROR
    }
];
const rootLoggerOptions = {
    name: DEFAULT_LOGGER_NAME,
    streams: [{
            type: 'raw',
            name: 'ConsoleLogStream',
            stream: new ConsoleLogStream_1.default({ formatter: LogFormatter_1.default }),
            level: bunyan.INFO
        }],
    level: bunyan.INFO
};
class LoggingManager {
    constructor() {
        this.rootLogger = new Logger_1.default(rootLoggerOptions);
        this._cleanLoggersInterval = null;
        this._externalLog = {};
        this.trace = this.rootLogger.trace.bind(this.rootLogger);
        this.debug = this.rootLogger.debug.bind(this.rootLogger);
        this.info = this.rootLogger.info.bind(this.rootLogger);
        this.warn = this.rootLogger.warn.bind(this.rootLogger);
        this.error = this.rootLogger.error.bind(this.rootLogger);
        this.fatal = this.rootLogger.fatal.bind(this.rootLogger);
        this.traceThrottle = this.rootLogger.traceThrottle.bind(this.rootLogger);
        this.debugThrottle = this.rootLogger.debugThrottle.bind(this.rootLogger);
        this.infoThrottle = this.rootLogger.infoThrottle.bind(this.rootLogger);
        this.warnThrottle = this.rootLogger.warnThrottle.bind(this.rootLogger);
        this.errorThrottle = this.rootLogger.errorThrottle.bind(this.rootLogger);
        this.fatalThrottle = this.rootLogger.fatalThrottle.bind(this.rootLogger);
        this.traceOnce = this.rootLogger.traceOnce.bind(this.rootLogger);
        this.debugOnce = this.rootLogger.debugOnce.bind(this.rootLogger);
        this.infoOnce = this.rootLogger.infoOnce.bind(this.rootLogger);
        this.warnOnce = this.rootLogger.warnOnce.bind(this.rootLogger);
        this.errorOnce = this.rootLogger.errorOnce.bind(this.rootLogger);
        this.fatalOnce = this.rootLogger.fatalOnce.bind(this.rootLogger);
        this.loggerMap = {};
        this.nameFromLevel = bunyan.nameFromLevel;
        this.levelFromName = bunyan.levelFromName;
        this.DEFAULT_LOGGER_NAME = DEFAULT_LOGGER_NAME;
        KNOWN_LOGS.forEach((log) => {
            this._generateLogger(log);
        });
    }
    initializeNodeLogger(nodeName, options = {}) {
        // setup desired streams
        if (options.hasOwnProperty('streams')) {
            options.streams.forEach((stream) => {
                this.addStream(stream);
            });
        }
        // set desired log level
        if (options.hasOwnProperty('level')) {
            this.setLevel(options.level);
        }
        // automatically clear out expired throttled logs every so often unless specified otherwise
        if (!options.hasOwnProperty('overrideLoggerCleanup')) {
            this._cleanLoggersInterval = setInterval(this.clearThrottledLogs.bind(this), LOG_CLEANUP_INTERVAL_MS);
        }
        if (typeof options.getLoggers === 'function') {
            this._externalLog.getLoggers = options.getLoggers;
        }
        if (typeof options.setLoggerLevel === 'function') {
            this._externalLog.setLoggerLevel = options.setLoggerLevel;
        }
    }
    initializeRosOptions(nh, options = {}) {
        if (options.skipRosLogging) {
            console.log('skip ros logging');
            return Promise.resolve();
        }
        let rosLogStream;
        try {
            const rosgraphMsgs = msgUtils.requireMsgPackage('rosgraph_msgs');
            const rosLogStream = new RosLogStream_1.default(nh, rosgraphMsgs.msg.Log);
            this.addStream({
                type: 'raw',
                name: 'RosLogStream',
                stream: rosLogStream
            });
        }
        catch (err) {
            this.rootLogger.warn('Unable to setup ros logging stream', err);
        }
        // try to set up logging services
        try {
            const roscpp = msgUtils.requireMsgPackage('roscpp');
            const getLoggerSrv = nh.getNodeName() + '/get_loggers';
            const setLoggerSrv = nh.getNodeName() + '/set_logger_level';
            nh.advertiseService(getLoggerSrv, roscpp.srv.GetLoggers, this._handleGetLoggers.bind(this));
            nh.advertiseService(setLoggerSrv, roscpp.srv.SetLoggerLevel, this._handleSetLoggerLevel.bind(this));
        }
        catch (err) {
            this.rootLogger.warn('Unable to setup ros logging services', err);
        }
        if (rosLogStream && options.waitOnRosOut !== undefined && options.waitOnRosOut) {
            this.rootLogger.info('Waiting for /rosout connection before resolving node initialization...');
            return new Promise((resolve) => {
                rosLogStream.getPub().once('connection', () => {
                    this.rootLogger.debug('Got connection to /rosout !');
                    resolve();
                });
            });
        }
        return Promise.resolve();
    }
    getLogger(loggerName, options) {
        if (!loggerName || loggerName === this.rootLogger.getName()) {
            return this.rootLogger;
        }
        else if (!this.hasLogger(loggerName)) {
            options = options || {};
            options.name = loggerName;
            return this._generateLogger(options);
        }
        // else
        return this.loggerMap[loggerName];
    }
    hasLogger(loggerName) {
        return this.loggerMap.hasOwnProperty(loggerName);
    }
    removeLogger(loggerName) {
        if (loggerName !== DEFAULT_LOGGER_NAME) {
            delete this.loggerMap[loggerName];
        }
    }
    getLoggers() {
        const loggerNames = Object.keys(this.loggerMap);
        loggerNames.push(this.rootLogger.getName());
        return loggerNames;
    }
    getStreams() {
        return this.rootLogger.getStreams();
    }
    getStream(streamName) {
        const streams = this.getStreams();
        for (let i = 0; i < streams.length; ++i) {
            const stream = streams[i];
            if (stream.name === streamName) {
                return stream;
            }
        }
    }
    setLevel(level) {
        this._forEachLogger((logger) => logger.setLevel(level), true);
    }
    addStream(stream) {
        this._forEachLogger((logger) => logger.addStream(stream), true);
    }
    clearStreams() {
        this._forEachLogger((logger) => logger.clearStreams(), true);
    }
    clearThrottledLogs() {
        this._forEachLogger((logger) => logger.clearExpiredThrottledLogs(), true);
    }
    stopLogCleanup() {
        clearInterval(this._cleanLoggersInterval);
        this._cleanLoggersInterval = null;
    }
    _generateLogger(options) {
        if (!options.hasOwnProperty('name')) {
            throw new Error('Unable to generate logger without name');
        }
        const loggerName = options.name;
        // don't regenerate the logger if it exists
        if (this.loggerMap.hasOwnProperty(loggerName)) {
            return this.loggerMap[loggerName];
        }
        // else
        // generate a child logger from root
        let newLogger = this._createChildLogger(loggerName, this.rootLogger, options);
        // stash the logger and return it
        this.loggerMap[loggerName] = newLogger;
        return newLogger;
    }
    _handleGetLoggers(req, resp) {
        if (this._externalLog.getLoggers) {
            this._externalLog.getLoggers(req, resp);
        }
        this._forEachLogger((logger) => {
            resp.loggers.push({
                name: logger.getName(),
                level: bunyan.nameFromLevel[logger.getLevel()]
            });
        }, true);
        return true;
    }
    _handleSetLoggerLevel(req, resp) {
        let handled = false;
        if (this._externalLog.setLoggerLevel) {
            handled = this._externalLog.setLoggerLevel(req, resp);
        }
        if (!handled) {
            const logger = this.getLogger(req.logger);
            if (!logger) {
                return false;
            }
            // else
            logger.setLevel(req.level);
        }
        return true;
    }
    _forEachLogger(perLoggerCallback, includeRoot) {
        if (includeRoot) {
            perLoggerCallback(this.rootLogger);
        }
        for (const loggerName in this.loggerMap) {
            perLoggerCallback(this.loggerMap[loggerName]);
        }
    }
    _createChildLogger(childLoggerName, parentLogger, options) {
        // setup options
        options = options || {};
        options.name = childLoggerName;
        // create logger
        const childLogger = parentLogger.child(options);
        // cache in map
        this.loggerMap[childLoggerName] = childLogger;
        return childLogger;
    }
    ;
}
exports.LoggingManager = LoggingManager;
exports.default = new LoggingManager();
//# sourceMappingURL=LoggingManager.js.map