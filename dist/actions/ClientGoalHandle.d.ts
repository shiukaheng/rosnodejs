/// <reference types="node" />
import { CommState } from './ClientStates';
import { EventEmitter } from 'events';
import { ActionMsgs } from '../types/Message';
import type ActionClientInterface from '../lib/ActionClientInterface';
export default class ClientGoalHandle<G, F, R> extends EventEmitter {
    private _clientInterface;
    private _state;
    private _goalStatus;
    private _result;
    private _goal;
    private _active;
    constructor(actionGoal: ActionMsgs.ActionGoal<G>, actionClientInterface: ActionClientInterface<G, F, R>);
    reset(): void;
    getGoalStatus(): ActionMsgs.GoalStatus;
    resend(): void;
    cancel(): void;
    getResult(): R;
    getTerminalState(): ActionMsgs.Status.PREEMPTED | ActionMsgs.Status.SUCCEEDED | ActionMsgs.Status.ABORTED | ActionMsgs.Status.REJECTED | ActionMsgs.Status.RECALLED | ActionMsgs.Status.LOST | ActionMsgs.Status.LOST;
    getCommState(): CommState;
    isExpired(): boolean;
    updateFeedback(feedback: ActionMsgs.ActionFeedback<F>): void;
    updateResult(actionResult: ActionMsgs.ActionResult<R>): void;
    updateStatus(status: ActionMsgs.GoalStatus): void;
    _transition(newState: CommState): void;
}