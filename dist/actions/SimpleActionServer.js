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
const ActionServer_1 = require("./ActionServer");
const Ultron = require("ultron");
const events_1 = require("events");
const Time_1 = require("../lib/Time");
const LoggingManager_1 = require("../lib/LoggingManager");
const log = LoggingManager_1.default.getLogger('actionlib_nodejs');
const ThisNode_1 = require("../lib/ThisNode");
const Message_1 = require("../types/Message");
class SimpleActionServer extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._currentGoal = null;
        this._nextGoal = null;
        this._preemptRequested = false;
        this._newGoalPreemptRequest = false;
        this._shutdown = false;
        this._as = new ActionServer_1.default(options);
        this._executeCallback = options.executeCallback;
        this._ultron = new Ultron(ThisNode_1.default);
    }
    start() {
        this._as.start();
        this._as.on('goal', this._handleGoal.bind(this));
        this._as.on('cancel', this._handleCancel.bind(this));
        if (this._executeCallback) {
            this._runExecuteLoop();
        }
        // FIXME: how to handle shutdown? Should user be responsible?
        // should we check for shutdown in interval instead of listening
        // to events here?
        this._ultron.once('shutdown', () => { this.shutdown(); });
    }
    isActive() {
        if (this._currentGoal) {
            const status = this._currentGoal.getStatusId();
            return status === Message_1.ActionMsgs.Status.ACTIVE || status === Message_1.ActionMsgs.Status.PREEMPTING;
        }
        return false;
    }
    isNewGoalAvailable() {
        return !!this._nextGoal;
    }
    isPreemptRequested() {
        return this._preemptRequested;
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._shutdown) {
                this._shutdown = true;
                this.removeAllListeners();
                this._currentGoal = null;
                this._nextGoal = null;
                clearTimeout(this._executeLoopTimer);
                this._ultron.destroy();
                this._ultron = null;
                return this._as.shutdown();
            }
        });
    }
    acceptNewGoal() {
        if (!this._nextGoal) {
            log.error('Attempting to accept the next goal when a new goal is not available');
            return;
        }
        if (this.isActive()) {
            const result = this._as._createMessage('result');
            this._currentGoal.setCancelled(result, 'This goal was canceled because another goal was received by the simple action server');
        }
        this._currentGoal = this._nextGoal;
        this._nextGoal = null;
        this._preemptRequested = this._newGoalPreemptRequest;
        this._newGoalPreemptRequest = false;
        this._currentGoal.setAccepted('This goal has been accepted by the simple action server');
        return this._currentGoal;
    }
    publishFeedback(feedback) {
        if (this._currentGoal) {
            this._currentGoal.publishFeedback(feedback);
        }
    }
    setAborted(result, text) {
        if (this._currentGoal) {
            if (!result) {
                result = this._as._createMessage('result');
            }
            this._currentGoal.setAborted(result, text);
        }
    }
    setPreempted(result, text) {
        if (this._currentGoal) {
            if (!result) {
                result = this._as._createMessage('result');
            }
            this._currentGoal.setCanceled(result, text);
        }
    }
    setSucceeded(result, text) {
        if (this._currentGoal) {
            if (!result) {
                result = this._as._createMessage('result');
            }
            this._currentGoal.setSucceeded(result, text);
        }
    }
    _handleGoal(newGoal) {
        const hasGoal = this.isActive();
        let acceptGoal = false;
        if (!hasGoal) {
            acceptGoal = true;
        }
        else {
            let stamp = this._nextGoal ? this._nextGoal.getGoalId().stamp
                : this._currentGoal.getGoalId().stamp;
            let newStamp = newGoal.getGoalId().stamp;
            acceptGoal = Time_1.default.timeComp(stamp, newStamp) <= 0;
        }
        if (acceptGoal) {
            if (this._nextGoal) {
                const result = this._as._createMessage('result');
                this._nextGoal.setCancelled(result, 'This goal was canceled because another goal was received by the simple action server');
            }
            this._nextGoal = newGoal;
            this._newGoalPreemptRequest = false;
            if (hasGoal) {
                this._preemptRequested = true;
                this.emit('preempt');
            }
            this.emit('goal');
        }
        else {
            // FIXME: make debug
            log.warn('Not accepting new goal');
        }
    }
    _handleCancel(goal) {
        if (this._currentGoal && this._currentGoal.id === goal.id) {
            this._preemptRequested = true;
            this.emit('preempt');
        }
        else if (this._nextGoal && this._nextGoal.id === goal.id) {
            this._newGoalPreemptRequest = true;
        }
    }
    _runExecuteLoop(timeoutMs = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            while (!this._shutdown) {
                log.infoThrottle(1000, 'execute loop');
                if (this.isActive()) {
                    log.error('Should never reach this code with an active goal!');
                }
                else if (this.isNewGoalAvailable()) {
                    const goal = this.acceptNewGoal();
                    yield this._executeCallback(goal);
                    if (this.isActive()) {
                        log.warn('%s\n%s\n%s', 'Your executeCallback did not set the goal to a terminate status', 'This is a bug in your ActionServer implementation. Fix your code!', 'For now, the ActionServer will set this goal to aborted');
                        this.setAborted(this._as._createMessage('result'), 'This goal was aborted by the simple action server. The user should have set a terminal status on this goal and did not');
                    }
                    yield sleep(0);
                }
                else {
                    yield sleep(timeoutMs);
                }
            }
        });
    }
}
exports.default = SimpleActionServer;
function sleep(timeout) {
    return new Promise(r => setTimeout(r, timeout));
}
//# sourceMappingURL=SimpleActionServer.js.map