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
Object.defineProperty(exports, "__esModule", { value: true });
const msgUtils = require("../utils/message_utils");
const ActionClientInterface_1 = require("../lib/ActionClientInterface");
const events_1 = require("events");
const Ultron = require("ultron");
const ClientGoalHandle_1 = require("./ClientGoalHandle");
const Time_1 = require("../lib/Time");
const LoggingManager_1 = require("../lib/LoggingManager");
const log = LoggingManager_1.default.getLogger('actionlib_nodejs');
const ThisNode_1 = require("../lib/ThisNode");
const GoalIdGenerator_1 = require("./GoalIdGenerator");
/**
 * @class ActionClient
 * EXPERIMENTAL
 *
 */
class ActionClient extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._goalLookup = {};
        this._shutdown = false;
        this._acInterface = new ActionClientInterface_1.default(options);
        this._acInterface.on('status', this._handleStatus.bind(this));
        this._acInterface.on('feedback', this._handleFeedback.bind(this));
        this._acInterface.on('result', this._handleResult.bind(this));
        const actionType = this._acInterface.getType();
        this._messageTypes = {
            result: msgUtils.getHandlerForMsgType(actionType + 'Result'),
            feedback: msgUtils.getHandlerForMsgType(actionType + 'Feedback'),
            goal: msgUtils.getHandlerForMsgType(actionType + 'Goal'),
            actionResult: msgUtils.getHandlerForMsgType(actionType + 'ActionResult'),
            actionFeedback: msgUtils.getHandlerForMsgType(actionType + 'ActionFeedback'),
            actionGoal: msgUtils.getHandlerForMsgType(actionType + 'ActionGoal')
        };
        this._ultron = new Ultron(ThisNode_1.default);
        // FIXME: how to handle shutdown? Should user be responsible?
        // should we check for shutdown in interval instead of listening
        // to events here?
        this._ultron.once('shutdown', () => { this.shutdown(); });
    }
    shutdown() {
        if (!this._shutdown) {
            this._shutdown = true;
            this._ultron.destroy();
            this._ultron = null;
            return this._acInterface.shutdown();
        }
        // else
        return Promise.resolve();
    }
    sendGoal(goal, transitionCb = null, feedbackCb = null) {
        const actionGoal = new (this._messageTypes.actionGoal)();
        const now = Time_1.default.now();
        actionGoal.header.stamp = now;
        actionGoal.goal_id.stamp = now;
        const goalIdStr = GoalIdGenerator_1.default(this._acInterface._nh, now);
        actionGoal.goal_id.id = goalIdStr;
        actionGoal.goal = goal;
        this._acInterface.sendGoal(actionGoal);
        const handle = new ClientGoalHandle_1.default(actionGoal, this._acInterface);
        if (transitionCb && typeof transitionCb === 'function') {
            handle.on('transition', transitionCb);
        }
        if (feedbackCb && typeof feedbackCb === 'function') {
            handle.on('feedback', feedbackCb);
        }
        this._goalLookup[goalIdStr] = handle;
        return handle;
    }
    cancelAllGoals() {
        this._acInterface.cancel("", { secs: 0, nsecs: 0 });
    }
    cancelGoalsAtAndBeforeTime(stamp) {
        this._acInterface.cancel("", stamp);
    }
    waitForActionServerToStart(timeout) {
        return this._acInterface.waitForActionServerToStart(timeout);
    }
    isServerConnected() {
        return this._acInterface.isServerConnected();
    }
    _handleStatus(msg) {
        const list = msg.status_list;
        const len = list.length;
        const statusMap = {};
        for (let i = 0; i < len; ++i) {
            const entry = list[i];
            const goalId = entry.goal_id.id;
            statusMap[goalId] = entry;
        }
        for (let goalId in this._goalLookup) {
            const goalHandle = this._goalLookup[goalId];
            goalHandle.updateStatus(statusMap[goalId]);
        }
    }
    _handleFeedback(msg) {
        const goalId = msg.status.goal_id.id;
        const goalHandle = this._goalLookup[goalId];
        if (goalHandle) {
            goalHandle.updateFeedback(msg);
        }
    }
    _handleResult(msg) {
        const goalId = msg.status.goal_id.id;
        const goalHandle = this._goalLookup[goalId];
        if (goalHandle) {
            delete this._goalLookup[goalId];
            goalHandle.updateResult(msg);
        }
    }
}
exports.default = ActionClient;
//# sourceMappingURL=ActionClient.js.map