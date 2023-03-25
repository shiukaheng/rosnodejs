/// <reference types="node" />
import { ActionClientInterfaceOptions } from '../lib/ActionClientInterface';
import { EventEmitter } from 'events';
import ClientGoalHandle from './ClientGoalHandle';
import { ActionMsgs } from '../types/Message';
import { RosTime } from '../types/RosTypes';
/**
 * @class ActionClient
 * EXPERIMENTAL
 *
 */
export default class ActionClient<G, F, R> extends EventEmitter {
    private _acInterface;
    private _goalLookup;
    private _shutdown;
    private _ultron;
    private _messageTypes;
    constructor(options: ActionClientInterfaceOptions);
    shutdown(): Promise<void>;
    sendGoal(goal: G, transitionCb?: () => void, feedbackCb?: (f: F) => void): ClientGoalHandle<G, F, R>;
    cancelAllGoals(): void;
    cancelGoalsAtAndBeforeTime(stamp: RosTime): void;
    waitForActionServerToStart(timeout: number): Promise<boolean>;
    isServerConnected(): boolean;
    _handleStatus(msg: ActionMsgs.GoalStatusArray): void;
    _handleFeedback(msg: ActionMsgs.ActionFeedback<F>): void;
    _handleResult(msg: ActionMsgs.ActionResult<R>): void;
}