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
const msgUtils = require("../utils/message_utils");
const events_1 = require("events");
const Time_1 = require("./Time");
const GoalIdGenerator_1 = require("../actions/GoalIdGenerator");
let GoalID = null;
let Header = null;
class ActionClientInterface extends events_1.EventEmitter {
    constructor(options) {
        super();
        if (GoalID === null) {
            GoalID = msgUtils.requireMsgPackage('actionlib_msgs').msg.GoalID;
        }
        if (Header === null) {
            Header = msgUtils.requireMsgPackage('std_msgs').msg.Header;
        }
        this._actionType = options.type;
        this._actionServer = options.actionServer;
        const nh = this._nh = options.nh;
        const goalOptions = Object.assign({ queueSize: 10, latching: false }, options.goal);
        this._goalPub = nh.advertise(this._actionServer + '/goal', this._actionType + 'ActionGoal', goalOptions);
        const cancelOptions = Object.assign({ queueSize: 10, latching: false }, options.cancel);
        this._cancelPub = nh.advertise(this._actionServer + '/cancel', 'actionlib_msgs/GoalID', cancelOptions);
        const statusOptions = Object.assign({ queueSize: 1 }, options.status);
        this._statusSub = nh.subscribe(this._actionServer + '/status', 'actionlib_msgs/GoalStatusArray', (msg) => { this._handleStatus(msg); }, statusOptions);
        const feedbackOptions = Object.assign({ queueSize: 1 }, options.feedback);
        this._feedbackSub = nh.subscribe(this._actionServer + '/feedback', this._actionType + 'ActionFeedback', (msg) => { this._handleFeedback(msg); }, feedbackOptions);
        const resultOptions = Object.assign({ queueSize: 1 }, options.result);
        this._resultSub = nh.subscribe(this._actionServer + '/result', this._actionType + 'ActionResult', (msg) => { this._handleResult(msg); }, resultOptions);
        this._hasStatus = false;
    }
    getType() {
        return this._actionType;
    }
    /**
     * Cancel the given goal. If none is given, send an empty goal message,
     * i.e. cancel all goals. See
     * http://wiki.ros.org/actionlib/DetailedDescription#The_Messages
     * @param [goalId] {string} id of the goal to cancel
     */
    cancel(goalId, stamp = null) {
        if (!stamp) {
            stamp = Time_1.default.now();
        }
        const cancelGoal = new GoalID({ stamp });
        if (!goalId) {
            this._cancelPub.publish(cancelGoal);
        }
        else {
            cancelGoal.id = goalId;
            this._cancelPub.publish(cancelGoal);
        }
    }
    sendGoal(goal) {
        this._goalPub.publish(goal);
    }
    waitForActionServerToStart(timeoutMs) {
        return __awaiter(this, void 0, void 0, function* () {
            let isConnected = this.isServerConnected();
            if (isConnected) {
                return true;
            }
            else {
                if (typeof timeoutMs !== 'number') {
                    timeoutMs = 0;
                }
                const start = Date.now();
                do {
                    yield sleep(100);
                    if (this.isServerConnected()) {
                        return true;
                    }
                    else if (timeoutMs > 0 && start + timeoutMs > Date.now()) {
                        return false;
                    }
                } while (!this.isServerConnected());
            }
        });
    }
    generateGoalId(now) {
        return GoalIdGenerator_1.default(this._nh, now);
    }
    isServerConnected() {
        return this._hasStatus &&
            this._goalPub.getNumSubscribers() > 0 &&
            this._cancelPub.getNumSubscribers() > 0 &&
            this._statusSub.getNumPublishers() > 0 &&
            this._feedbackSub.getNumPublishers() > 0 &&
            this._resultSub.getNumPublishers() > 0;
    }
    /**
     * Shuts down this ActionClient. It shuts down publishers, subscriptions
     * and removes all attached event listeners.
     * @returns {Promise}
     */
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeAllListeners();
            yield Promise.all([
                this._goalPub.shutdown(),
                this._cancelPub.shutdown(),
                this._statusSub.shutdown(),
                this._feedbackSub.shutdown(),
                this._resultSub.shutdown()
            ]);
        });
    }
    _handleStatus(msg) {
        this._hasStatus = true;
        this.emit('status', msg);
    }
    _handleFeedback(msg) {
        this.emit('feedback', msg);
    }
    _handleResult(msg) {
        this.emit('result', msg);
    }
}
exports.default = ActionClientInterface;
function sleep(timeoutMs) {
    return new Promise(function (resolve) {
        setTimeout(resolve, timeoutMs);
    });
}
//# sourceMappingURL=ActionClientInterface.js.map