/// <reference types="node" />
import ActionServer, { ActionServerOptions } from './ActionServer';
import Ultron = require('ultron');
import { EventEmitter } from 'events';
import type GoalHandle from './GoalHandle';
declare type ExecuteCb<G, F, R> = (g: GoalHandle<G, F, R>) => Promise<void>;
interface SimpleActionServerOptions<G, F, R> extends ActionServerOptions {
    executeCallback?: ExecuteCb<G, F, R>;
}
export default class SimpleActionServer<G, F, R> extends EventEmitter {
    _as: ActionServer<G, F, R>;
    _currentGoal: GoalHandle<G, F, R> | null;
    _nextGoal: GoalHandle<G, F, R> | null;
    _preemptRequested: boolean;
    _newGoalPreemptRequest: boolean;
    _shutdown: boolean;
    _ultron: Ultron;
    _executeCallback?: ExecuteCb<G, F, R>;
    _executeLoopTimer?: NodeJS.Timer;
    constructor(options: SimpleActionServerOptions<G, F, R>);
    start(): void;
    isActive(): boolean;
    isNewGoalAvailable(): boolean;
    isPreemptRequested(): boolean;
    shutdown(): Promise<void>;
    acceptNewGoal(): GoalHandle<G, F, R> | undefined;
    publishFeedback(feedback: F): void;
    setAborted(result?: R, text?: string): void;
    setPreempted(result?: R, text?: string): void;
    setSucceeded(result?: R, text?: string): void;
    _handleGoal(newGoal: GoalHandle<G, F, R>): void;
    _handleCancel(goal: GoalHandle<G, F, R>): void;
    _runExecuteLoop(timeoutMs?: number): Promise<void>;
}
export {};
