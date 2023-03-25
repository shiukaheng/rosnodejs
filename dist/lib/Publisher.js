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
 *    Unless required by applicable law or agreed to in writing,
 *    software distributed under the License is distributed on an "AS
 *    IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *    express or implied. See the License for the specific language
 *    governing permissions and limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../../types.d.ts"/>
const events_1 = require("events");
const Ultron = require("ultron");
const event_utils_1 = require("../utils/event_utils");
/**
 * @class Publisher
 * Public facing publishers class. Allows users to send messages to subscribers
 * on a given topic.
 */
class Publisher extends events_1.EventEmitter {
    constructor(impl) {
        super();
        ++impl.count;
        this._impl = impl;
        this._ultron = new Ultron(impl);
        this._topic = impl.getTopic();
        this._type = impl.getType();
        event_utils_1.rebroadcast('registered', this._ultron, this);
        event_utils_1.rebroadcast('connection', this._ultron, this);
        event_utils_1.rebroadcast('disconnect', this._ultron, this);
        event_utils_1.rebroadcast('error', this._ultron, this);
    }
    /**
     * Get the topic this publisher is publishing on
     * @returns {string}
     */
    getTopic() {
        return this._topic;
    }
    /**
     * Get the type of message this publisher is sending
     *            (e.g. std_msgs/String)
     * @returns {string}
     */
    getType() {
        return this._type;
    }
    /**
     * Check if this publisher is latching
     * @returns {boolean}
     */
    getLatching() {
        if (this._impl) {
            return this._impl.getLatching();
        }
        // else
        return false;
    }
    /**
     * Get the numbber of subscribers currently connected to this publisher
     * @returns {number}
     */
    getNumSubscribers() {
        if (this._impl) {
            return this._impl.getNumSubscribers();
        }
        // else
        return 0;
    }
    /**
     * Shuts down this publisher. If this is the last publisher on this topic
     * for this node, closes the publisher and unregisters the topic from Master
     * @returns {Promise}
     */
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            const topic = this.getTopic();
            if (this._impl) {
                const impl = this._impl;
                this._impl = null;
                this._ultron.destroy();
                this._ultron = null;
                --impl.count;
                if (impl.count <= 0) {
                    yield impl.getNode().unadvertise(impl.getTopic());
                }
                this.removeAllListeners();
            }
        });
    }
    /**
     * Check if this publisher has been shutdown
     * @returns {boolean}
     */
    isShutdown() {
        return !!this._impl;
    }
    /**
     * Schedule the msg for publishing - or publish immediately if we're
     * supposed to
     * @param msg {object} object type matching this._type
     * @param [throttleMs] {number} optional override for publisher setting
     */
    publish(msg, throttleMs) {
        this._impl.publish(msg, throttleMs);
    }
}
exports.default = Publisher;
//# sourceMappingURL=Publisher.js.map