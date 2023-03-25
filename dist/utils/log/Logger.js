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
/// <reference path="../../../types.d.ts"/>
const bunyan = require("bunyan");
const crypto = require("crypto");
/**
 * Logger is a minimal wrapper around a bunyan logger. It adds useful methods
 * to throttle/limit logging.
 * @class Logger
 */
class Logger {
    constructor(options = {}) {
        this._throttledLogs = new Map();
        this._onceLogs = new Set();
        this._name = options.name;
        if (options.$parent) {
            this._logger = options.$parent.child(options.childOptions);
        }
        else {
            this._logger = bunyan.createLogger({
                name: this._name,
                level: options.level || bunyan.INFO,
                streams: options.streams
            });
        }
    }
    getStreams() {
        return this._logger.streams;
    }
    child(childOptions) {
        // setup options
        const name = childOptions.name;
        delete childOptions.name;
        const options = {
            childOptions: childOptions,
            $parent: this._logger,
            name
        };
        // create logger
        return new Logger(options);
    }
    level(level = null) {
        this._logger.level(level);
    }
    setLevel(level) {
        this._logger.level(level);
    }
    getLevel() {
        return this._logger.level();
    }
    getName() {
        return this._name;
    }
    addStream(stream) {
        this._logger.addStream(stream);
    }
    clearStreams() {
        this._logger['streams'] = [];
    }
    trace(...args) { return this._logger.trace.call(this._logger, ...args); }
    ;
    debug(...args) { return this._logger.debug.call(this._logger, ...args); }
    ;
    info(...args) { return this._logger.info.call(this._logger, ...args); }
    ;
    warn(...args) { return this._logger.warn.call(this._logger, ...args); }
    ;
    error(...args) { return this._logger.error.call(this._logger, ...args); }
    ;
    fatal(...args) { return this._logger.fatal.call(this._logger, ...args); }
    ;
    //--------------------------------------------------------------
    // Throttled loggers
    //  These will generally be slower. Performance will also degrade the more
    //  places where you throttle your logs. Keep this in mind. Make child loggers.
    //--------------------------------------------------------------
    /**
     * Handles throttling logic for each log statement. Throttles logs by attempting
     * to create a string log 'key' from the arguments.
     * @param throttleTimeMs {number}
     * @param args {Array} arguments provided to calling function
     * @return {boolean} should this log be throttled (if true, the log should not be written)
     */
    _throttle(throttleTimeMs, args) {
        const now = Date.now();
        const throttlingMsg = this._getThrottleMsg(args);
        if (throttlingMsg === null) {
            // we couldn't get a msg to hash - fall through and log the message
            return false;
        }
        // else
        const msgHash = hashMessage(throttlingMsg);
        const throttledLog = this._throttledLogs.get(msgHash);
        if (throttledLog === undefined || now > throttledLog.startTime + throttledLog.throttleTime) {
            const newThrottledLog = { startTime: now, throttleTime: throttleTimeMs };
            this._throttledLogs.set(msgHash, newThrottledLog);
            return false;
        }
        return true;
    }
    //--------------------------------------------------------------
    // Throttled loggers
    //  These will generally be slower. Performance will also degrade the more
    //  places where you throttle your logs. Keep this in mind. Make child loggers.
    //--------------------------------------------------------------
    /**
     * Handles once logic for each log statement. Throttles logs by attempting
     * to create a string log 'key' from the arguments.
     * @param args {Array} arguments provided to calling function
     * @return {boolean} should this be written
     */
    _once(args) {
        const throttleMsg = this._getThrottleMsg(args);
        if (throttleMsg === null) {
            // we couldn't get a msg to hash - fall through and log the message
            return true;
        }
        const logKey = hashMessage(throttleMsg);
        if (!this._onceLogs.has(logKey)) {
            this._onceLogs.add(logKey);
            return true;
        }
        return false;
    }
    _getThrottleMsg(args) {
        const firstArg = args[0];
        if (typeof firstArg === 'string') {
            return firstArg;
        }
        else if (typeof firstArg === 'object') {
            // bunyan supports passing an object as the first argument with
            // optional fields to add to the log record - the second argument
            // is the actual string 'log message' in this case, so just return that
            return args[1];
        }
        // fall through *womp womp*
        return null;
    }
    /**
     * Remove old throttled logs (logs that were throttled whose throttling time has passed) from the throttling map
     * @returns {Number} number of logs that were cleaned out
     */
    clearExpiredThrottledLogs() {
        const logsToRemove = [];
        const now = Date.now();
        this._throttledLogs.forEach((log, key) => {
            if (now - log.startTime >= log.throttleTime) {
                logsToRemove.push(key);
            }
        });
        logsToRemove.forEach((logKey) => {
            this._throttledLogs.delete(logKey);
        });
        return logsToRemove.length;
    }
    getThrottledLogSize() {
        return this._throttledLogs.size;
    }
}
exports.default = Logger;
Logger.prototype.traceThrottle = makeThrottleMethod('trace');
Logger.prototype.debugThrottle = makeThrottleMethod('debug');
Logger.prototype.infoThrottle = makeThrottleMethod('info');
Logger.prototype.warnThrottle = makeThrottleMethod('warn');
Logger.prototype.errorThrottle = makeThrottleMethod('error');
Logger.prototype.fatalThrottle = makeThrottleMethod('fatal');
Logger.prototype.traceOnce = makeOnceMethod('trace');
Logger.prototype.debugOnce = makeOnceMethod('debug');
Logger.prototype.infoOnce = makeOnceMethod('info');
Logger.prototype.warnOnce = makeOnceMethod('warn');
Logger.prototype.errorOnce = makeOnceMethod('error');
Logger.prototype.fatalOnce = makeOnceMethod('fatal');
/**
 * Attaches throttled logging functions to this object for each level method
 * (info, debug, etc)
 * e.g.
 *  logger.infoThrottle(1000, 'Hi');
 *  logger.debugThrottle(1000, 'Hi');
 * Logs are throttled by a String key taken from the second argument (first
 * should always be throttle time in ms). So if you're logging something with
 * variable values, using format strings should be preferred since it will
 * throttle appropriately while composition will not.
 * e.g.
 *   let i = 0;
 *   setInterval(() => {
 *     logger.infoThrottle(1000, 'Counter: %d', i); // prints once second
 *     logger.infoThrottle(1000, 'Counter: ' + i);  // prints twice a second
 *     ++i;
 *   }, 500);
 *
 * @param methods {Set.<String>}
 */
function makeThrottleMethod(method) {
    // there's currently a bug using arguments in a () => {} function
    return function (throttleTimeMs, ...args) {
        // If the desired log level is enabled and the message
        // isn't being throttled, then log the message.
        if (this._logger[method].call(this._logger) && !this._throttle(throttleTimeMs, args)) {
            this._logger[method].apply(this._logger, args);
            return true;
        }
        return false;
    };
}
function makeOnceMethod(method) {
    return function (...args) {
        if (this._logger[method].call(this._logger) && this._once(args)) {
            this._logger.method.apply(this._logger, args);
            return true;
        }
        return false;
    };
}
// Utility function to help hash messages when we throttle them.
function hashMessage(msg) {
    const sha1 = crypto.createHash('sha1');
    sha1.update(msg);
    return sha1.digest('hex');
}
//# sourceMappingURL=Logger.js.map