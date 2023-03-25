"use strict";
/*
 *    Copyright 2017 Rethink Robotics
 *
 *    Copyright 2017 Chris Smith
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
const Ultron = require("ultron");
const ActionServerInterface_1 = require("../lib/ActionServerInterface");
const GoalHandle_1 = require("./GoalHandle");
const Time_1 = require("../lib/Time");
const ThisNode_1 = require("../lib/ThisNode");
const Message_1 = require("../types/Message");
/**
 * @class ActionServer
 * EXPERIMENTAL
 *
 */
class ActionServer extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._pubSeqs = { result: 0, feedback: 0, status: 0 };
        this._goalHandleList = [];
        this._goalHandleCache = {};
        this._statusListTimeout = { secs: 5, nsecs: 0 };
        this._shutdown = false;
        this._started = false;
        this._options = options;
        this._lastCancelStamp = Time_1.default.epoch();
        this._ultron = new Ultron(ThisNode_1.default);
    }
    start() {
        this._started = true;
        this._asInterface = new ActionServerInterface_1.default(this._options);
        this._asInterface.on('goal', this._handleGoal.bind(this));
        this._asInterface.on('cancel', this._handleCancel.bind(this));
        const actionType = this._asInterface.getType();
        this._messageTypes = {
            result: msgUtils.getHandlerForMsgType(actionType + 'Result'),
            feedback: msgUtils.getHandlerForMsgType(actionType + 'Feedback'),
            actionResult: msgUtils.getHandlerForMsgType(actionType + 'ActionResult'),
            actionFeedback: msgUtils.getHandlerForMsgType(actionType + 'ActionFeedback')
        };
        this.publishStatus();
        let statusFreq = 5;
        if (this._options.statusFrequency !== undefined) {
            if (typeof this._options.statusFrequency !== 'number') {
                throw new Error(`Invalid value (${this._options.statusFrequency}) for statusFrequency - expected number`);
            }
            statusFreq = this._options.statusFrequency;
        }
        if (statusFreq > 0) {
            this._statusFreqInt = setInterval(() => {
                this.publishStatus();
            }, 1000 / statusFreq);
        }
        // FIXME: how to handle shutdown? Should user be responsible?
        // should we check for shutdown in interval instead of listening
        // to events here?
        this._ultron.once('shutdown', () => { this.shutdown(); });
    }
    generateGoalId() {
        return this._asInterface.generateGoalId();
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._shutdown) {
                this._shutdown = true;
                this.removeAllListeners();
                clearInterval(this._statusFreqInt);
                this._statusFreqInt = null;
                this._ultron.destroy();
                this._ultron = null;
                if (this._asInterface) {
                    return this._asInterface.shutdown();
                }
            }
        });
    }
    _getGoalHandle(id) {
        return this._goalHandleCache[id];
    }
    _handleGoal(msg) {
        if (!this._started) {
            return;
        }
        const newGoalId = msg.goal_id.id;
        let handle = this._getGoalHandle(newGoalId);
        if (handle) {
            // check if we already received a request to cancel this goal
            if (handle.getStatusId() === Message_1.ActionMsgs.Status.RECALLING) {
                handle.setCancelled(new this._messageTypes.result());
            }
            handle._destructionTime = msg.goal_id.stamp;
            return;
        }
        handle = new GoalHandle_1.default(msg.goal_id, this, Message_1.ActionMsgs.Status.PENDING, msg.goal);
        this._goalHandleList.push(handle);
        this._goalHandleCache[handle.id] = handle;
        const goalStamp = msg.goal_id.stamp;
        // check if this goal has already been cancelled based on its timestamp
        if (!Time_1.default.isZeroTime(goalStamp) &&
            Time_1.default.timeComp(goalStamp, this._lastCancelStamp) < 0) {
            handle.setCancelled(new this._messageTypes.result());
            return;
        }
        else {
            // track goal, I guess
            this.emit('goal', handle);
        }
        return;
    }
    _handleCancel(msg) {
        if (!this._started) {
            return;
        }
        const cancelId = msg.id;
        const cancelStamp = msg.stamp;
        const cancelStampIsZero = Time_1.default.isZeroTime(cancelStamp);
        const shouldCancelEverything = (cancelId === '' && cancelStampIsZero);
        let goalIdFound = false;
        for (let i = 0, len = this._goalHandleList.length; i < len; ++i) {
            const handle = this._goalHandleList[i];
            const handleId = handle.id;
            const handleStamp = handle.getStatus().goal_id.stamp;
            if (shouldCancelEverything ||
                cancelId === handleId ||
                (!Time_1.default.isZeroTime(handleStamp) &&
                    Time_1.default.timeComp(handleStamp, cancelStamp) < 0)) {
                if (cancelId === handleId) {
                    goalIdFound = true;
                }
                if (handle.setCancelRequested()) {
                    this.emit('cancel', handle);
                }
            }
        }
        // if the requested goal_id was not found and it is not empty,
        // then we need to store the cancel request
        if (cancelId !== '' && !goalIdFound) {
            const handle = new GoalHandle_1.default(msg, this, Message_1.ActionMsgs.Status.RECALLING);
            this._goalHandleList.push(handle);
            this._goalHandleCache[handle.id] = handle;
        }
        // update the last cancel stamp if new one occurred later
        if (Time_1.default.timeComp(cancelStamp, this._lastCancelStamp) > 0) {
            this._lastCancelStamp = cancelStamp;
        }
    }
    publishResult(status, result) {
        const msg = new this._messageTypes.actionResult({ status, result });
        msg.header.stamp = Time_1.default.now();
        msg.header.seq = this._getAndIncrementSeq('result');
        this._asInterface.publishResult(msg);
        this.publishStatus();
    }
    publishFeedback(status, feedback) {
        const msg = new this._messageTypes.actionFeedback({ status, feedback });
        msg.header.stamp = Time_1.default.now();
        msg.header.seq = this._getAndIncrementSeq('feedback');
        this._asInterface.publishFeedback(msg);
        this.publishStatus();
    }
    publishStatus() {
        const msg = {
            header: {
                stamp: Time_1.default.now(),
                seq: this._getAndIncrementSeq('status'),
                frame_id: ''
            },
            status_list: []
        };
        let goalsToRemove = new Set();
        const now = Time_1.default.now();
        for (let i = 0, len = this._goalHandleList.length; i < len; ++i) {
            const goalHandle = this._goalHandleList[i];
            msg.status_list.push(goalHandle.getGoalStatus());
            const t = goalHandle._destructionTime;
            if (!Time_1.default.isZeroTime(t) &&
                Time_1.default.lt(Time_1.default.add(t, this._statusListTimeout), now)) {
                goalsToRemove.add(goalHandle);
            }
        }
        // clear out any old goal handles
        this._goalHandleList = this._goalHandleList.filter((goal) => {
            // kind of funky to remove from another object in this filter...
            if (goalsToRemove.has(goal)) {
                delete this._goalHandleCache[goal.id];
                return false;
            }
            return true;
        });
        this._asInterface.publishStatus(msg);
    }
    _getAndIncrementSeq(type) {
        return this._pubSeqs[type]++;
    }
    _createMessage(type, args = {}) {
        return new this._messageTypes[type](args);
    }
}
exports.default = ActionServer;
//# sourceMappingURL=ActionServer.js.map