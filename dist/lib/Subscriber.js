"use strict";
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
/// <reference path="../../types.d.ts"/>
const events_1 = require("events");
const Ultron = require("ultron");
const event_utils_1 = require("../utils/event_utils");
//-----------------------------------------------------------------------
/**
 * @class Subscriber
 * Public facing subscriber class. Allows users to listen to messages from
 * publishers on a given topic.
 */
class Subscriber extends events_1.EventEmitter {
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
        event_utils_1.rebroadcast('message', this._ultron, this);
    }
    getTopic() {
        return this._topic;
    }
    getType() {
        return this._type;
    }
    getNumPublishers() {
        if (this._impl) {
            return this._impl.getNumPublishers();
        }
        // else
        return 0;
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._impl) {
                const impl = this._impl;
                this._impl = null;
                this._ultron.destroy();
                this._ultron = null;
                --impl.count;
                if (impl.count <= 0) {
                    yield impl.getNode().unsubscribe(impl.getTopic());
                }
                this.removeAllListeners();
            }
            // else
            return Promise.resolve();
        });
    }
    isShutdown() {
        return !!this._impl;
    }
}
exports.default = Subscriber;
//-----------------------------------------------------------------------
//# sourceMappingURL=Subscriber.js.map