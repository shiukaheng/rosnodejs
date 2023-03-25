import { ActionMsgs } from '../types/Message';
import { RosTime } from '../types/RosTypes';
export default class GoalHandle<G, F, R> {
    id: string;
    _as: any;
    _status: ActionMsgs.GoalStatus;
    _goal?: G;
    _destructionTime: RosTime;
    /**
     * goalId: An actionlib_msgs/GoalID.
     * actionServer: The ActionServer processing this goal
     * status: A number from actionlib_msgs/GoalStatus, like GoalStatuses.PENDING.
     * goal: The goal message, e.g., a FibonacciGoal. May be left undefined if
     *  this goal is used to represent a cancellation.
     */
    constructor(goalId: ActionMsgs.GoalID, actionServer: any, status: ActionMsgs.Status, goal?: G);
    getGoal(): G;
    getStatus(): ActionMsgs.GoalStatus;
    getStatusId(): ActionMsgs.Status;
    getGoalId(): ActionMsgs.GoalID;
    getGoalStatus(): ActionMsgs.GoalStatus;
    publishFeedback(feedback: F): void;
    _setStatus(status: ActionMsgs.Status, text?: string): void;
    _publishResult(result: R): void;
    setCanceled(result: R, text?: string): void;
    setCancelled(result: R, text?: string): void;
    setRejected(result: R, text?: string): void;
    setAccepted(text?: string): void;
    setAborted(result: R, text?: string): void;
    setSucceeded(result: R, text?: string): void;
    setCancelRequested(): boolean;
    _logInvalidTransition(transition: string, currentStatus: ActionMsgs.Status): void;
    _isTerminalState(): boolean;
}