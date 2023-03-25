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
const events_1 = require("events");
const Ultron = require("ultron");
const ActionClient_1 = require("./ActionClient");
const ClientStates_1 = require("./ClientStates");
const Time_1 = require("../lib/Time");
const LoggingManager_1 = require("../lib/LoggingManager");
const log = LoggingManager_1.default.getLogger('actionlib_nodejs');
const ThisNode_1 = require("../lib/ThisNode");
const Message_1 = require("../types/Message");
class SimpleActionClient extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._goalHandle = null;
        this._activeCb = null;
        this._doneCb = null;
        this._feedbackCb = null;
        this._shutdown = false;
        this._ac = new ActionClient_1.default(options);
        this._simpleState = ClientStates_1.SimpleGoalState.PENDING;
        // FIXME: how to handle shutdown? Should user be responsible?
        // should we check for shutdown in interval instead of listening
        // to events here?
        this._ultron = new Ultron(ThisNode_1.default);
        this._ultron.once('shutdown', () => { this.shutdown(); });
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._shutdown) {
                this._shutdown = true;
                this._ultron.destroy();
                this._ultron = null;
                return this._ac.shutdown();
            }
        });
    }
    waitForServer(timeout) {
        return this._ac.waitForActionServerToStart(timeout);
    }
    isServerConnected() {
        return this._ac.isServerConnected();
    }
    sendGoal(goal, doneCb, activeCb, feedbackCb) {
        if (this._goalHandle) {
            this._goalHandle.reset();
        }
        this._simpleState = ClientStates_1.SimpleGoalState.PENDING;
        // NOTE: should these automatically be attached to events like we do elsewhere?
        // If so, how do we clean up old listeners?
        this._activeCb = activeCb;
        this._doneCb = doneCb;
        this._feedbackCb = feedbackCb;
        const gh = this._ac.sendGoal(goal);
        gh.on('transition', this._handleTransition.bind(this));
        gh.on('feedback', this._handleFeedback.bind(this));
        this._goalHandle = gh;
    }
    sendGoalAndWait(goal, execTimeout, preemptTimeout) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sendGoal(goal);
            const finished = yield this.waitForResult(execTimeout);
            if (finished) {
                log.debug('Goal finished within specified timeout');
            }
            else {
                log.debug('Goal didn\'t finish within specified timeout');
                // it didn't finish in time, so we need to cancel it
                this.cancelGoal();
                // wait again and see if it finishes
                const finished = yield this.waitForResult(preemptTimeout);
                if (finished) {
                    log.debug('Preempt finished within specified timeout');
                }
                else {
                    log.debug('Preempt didn\'t finish within specified timeout');
                }
                return this.getState();
            }
            return this.getState();
        });
    }
    waitForResult(timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._goalHandle || this._goalHandle.isExpired()) {
                log.error('Trying to waitForResult() when no goal is running');
                return false;
            }
            if (Time_1.default.lt(timeout, { secs: 0, nsecs: 0 })) {
                log.warn('Timeout [%s] is invalid - timeouts can\'t be negative');
            }
            if (Time_1.default.isZeroTime(timeout)) {
                return this._waitForResult();
            }
            // else
            return this._waitForResult(Time_1.default.add(timeout, Time_1.default.now()));
        });
    }
    _waitForResult(timeoutTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const WAIT_TIME_MS = 10;
            while (true) {
                const now = Time_1.default.now();
                if (timeoutTime && Time_1.default.timeComp(timeoutTime, now) <= 0) {
                    return this._simpleState === ClientStates_1.SimpleGoalState.DONE;
                }
                else if (this._simpleState === ClientStates_1.SimpleGoalState.DONE) {
                    return true;
                }
                yield sleep(WAIT_TIME_MS);
            }
        });
    }
    getResult() {
        if (!this._goalHandle || this._goalHandle.isExpired()) {
            log.error('Trying to getResult() when no goal is running.');
        }
        else {
            return this._goalHandle.getResult();
        }
    }
    getState() {
        if (!this._goalHandle || this._goalHandle.isExpired()) {
            log.error('Trying to getState() when no goal is running. You are incorrectly using SimpleActionClient');
            return ClientStates_1.SimpleClientGoalState.LOST;
        }
        const commState = this._goalHandle.getCommState();
        switch (commState) {
            case ClientStates_1.CommState.WAITING_FOR_GOAL_ACK:
            case ClientStates_1.CommState.PENDING:
            case ClientStates_1.CommState.RECALLING:
                return ClientStates_1.SimpleClientGoalState.PENDING;
            case ClientStates_1.CommState.ACTIVE:
            case ClientStates_1.CommState.PREEMPTING:
                return ClientStates_1.SimpleClientGoalState.ACTIVE;
            case ClientStates_1.CommState.DONE:
                {
                    const termState = this._goalHandle.getTerminalState();
                    switch (termState) {
                        case Message_1.ActionMsgs.Status.RECALLED:
                            return ClientStates_1.SimpleClientGoalState.RECALLED;
                        case Message_1.ActionMsgs.Status.REJECTED:
                            return ClientStates_1.SimpleClientGoalState.REJECTED;
                        case Message_1.ActionMsgs.Status.PREEMPTED:
                            return ClientStates_1.SimpleClientGoalState.PREEMPTED;
                        case Message_1.ActionMsgs.Status.ABORTED:
                            return ClientStates_1.SimpleClientGoalState.ABORTED;
                        case Message_1.ActionMsgs.Status.SUCCEEDED:
                            return ClientStates_1.SimpleClientGoalState.SUCCEEDED;
                        case Message_1.ActionMsgs.Status.LOST:
                            return ClientStates_1.SimpleClientGoalState.LOST;
                        default:
                            log.error('Unknown terminal state %s', termState);
                            return ClientStates_1.SimpleClientGoalState.LOST;
                    }
                }
            case ClientStates_1.CommState.WAITING_FOR_RESULT:
            case ClientStates_1.CommState.WAITING_FOR_CANCEL_ACK:
                switch (this._simpleState) {
                    case ClientStates_1.SimpleGoalState.PENDING:
                        return ClientStates_1.SimpleClientGoalState.PENDING;
                    case ClientStates_1.SimpleGoalState.ACTIVE:
                        return ClientStates_1.SimpleClientGoalState.ACTIVE;
                    default:
                        log.error('BUG: In WAITING_FOR_RESULT or WAITING_FOR_CANCEL_ACK, yet we are in SimpleGoalState DONE.');
                        return ClientStates_1.SimpleClientGoalState.LOST;
                }
            default:
                log.error('Error trying to interpret CommState - %s', commState);
                return ClientStates_1.SimpleClientGoalState.LOST;
        }
    }
    cancelAllGoals() {
        return this._ac.cancelAllGoals();
    }
    cancelGoalsAtAndBeforeTime(stamp) {
        return this._ac.cancelGoalsAtAndBeforeTime(stamp);
    }
    cancelGoal() {
        if (!this._goalHandle || this._goalHandle.isExpired()) {
            log.error('Trying to cancelGoal() when no goal is running');
        }
        else {
            this._goalHandle.cancel();
        }
    }
    stopTrackingGoal() {
        if (!this._goalHandle || this._goalHandle.isExpired()) {
            log.error('Trying to stopTrackingGoal() when no goal is running');
        }
        else {
            this._goalHandle.reset();
        }
    }
    _handleTransition() {
        const commState = this._goalHandle.getCommState();
        switch (commState) {
            case ClientStates_1.CommState.WAITING_FOR_GOAL_ACK:
                log.error('BUG: shouldn\'t ever get a transition callback for WAITING_FOR_GOAL_ACK');
                break;
            case ClientStates_1.CommState.PENDING:
                if (this._simpleState !== ClientStates_1.SimpleGoalState.PENDING) {
                    log.error('BUG: Got a transition to CommState [%s] when our SimpleGoalState is [%s]', commState, this._simpleState);
                }
                break;
            case ClientStates_1.CommState.ACTIVE:
                switch (this._simpleState) {
                    case ClientStates_1.SimpleGoalState.PENDING:
                        this._setSimpleState(ClientStates_1.SimpleGoalState.ACTIVE);
                        if (this._activeCb) {
                            this._activeCb();
                        }
                        break;
                    case ClientStates_1.SimpleGoalState.ACTIVE:
                        break;
                    case ClientStates_1.SimpleGoalState.DONE:
                        log.error('BUG: Got a transition to CommState [%s] when in SimpleGoalState [%s]', commState, this._simpleState);
                        break;
                    default:
                        log.error('Unknown SimpleGoalState %s', this._simpleState);
                        break;
                }
                break;
            case ClientStates_1.CommState.WAITING_FOR_RESULT:
                break;
            case ClientStates_1.CommState.WAITING_FOR_CANCEL_ACK:
                break;
            case ClientStates_1.CommState.RECALLING:
                if (this._simpleState !== ClientStates_1.SimpleGoalState.PENDING) {
                    log.error('BUG: Got a transition to CommState [%s] when in SimpleGoalState [%s]', commState, this._simpleState);
                }
                break;
            case ClientStates_1.CommState.PREEMPTING:
                switch (this._simpleState) {
                    case ClientStates_1.SimpleGoalState.PENDING:
                        this._setSimpleState(ClientStates_1.SimpleGoalState.ACTIVE);
                        if (this._activeCb) {
                            this._activeCb();
                        }
                        break;
                    case ClientStates_1.SimpleGoalState.ACTIVE:
                        break;
                    case ClientStates_1.SimpleGoalState.DONE:
                        log.error('BUG: Got a transition to CommState [%s] when in SimpleGoalState [%s]', commState, this._simpleState);
                        break;
                    default:
                        log.error('Unknown SimpleGoalState %s', this._simpleState);
                        break;
                }
                break;
            case ClientStates_1.CommState.DONE:
                switch (this._simpleState) {
                    case ClientStates_1.SimpleGoalState.PENDING:
                    case ClientStates_1.SimpleGoalState.ACTIVE:
                        this._setSimpleState(ClientStates_1.SimpleGoalState.DONE);
                        if (this._doneCb) {
                            this._doneCb(this._simpleState, this._goalHandle.getResult());
                        }
                        break;
                    case ClientStates_1.SimpleGoalState.DONE:
                        log.error('BUG: Got a second transition to DONE');
                        break;
                    default:
                        log.error('Unknown SimpleGoalState %s', this._simpleState);
                        break;
                }
                break;
            default:
                log.error('Unknown CommState received %s', commState);
        }
    }
    _handleFeedback(feedback) {
        if (this._feedbackCb) {
            this._feedbackCb(feedback.feedback);
        }
    }
    _setSimpleState(newState) {
        log.debug('Transitioning SimpleState from [%s] to [%s]', this._simpleState, newState);
        this._simpleState = newState;
    }
}
exports.default = SimpleActionClient;
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}
//# sourceMappingURL=SimpleActionClient.js.map