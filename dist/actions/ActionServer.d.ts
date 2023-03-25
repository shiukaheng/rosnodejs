/// <reference types="node" />
import { EventEmitter } from 'events';
import Ultron = require('ultron');
import ActionServerInterface, { ActionServerInterfaceOptions } from '../lib/ActionServerInterface';
import GoalHandle from './GoalHandle';
import { ActionConstructor, ActionMsgs } from '../types/Message';
import { RosTime } from '../types/RosTypes';
export interface ActionServerOptions extends ActionServerInterfaceOptions {
    statusFrequency?: number;
}
/**
 * @class ActionServer
 * EXPERIMENTAL
 *
 */
export default class ActionServer<G, F, R> extends EventEmitter {
    _options: ActionServerOptions;
    _pubSeqs: {
        result: number;
        feedback: number;
        status: number;
    };
    _goalHandleList: GoalHandle<G, F, R>[];
    _goalHandleCache: {
        [key: string]: GoalHandle<G, F, R>;
    };
    _lastCancelStamp: RosTime;
    _statusListTimeout: RosTime;
    _shutdown: boolean;
    _started: boolean;
    _ultron: Ultron;
    _asInterface: ActionServerInterface<G, F, R>;
    _messageTypes: MessageLookup<G, F, R>;
    _statusFreqInt?: NodeJS.Timer;
    constructor(options: ActionServerOptions);
    start(): void;
    generateGoalId(): ActionMsgs.GoalID;
    shutdown(): Promise<void>;
    _getGoalHandle(id: string): GoalHandle<G, F, R>;
    _handleGoal(msg: ActionMsgs.ActionGoal<G>): void;
    _handleCancel(msg: ActionMsgs.GoalID): void;
    publishResult(status: ActionMsgs.GoalStatus, result: R): void;
    publishFeedback(status: ActionMsgs.GoalStatus, feedback: F): void;
    publishStatus(): void;
    _getAndIncrementSeq(type: 'result' | 'feedback' | 'status'): number;
    _createMessage(type: keyof MessageLookup<G, F, R>, args?: {}): F | R | ActionMsgs.ActionResult<R> | ActionMsgs.ActionFeedback<F>;
}
declare type MessageLookup<G, F, R> = {
    result: ActionConstructor<G, F, R>['Result'];
    feedback: ActionConstructor<G, F, R>['Feedback'];
    actionResult: ActionConstructor<G, F, R>['ActionResult'];
    actionFeedback: ActionConstructor<G, F, R>['ActionFeedback'];
};
export {};