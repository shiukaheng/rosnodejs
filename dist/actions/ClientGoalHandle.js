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
const ClientStates_1 = require("./ClientStates");
const events_1 = require("events");
const LoggingManager_1 = require("../lib/LoggingManager");
const Message_1 = require("../types/Message");
const log = LoggingManager_1.default.getLogger('actionlib_nodejs');
class ClientGoalHandle extends events_1.EventEmitter {
    constructor(actionGoal, actionClientInterface) {
        super();
        this._state = ClientStates_1.CommState.WAITING_FOR_GOAL_ACK;
        this._goalStatus = null;
        this._result = null;
        this._active = true;
        this._goal = actionGoal;
        this._clientInterface = actionClientInterface;
    }
    reset() {
        this._active = false;
        this._clientInterface = null;
        this.removeAllListeners();
    }
    getGoalStatus() {
        return this._goalStatus;
    }
    resend() {
        if (!this._active) {
            log.error('Trying to resend on an inactive ClientGoalHandle!');
        }
        this._clientInterface.sendGoal(this._goal);
    }
    cancel() {
        if (!this._active) {
            log.error('Trying to cancel on an inactive ClientGoalHandle!');
        }
        switch (this._state) {
            case ClientStates_1.CommState.WAITING_FOR_GOAL_ACK:
            case ClientStates_1.CommState.PENDING:
            case ClientStates_1.CommState.ACTIVE:
            case ClientStates_1.CommState.WAITING_FOR_CANCEL_ACK:
                break;
            case ClientStates_1.CommState.WAITING_FOR_RESULT:
            case ClientStates_1.CommState.RECALLING:
            case ClientStates_1.CommState.PREEMPTING:
            case ClientStates_1.CommState.DONE:
                log.debug('Got a cancel request while in state [%s], ignoring it', this._state);
                return;
            default:
                log.error('BUG: Unhandled CommState: %s', this._state);
                return;
        }
        this._clientInterface.cancel(this._goal.goal_id.id, { secs: 0, nsecs: 0 });
        this._transition(ClientStates_1.CommState.WAITING_FOR_CANCEL_ACK);
    }
    getResult() {
        if (!this._active) {
            log.error('Trying to getResult on an inactive ClientGoalHandle!');
        }
        if (this._result) {
            return this._result.result;
        }
    }
    getTerminalState() {
        if (!this._active) {
            log.error('Trying to getTerminalState on an inactive ClientGoalHandle!');
        }
        if (this._state !== ClientStates_1.CommState.DONE) {
            log.warn('Asking for terminal state when we\'re in %s', this._state);
        }
        if (this._goalStatus) {
            switch (this._goalStatus.status) {
                case Message_1.ActionMsgs.Status.PENDING:
                case Message_1.ActionMsgs.Status.ACTIVE:
                case Message_1.ActionMsgs.Status.PREEMPTING:
                case Message_1.ActionMsgs.Status.RECALLING:
                    log.error('Asking for terminal state, but latest goal status is %s', this._goalStatus.status);
                    return Message_1.ActionMsgs.Status.LOST;
                case Message_1.ActionMsgs.Status.PREEMPTED:
                case Message_1.ActionMsgs.Status.SUCCEEDED:
                case Message_1.ActionMsgs.Status.ABORTED:
                case Message_1.ActionMsgs.Status.REJECTED:
                case Message_1.ActionMsgs.Status.RECALLED:
                case Message_1.ActionMsgs.Status.LOST:
                    return this._goalStatus.status;
                default:
                    log.error('Unknown goal status: %s', this._goalStatus.status);
            }
        }
    }
    getCommState() {
        return this._state;
    }
    isExpired() {
        return !this._active;
    }
    updateFeedback(feedback) {
        this.emit('feedback', feedback);
    }
    updateResult(actionResult) {
        this._goalStatus = actionResult.status;
        this._result = actionResult;
        switch (this._state) {
            case ClientStates_1.CommState.WAITING_FOR_GOAL_ACK:
            case ClientStates_1.CommState.PENDING:
            case ClientStates_1.CommState.ACTIVE:
            case ClientStates_1.CommState.WAITING_FOR_RESULT:
            case ClientStates_1.CommState.WAITING_FOR_CANCEL_ACK:
            case ClientStates_1.CommState.RECALLING:
            case ClientStates_1.CommState.PREEMPTING:
                // trigger all the state transitions users would expect
                this.updateStatus(actionResult.status);
                this._transition(ClientStates_1.CommState.DONE);
                break;
            case ClientStates_1.CommState.DONE:
                log.error('Got a result when we were already in the DONE state');
                break;
            default:
                log.error('In a funny comm state: %s', this._state);
        }
    }
    updateStatus(status) {
        // it's apparently possible to receive old GoalStatus messages, even after
        // transitioning to a terminal state.
        if (this._state === ClientStates_1.CommState.DONE) {
            return;
        }
        // else
        if (status) {
            this._goalStatus = status;
        }
        else {
            // this goal wasn't included in the latest status message!
            // it may have been lost. No need to check for DONE since we already did
            if (this._state !== ClientStates_1.CommState.WAITING_FOR_GOAL_ACK &&
                this._state !== ClientStates_1.CommState.WAITING_FOR_RESULT) {
                log.warn('Transitioning goal to LOST');
                this._goalStatus.status === Message_1.ActionMsgs.Status.LOST;
                this._transition(ClientStates_1.CommState.DONE);
            }
            return;
        }
        switch (this._state) {
            case ClientStates_1.CommState.WAITING_FOR_GOAL_ACK:
                switch (status.status) {
                    case Message_1.ActionMsgs.Status.PENDING:
                        this._transition(ClientStates_1.CommState.PENDING);
                        break;
                    case Message_1.ActionMsgs.Status.ACTIVE:
                        this._transition(ClientStates_1.CommState.ACTIVE);
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTED:
                        this._transition(ClientStates_1.CommState.ACTIVE);
                        this._transition(ClientStates_1.CommState.PREEMPTING);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.SUCCEEDED:
                        this._transition(ClientStates_1.CommState.ACTIVE);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.ABORTED:
                        this._transition(ClientStates_1.CommState.ACTIVE);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.REJECTED:
                        this._transition(ClientStates_1.CommState.PENDING);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.RECALLED:
                        this._transition(ClientStates_1.CommState.PENDING);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTING:
                        this._transition(ClientStates_1.CommState.ACTIVE);
                        this._transition(ClientStates_1.CommState.PREEMPTING);
                        break;
                    case Message_1.ActionMsgs.Status.RECALLING:
                        this._transition(ClientStates_1.CommState.PENDING);
                        this._transition(ClientStates_1.CommState.RECALLING);
                        break;
                    default:
                        log.error('BUG: Got an unknown status from the ActionServer: status = ' + status.status);
                        break;
                }
                break;
            case ClientStates_1.CommState.PENDING:
                switch (status.status) {
                    case Message_1.ActionMsgs.Status.PENDING:
                        break;
                    case Message_1.ActionMsgs.Status.ACTIVE:
                        this._transition(ClientStates_1.CommState.ACTIVE);
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTED:
                        this._transition(ClientStates_1.CommState.ACTIVE);
                        this._transition(ClientStates_1.CommState.PREEMPTING);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.SUCCEEDED:
                        this._transition(ClientStates_1.CommState.ACTIVE);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.ABORTED:
                        this._transition(ClientStates_1.CommState.ACTIVE);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.REJECTED:
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.RECALLED:
                        this._transition(ClientStates_1.CommState.RECALLING);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTING:
                        this._transition(ClientStates_1.CommState.ACTIVE);
                        this._transition(ClientStates_1.CommState.PREEMPTING);
                        break;
                    case Message_1.ActionMsgs.Status.RECALLING:
                        this._transition(ClientStates_1.CommState.RECALLING);
                        break;
                    default:
                        log.error('BUG: Got an unknown status from the ActionServer: status = ' + status.status);
                        break;
                }
                break;
            case ClientStates_1.CommState.ACTIVE:
                switch (status.status) {
                    case Message_1.ActionMsgs.Status.PENDING:
                        log.error('Invalid transition from ACTIVE to PENDING');
                        break;
                    case Message_1.ActionMsgs.Status.REJECTED:
                        log.error('Invalid transition from ACTIVE to REJECTED');
                        break;
                    case Message_1.ActionMsgs.Status.RECALLED:
                        log.error('Invalid transition from ACTIVE to RECALLED');
                        break;
                    case Message_1.ActionMsgs.Status.RECALLING:
                        log.error('Invalid transition from ACTIVE to RECALLING');
                        break;
                    case Message_1.ActionMsgs.Status.ACTIVE:
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTED:
                        this._transition(ClientStates_1.CommState.PREEMPTING);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.SUCCEEDED:
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.ABORTED:
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTING:
                        this._transition(ClientStates_1.CommState.PREEMPTING);
                        break;
                    default:
                        log.error('BUG: Got an unknown status from the ActionServer: status = ' + status.status);
                        break;
                }
                break;
            case ClientStates_1.CommState.WAITING_FOR_RESULT:
                switch (status.status) {
                    case Message_1.ActionMsgs.Status.PENDING:
                        log.error('Invalid transition from WAITING_FOR_RESULT to PENDING');
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTING:
                        log.error('Invalid transition from WAITING_FOR_RESULT to PREEMPTING');
                        break;
                    case Message_1.ActionMsgs.Status.RECALLING:
                        log.error('Invalid transition from WAITING_FOR_RESULT to RECALLING');
                        break;
                    case Message_1.ActionMsgs.Status.ACTIVE:
                    case Message_1.ActionMsgs.Status.PREEMPTED:
                    case Message_1.ActionMsgs.Status.SUCCEEDED:
                    case Message_1.ActionMsgs.Status.ABORTED:
                    case Message_1.ActionMsgs.Status.REJECTED:
                    case Message_1.ActionMsgs.Status.RECALLED:
                        break;
                    default:
                        log.error('BUG: Got an unknown status from the ActionServer: status = ' + status.status);
                        break;
                }
                break;
            case ClientStates_1.CommState.WAITING_FOR_CANCEL_ACK:
                switch (status.status) {
                    case Message_1.ActionMsgs.Status.PENDING:
                    case Message_1.ActionMsgs.Status.ACTIVE:
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTED:
                    case Message_1.ActionMsgs.Status.SUCCEEDED:
                    case Message_1.ActionMsgs.Status.ABORTED:
                        this._transition(ClientStates_1.CommState.PREEMPTING);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.RECALLED:
                        this._transition(ClientStates_1.CommState.RECALLING);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                    case Message_1.ActionMsgs.Status.REJECTED:
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                    case Message_1.ActionMsgs.Status.PREEMPTING:
                        this._transition(ClientStates_1.CommState.PREEMPTING);
                        break;
                    case Message_1.ActionMsgs.Status.RECALLING:
                        this._transition(ClientStates_1.CommState.RECALLING);
                        break;
                    default:
                        log.error('BUG: Got an unknown status from the ActionServer: status = ' + status.status);
                        break;
                }
                break;
            case ClientStates_1.CommState.RECALLING:
                switch (status.status) {
                    case Message_1.ActionMsgs.Status.PENDING:
                        log.error('Invalid transition from RECALLING to PENDING');
                        break;
                    case Message_1.ActionMsgs.Status.ACTIVE:
                        log.error('Invalid transition from RECALLING to ACTIVE');
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTED:
                    case Message_1.ActionMsgs.Status.SUCCEEDED:
                    case Message_1.ActionMsgs.Status.ABORTED:
                        this._transition(ClientStates_1.CommState.PREEMPTING);
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.RECALLED:
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                    case Message_1.ActionMsgs.Status.REJECTED:
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                    case Message_1.ActionMsgs.Status.PREEMPTING:
                        this._transition(ClientStates_1.CommState.PREEMPTING);
                        break;
                    case Message_1.ActionMsgs.Status.RECALLING:
                        break;
                    default:
                        log.error('BUG: Got an unknown status from the ActionServer: status = ' + status.status);
                        break;
                }
                break;
            case ClientStates_1.CommState.PREEMPTING:
                switch (status.status) {
                    case Message_1.ActionMsgs.Status.PENDING:
                        log.error('Invalid transition from PREEMPTING to PENDING');
                        break;
                    case Message_1.ActionMsgs.Status.ACTIVE:
                        log.error('Invalid transition from PREEMPTING to ACTIVE');
                        break;
                    case Message_1.ActionMsgs.Status.REJECTED:
                        log.error('Invalid transition from PREEMPTING to REJECTED');
                    case Message_1.ActionMsgs.Status.RECALLING:
                        log.error('Invalid transition from PREEMPTING to RECALLING');
                        break;
                    case Message_1.ActionMsgs.Status.RECALLED:
                        log.error('Invalid transition from PREEMPTING to RECALLED');
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTED:
                    case Message_1.ActionMsgs.Status.SUCCEEDED:
                    case Message_1.ActionMsgs.Status.ABORTED:
                        this._transition(ClientStates_1.CommState.WAITING_FOR_RESULT);
                        break;
                    case Message_1.ActionMsgs.Status.PREEMPTING:
                        break;
                    default:
                        log.error('BUG: Got an unknown status from the ActionServer: status = ' + status.status);
                        break;
                }
                break;
            // actionlib has this case but we can't get here because we've already checked
            // DONE above and so Typescript complains about this case;
            // case CommState.DONE:
            //
            //   switch(status.status) {
            //     case ActionMsgs.Status.PENDING:
            //       log.error('Invalid transition from DONE to PENDING');
            //       break;
            //     case ActionMsgs.Status.ACTIVE:
            //       log.error('Invalid transition from DONE to ACTIVE');
            //       break;
            //     case ActionMsgs.Status.RECALLING:
            //       log.error('Invalid transition from DONE to RECALLING');
            //       break;
            //     case ActionMsgs.Status.PREEMPTING:
            //       log.error('Invalid transition from DONE to PREEMPTING');
            //       break;
            //     case ActionMsgs.Status.RECALLED:
            //     case ActionMsgs.Status.REJECTED:
            //     case ActionMsgs.Status.PREEMPTED:
            //     case ActionMsgs.Status.SUCCEEDED:
            //     case ActionMsgs.Status.ABORTED:
            //       break;
            //     default:
            //       log.error('BUG: Got an unknown status from the ActionServer: status = ' + status.status);
            //       break;
            //   }
            //   break;
            default:
                log.error('In a funny comm state: %s', this._state);
        }
    }
    _transition(newState) {
        log.debug('Trying to transition to %s', newState);
        this._state = newState;
        this.emit('transition');
    }
}
exports.default = ClientGoalHandle;
//# sourceMappingURL=ClientGoalHandle.js.map