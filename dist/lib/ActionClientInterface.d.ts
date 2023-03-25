/// <reference types="node" />
import { EventEmitter } from 'events';
import { RosTime } from '../types/RosTypes';
import { INodeHandle, AdvertiseOptions, SubscribeOptions } from '../types/NodeHandle';
import { ActionMsgs } from '../types/Message';
export declare type ActionClientInterfaceOptions = {
    type: string;
    actionServer: string;
    nh: INodeHandle;
    goal?: AdvertiseOptions;
    cancel?: AdvertiseOptions;
    status?: SubscribeOptions;
    feedback?: SubscribeOptions;
    result?: SubscribeOptions;
};
export default class ActionClientInterface<G, F, R> extends EventEmitter {
    private _actionType;
    private _actionServer;
    private _goalPub;
    private _cancelPub;
    private _statusSub;
    private _feedbackSub;
    private _resultSub;
    private _hasStatus;
    private _nh;
    constructor(options: ActionClientInterfaceOptions);
    getType(): string;
    /**
     * Cancel the given goal. If none is given, send an empty goal message,
     * i.e. cancel all goals. See
     * http://wiki.ros.org/actionlib/DetailedDescription#The_Messages
     * @param [goalId] {string} id of the goal to cancel
     */
    cancel(goalId: string, stamp?: RosTime | null): void;
    sendGoal(goal: ActionMsgs.ActionGoal<G>): void;
    waitForActionServerToStart(timeoutMs: number): Promise<boolean>;
    generateGoalId(now: RosTime): string;
    isServerConnected(): boolean;
    /**
     * Shuts down this ActionClient. It shuts down publishers, subscriptions
     * and removes all attached event listeners.
     * @returns {Promise}
     */
    shutdown(): Promise<void>;
    private _handleStatus;
    private _handleFeedback;
    private _handleResult;
}
