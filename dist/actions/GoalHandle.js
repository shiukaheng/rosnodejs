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
const Time_1 = require("../lib/Time");
const LoggingManager_1 = require("../lib/LoggingManager");
const Message_1 = require("../types/Message");
const log = LoggingManager_1.default.getLogger('ros.rosnodejs');
class GoalHandle {
    /**
     * goalId: An actionlib_msgs/GoalID.
     * actionServer: The ActionServer processing this goal
     * status: A number from actionlib_msgs/GoalStatus, like GoalStatuses.PENDING.
     * goal: The goal message, e.g., a FibonacciGoal. May be left undefined if
     *  this goal is used to represent a cancellation.
     */
    constructor(goalId, actionServer, status, goal) {
        if (goalId.id === '') {
            goalId = actionServer.generateGoalId();
        }
        if (Time_1.default.isZeroTime(goalId.stamp)) {
            goalId.stamp = Time_1.default.now();
        }
        this.id = goalId.id;
        this._as = actionServer;
        this._status = {
            status: status || Message_1.ActionMsgs.Status.PENDING,
            goal_id: goalId,
            text: ''
        };
        this._goal = goal;
        this._destructionTime = Time_1.default.epoch();
    }
    getGoal() {
        return this._goal;
    }
    getStatus() {
        return this._status;
    }
    getStatusId() {
        return this._status.status;
    }
    getGoalId() {
        return this._status.goal_id;
    }
    getGoalStatus() {
        return this._status;
    }
    publishFeedback(feedback) {
        this._as.publishFeedback(this._status, feedback);
    }
    _setStatus(status, text) {
        this._status.status = status;
        if (text) {
            this._status.text = text;
        }
        // FIXME: just guessing about setting destruction time
        if (this._isTerminalState()) {
            this._destructionTime = Time_1.default.now();
        }
        this._as.publishStatus();
    }
    _publishResult(result) {
        this._as.publishResult(this._status, result);
    }
    // For Goal State transitions, See
    // http://wiki.ros.org/actionlib/DetailedDescription#Server_Description
    setCanceled(result, text = '') {
        const status = this.getStatusId();
        switch (status) {
            case Message_1.ActionMsgs.Status.PENDING:
            case Message_1.ActionMsgs.Status.RECALLING:
                this._setStatus(Message_1.ActionMsgs.Status.RECALLED, text);
                this._publishResult(result);
                break;
            case Message_1.ActionMsgs.Status.ACTIVE:
            case Message_1.ActionMsgs.Status.PREEMPTING:
                this._setStatus(Message_1.ActionMsgs.Status.PREEMPTED, text);
                this._publishResult(result);
                break;
            default:
                this._logInvalidTransition('setCancelled', status);
                break;
        }
    }
    setCancelled(result, text = '') {
        return this.setCanceled(result, text);
    }
    setRejected(result, text = '') {
        const status = this.getStatusId();
        switch (status) {
            case Message_1.ActionMsgs.Status.PENDING:
            case Message_1.ActionMsgs.Status.RECALLING:
                this._setStatus(Message_1.ActionMsgs.Status.REJECTED, text);
                this._publishResult(result);
                break;
            default:
                this._logInvalidTransition('setRejected', status);
                break;
        }
    }
    setAccepted(text = '') {
        const status = this.getStatusId();
        switch (status) {
            case Message_1.ActionMsgs.Status.PENDING:
                this._setStatus(Message_1.ActionMsgs.Status.ACTIVE, text);
                break;
            case Message_1.ActionMsgs.Status.RECALLING:
                this._setStatus(Message_1.ActionMsgs.Status.PREEMPTING, text);
                break;
            default:
                this._logInvalidTransition('setAccepted', status);
                break;
        }
    }
    setAborted(result, text = '') {
        const status = this.getStatusId();
        switch (status) {
            case Message_1.ActionMsgs.Status.PREEMPTING:
            case Message_1.ActionMsgs.Status.ACTIVE:
                this._setStatus(Message_1.ActionMsgs.Status.ABORTED, text);
                this._publishResult(result);
                break;
            default:
                this._logInvalidTransition('setAborted', status);
                break;
        }
    }
    setSucceeded(result, text = '') {
        const status = this.getStatusId();
        switch (status) {
            case Message_1.ActionMsgs.Status.PREEMPTING:
            case Message_1.ActionMsgs.Status.ACTIVE:
                this._setStatus(Message_1.ActionMsgs.Status.SUCCEEDED, text);
                this._publishResult(result);
                break;
            default:
                this._logInvalidTransition('setSucceeded', status);
                break;
        }
    }
    setCancelRequested() {
        const status = this.getStatusId();
        switch (status) {
            case Message_1.ActionMsgs.Status.PENDING:
                this._setStatus(Message_1.ActionMsgs.Status.RECALLING);
                return true;
            case Message_1.ActionMsgs.Status.ACTIVE:
                this._setStatus(Message_1.ActionMsgs.Status.PREEMPTING);
                return true;
            default:
                this._logInvalidTransition('setCancelRequested', status);
                return false;
        }
    }
    _logInvalidTransition(transition, currentStatus) {
        log.warn('Unable to %s from status %s for goal %s', transition, currentStatus, this.id);
    }
    _isTerminalState() {
        return [
            Message_1.ActionMsgs.Status.REJECTED,
            Message_1.ActionMsgs.Status.RECALLED,
            Message_1.ActionMsgs.Status.PREEMPTED,
            Message_1.ActionMsgs.Status.ABORTED,
            Message_1.ActionMsgs.Status.SUCCEEDED
        ].includes(this._status.status);
    }
}
exports.default = GoalHandle;
//# sourceMappingURL=GoalHandle.js.map