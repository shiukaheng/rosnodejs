import { Field } from './fields';
export declare const MSG_TYPE = "msg";
export declare const SRV_TYPE = "srv";
export declare const SRV_REQUEST_TYPE = "srvRequest";
export declare const SRV_RESPONSE_TYPE = "srvResponse";
export declare const ACTION_TYPE = "action";
export declare const ACTION_GOAL_TYPE = "actionGoal";
export declare const ACTION_FEEDBACK_TYPE = "actionFeedback";
export declare const ACTION_RESULT_TYPE = "actionResult";
export declare const ACTION_ACTION_GOAL_TYPE = "actionGoal";
export declare const ACTION_ACTION_FEEDBACK_TYPE = "actionActionFeedback";
export declare const ACTION_ACTION_RESULT_TYPE = "actionActionResult";
export declare const ACTION_ACTION_TYPE = "actionAction";
declare type Constant = {
    name: string;
    type: string;
    value: any;
    stringValue: string;
    index: number;
    messageType: any;
};
/**
 * Given a type of message, returns the correct subclass of RosMsgSpec
 */
export declare function create(msgCache: any, packageName: string, messageName: string, type: 'msg', filePath: string | null): MsgSpec;
export declare function create(msgCache: any, packageName: string, messageName: string, type: 'srv', filePath: string | null): SrvSpec;
export declare function create(msgCache: any, packageName: string, messageName: string, type: 'action', filePath: string | null): ActionSpec;
/**
 * @class RosMsgSpec
 * Base class for message spec. Provides useful functionality on its own that is extended
 * by subclasses.
 */
export declare class RosMsgSpec {
    msgCache: any;
    packageName: string;
    messageName: string;
    type: string;
    fileContents: string | null;
    fields: Field[];
    constants: Constant[];
    constructor(msgCache: any, packageName: string, messageName: string, type: string, filePath?: string | null);
    /**
     * Query the cache for another message spec
     * @param type {string} full type of message to search for (e.g. sensor_msgs/Image)
     * @returns {RosMsgSpec}
     */
    getMsgSpecForType(type: string): RosMsgSpec;
    /**
     * Tries to load and parse message file
     */
    loadFile(filePath?: string | null, fileContents?: string | null): void;
    protected _parseMessage(f: string): void;
    /**
     * Get full message name for this spec (e.g. sensor_msgs/String)
     */
    getFullMessageName(): string;
    /**
     * Get a unique list of other packages this spec depends on
     */
    getMessageDependencies(deps?: Set<string>): Set<string>;
    /**
     * Reads file at specified location and returns its contents
     * @private
     */
    _loadMessageFile(fileName: string): string;
    /**
     * For this message spec, generates the text used to calculate the message's md5 sum
     * @returns {string}
     */
    getMd5text(): string;
    /**
     * Get the md5 sum of this message
     * @returns {string}
     */
    getMd5sum(): string;
    /**
     * Generates a depth-first list of all dependencies of this message in field order.
     */
    getFullDependencies(deps?: RosMsgSpec[]): RosMsgSpec[];
    getMessageFixedSize(): number;
    /**
     * Computes the full text of a message/service.
     * Necessary for rosbags.
     * Mirrors gentools.
     * See compute_full_text() in
     *   https://github.com/ros/ros/blob/kinetic-devel/core/roslib/src/roslib/gentools.py
     */
    computeFullText(): string;
}
/**
 * Subclass of RosMsgSpec
 * Implements logic for individual ros messages as well as separated parts of services and actions
 * (e.g. Request, Response, Goal, ActionResult, ...)
 * @class MsgSpec
 */
export declare class MsgSpec extends RosMsgSpec {
    constructor(msgCache: any, packageName: string, messageName: string, type: string, filePath?: string | null, fileContents?: string | null);
    /**
     * Parses through message definition for fields and constants
     */
    protected _parseMessage(content: string): void;
    /**
     * Given a line from the message file, parse it for useful contents
     * @private
     */
    private _parseLine;
    /**
     * Check if this message will have a fixed size regardless of its contents
     */
    isMessageFixedSize(): boolean;
    /**
     * Calculates the fixed size of this message if it has a fixed size
     */
    getMessageFixedSize(): number | null;
    /**
     * Generates the text used to calculate this message's md5 sum
     */
    getMd5text(): string;
    /**
     * Generates text for message class file
     */
    generateMessageClassFile(): string;
    /**
     * Generates a depth-first list of all dependencies of this message in field order.
     * @param [deps] {Array}
     * @returns {Array}
     */
    getFullDependencies(deps?: RosMsgSpec[]): RosMsgSpec[];
}
/**
 * Subclass of RosMsgSpec
 * Implements logic for ros services. Creates MsgSpecs for request and response
 * @class SrvSpec
 */
export declare class SrvSpec extends RosMsgSpec {
    request: MsgSpec;
    response: MsgSpec;
    constructor(msgCache: any, packageName: string, messageName: string, type: string, filePath?: string | null);
    /**
     * Takes a full service definition and pulls out the request and response sections
     * @param fileContents {string}
     * @returns {object}
     * @private
     */
    _extractMessageSections(fileContents: string): {
        req: string;
        resp: string;
    };
    getMd5text(): string;
    getMessageDependencies(deps?: Set<string>): Set<string>;
    /**
     * Generates text for service class file
     */
    generateMessageClassFile(): string;
}
/**
 * Subclass of RosMsgSpec
 * Implements logic for ROS actions which generate 7 messages from their definition.
 * Creates MsgSpecs for goal, result, feedback, action goal, action result, action feedback, and action
 * @class ActionSpec
 */
export declare class ActionSpec extends RosMsgSpec {
    goal: MsgSpec;
    result: MsgSpec;
    feedback: MsgSpec;
    actionGoal: MsgSpec;
    actionResult: MsgSpec;
    actionFeedback: MsgSpec;
    action: MsgSpec;
    constructor(msgCache: any, packageName: string, messageName: string, type: string, filePath?: string | null);
    /**
     * Takes a full service definition and pulls out the request and response sections
     * @param fileContents {string}
     * @returns {object}
     * @private
     */
    _extractMessageSections(fileContents: string): {
        goal: string;
        result: string;
        feedback: string;
    };
    /**
     * Get a list of all the message specs created by this ros action
     */
    getMessages(): MsgSpec[];
    /**
     * Creates the remaining 4 action messages
     */
    generateActionMessages(): void;
    generateActionGoalMessage(): void;
    generateActionResultMessage(): void;
    generateActionFeedbackMessage(): void;
    generateActionMessage(): void;
    getMessageDependencies(deps?: Set<string>): Set<string>;
}
export {};