"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionSpec = exports.SrvSpec = exports.MsgSpec = exports.RosMsgSpec = exports.create = exports.ACTION_ACTION_TYPE = exports.ACTION_ACTION_RESULT_TYPE = exports.ACTION_ACTION_FEEDBACK_TYPE = exports.ACTION_ACTION_GOAL_TYPE = exports.ACTION_RESULT_TYPE = exports.ACTION_FEEDBACK_TYPE = exports.ACTION_GOAL_TYPE = exports.ACTION_TYPE = exports.SRV_RESPONSE_TYPE = exports.SRV_REQUEST_TYPE = exports.SRV_TYPE = exports.MSG_TYPE = void 0;
const fs = require("fs");
const md5 = require("md5");
const fieldsUtil = require("./fields");
const fields_1 = require("./fields");
const IndentedWriter_1 = require("./IndentedWriter");
const MessageWriter = require("./MessageWriter");
const specCache = {};
const MSG_DIVIDER = '---';
exports.MSG_TYPE = 'msg';
exports.SRV_TYPE = 'srv';
exports.SRV_REQUEST_TYPE = 'srvRequest';
exports.SRV_RESPONSE_TYPE = 'srvResponse';
exports.ACTION_TYPE = 'action';
exports.ACTION_GOAL_TYPE = 'actionGoal';
exports.ACTION_FEEDBACK_TYPE = 'actionFeedback';
exports.ACTION_RESULT_TYPE = 'actionResult';
exports.ACTION_ACTION_GOAL_TYPE = 'actionGoal';
exports.ACTION_ACTION_FEEDBACK_TYPE = 'actionActionFeedback';
exports.ACTION_ACTION_RESULT_TYPE = 'actionActionResult';
exports.ACTION_ACTION_TYPE = 'actionAction';
function getFullMessageName(packageName, messageName) {
    return packageName + '/' + messageName;
}
function getPackageNameFromMessageType(messageType) {
    return messageType.indexOf('/') !== -1 ? messageType.split('/')[0]
        : '';
}
const isArrayRegex = /.*\[*\]$/;
function isArray(fieldType) {
    return (fieldType.match(isArrayRegex) !== null);
}
function getLengthOfArray(arrayType) {
    var match = arrayType.match(/.*\[(\d*)\]$/);
    if (match[1] === '') {
        return null;
    }
    return parseInt(match[1]);
}
function getBaseType(msgType) {
    if (isArray(msgType)) {
        const splits = msgType.split('[');
        return splits[0];
    }
    else {
        return msgType;
    }
}
function isHeader(type) {
    return (['Header', 'std_msgs/Header', 'roslib/Header'].indexOf(type) >= 0);
}
function create(msgCache, packageName, messageName, type, filePath = null) {
    switch (type) {
        case exports.SRV_TYPE:
            return new SrvSpec(msgCache, packageName, messageName, type, filePath);
        case exports.MSG_TYPE:
            return new MsgSpec(msgCache, packageName, messageName, type, filePath);
        case exports.ACTION_TYPE:
            return new ActionSpec(msgCache, packageName, messageName, type, filePath);
        default:
            throw new Error(`Unable to create message spec for type [${type}]`);
    }
}
exports.create = create;
/**
 * @class RosMsgSpec
 * Base class for message spec. Provides useful functionality on its own that is extended
 * by subclasses.
 */
class RosMsgSpec {
    constructor(msgCache, packageName, messageName, type, filePath = null) {
        this.fields = [];
        this.constants = [];
        this.msgCache = msgCache;
        this.messageName = messageName;
        this.packageName = packageName;
        this.type = type;
        this.fileContents = null;
    }
    /**
     * Query the cache for another message spec
     * @param type {string} full type of message to search for (e.g. sensor_msgs/Image)
     * @returns {RosMsgSpec}
     */
    getMsgSpecForType(type) {
        let spec = specCache[type];
        if (!spec) {
            spec = this.msgCache.getMessageSpec(type);
            specCache[type] = spec;
        }
        return spec;
    }
    /**
     * Tries to load and parse message file
     */
    loadFile(filePath = null, fileContents = null) {
        if (filePath !== null) {
            fileContents = this._loadMessageFile(filePath);
        }
        if (fileContents !== null) {
            this.fileContents = fileContents;
            this._parseMessage(fileContents);
        }
    }
    _parseMessage(f) {
        throw new Error('Unable to parse message in base class');
    }
    /**
     * Get full message name for this spec (e.g. sensor_msgs/String)
     */
    getFullMessageName() {
        return getFullMessageName(this.packageName, this.messageName);
    }
    /**
     * Get a unique list of other packages this spec depends on
     */
    getMessageDependencies(deps = new Set()) {
        const { packageName } = this;
        this.fields.forEach((field) => {
            const fieldPackage = getPackageNameFromMessageType(field.baseType);
            if (!field.isBuiltin && fieldPackage !== packageName) {
                if (field.isHeader) {
                    deps.add('std_msgs');
                }
                else {
                    deps.add(fieldPackage);
                }
            }
        });
        return deps;
    }
    /**
     * Reads file at specified location and returns its contents
     * @private
     */
    _loadMessageFile(fileName) {
        return fs.readFileSync(fileName, 'utf8');
    }
    /**
     * For this message spec, generates the text used to calculate the message's md5 sum
     * @returns {string}
     */
    getMd5text() {
        return '';
    }
    /**
     * Get the md5 sum of this message
     * @returns {string}
     */
    getMd5sum() {
        return md5(this.getMd5text());
    }
    /**
     * Generates a depth-first list of all dependencies of this message in field order.
     */
    getFullDependencies(deps = []) {
        return [];
    }
    getMessageFixedSize() {
        throw new Error('Unable to getMessageFixedSize on base class');
    }
    /**
     * Computes the full text of a message/service.
     * Necessary for rosbags.
     * Mirrors gentools.
     * See compute_full_text() in
     *   https://github.com/ros/ros/blob/kinetic-devel/core/roslib/src/roslib/gentools.py
     */
    computeFullText() {
        const w = new IndentedWriter_1.default();
        const deps = this.getFullDependencies();
        const sep = '='.repeat(80);
        w.write(this.fileContents.trim())
            .newline();
        deps.forEach((dep) => {
            w.write(sep)
                .write(`MSG: ${dep.getFullMessageName()}`)
                .write(dep.fileContents.trim())
                .newline();
        });
        return w.get().trim();
    }
}
exports.RosMsgSpec = RosMsgSpec;
/**
 * Subclass of RosMsgSpec
 * Implements logic for individual ros messages as well as separated parts of services and actions
 * (e.g. Request, Response, Goal, ActionResult, ...)
 * @class MsgSpec
 */
class MsgSpec extends RosMsgSpec {
    constructor(msgCache, packageName, messageName, type, filePath = null, fileContents = null) {
        super(msgCache, packageName, messageName, type, filePath);
        this.loadFile(filePath, fileContents);
    }
    /**
     * Parses through message definition for fields and constants
     */
    _parseMessage(content) {
        let lines = content.split('\n').map((line) => line.trim());
        try {
            lines.forEach(this._parseLine.bind(this));
        }
        catch (err) {
            console.error('Error while parsing message %s: %s', this.getFullMessageName(), err);
            throw err;
        }
    }
    /**
     * Given a line from the message file, parse it for useful contents
     * @private
     */
    _parseLine(line) {
        line = line.trim();
        const lineEqualIndex = line.indexOf('=');
        const lineCommentIndex = line.indexOf('#');
        // clear out comments if this line is not a constant
        // string constants include EVERYTHING after the equals
        if ((lineEqualIndex === -1 && lineCommentIndex !== -1)
            || lineEqualIndex > lineCommentIndex) {
            line = line.replace(/#.*/, '');
        }
        if (line !== '') {
            var firstSpace = line.indexOf(' '), fieldType = line.substring(0, firstSpace).trim(), field = line.substring(firstSpace + 1).trim(), equalIndex = field.indexOf('='), fieldName = field.trim();
            if (equalIndex !== -1) {
                fieldName = field.substring(0, equalIndex).trim();
                if (fieldType !== 'string') {
                    const commentIndex = field.indexOf('#');
                    if (commentIndex !== -1) {
                        field = field.substring(0, commentIndex).trim();
                    }
                }
                const constant = field.substring(equalIndex + 1, field.length).trim();
                const parsedConstant = fieldsUtil.parsePrimitive(fieldType, constant);
                this.constants.push({
                    name: fieldName,
                    type: fieldType,
                    value: parsedConstant,
                    stringValue: constant // include the string value for md5 text
                    ,
                    index: this.constants.length,
                    messageType: null
                });
            }
            else {
                // ROS lets you not include the package name if it's in the same package
                // e.g. in tutorial_msgs/MyMsg
                //    ComplexType fieldName  # this is assumed to be in tutorial_msgs
                // TODO: would ROS automatically search for fields in other packages if possible??
                //       we may need to support this...
                const baseType = getBaseType(fieldType);
                // if it's a header and isn't explicit, be explicit
                if (isHeader(baseType) && !getPackageNameFromMessageType(baseType)) {
                    fieldType = 'std_msgs/' + fieldType;
                }
                else if (!fieldsUtil.isPrimitive(baseType) && !getPackageNameFromMessageType(baseType)) {
                    fieldType = this.packageName + '/' + fieldType;
                }
                let f = new fields_1.Field(fieldName, fieldType);
                this.fields.push(f);
            }
        }
    }
    /**
     * Check if this message will have a fixed size regardless of its contents
     */
    isMessageFixedSize() {
        // Check if a particular message specification has a constant size in bytes
        const fields = this.fields;
        const types = fields.map((field) => { return field.baseType; });
        const variableLengthArrays = fields.map((field) => { return field.isArray && field.arrayLen === null; });
        const isBuiltin = fields.map((field) => { return field.isBuiltin; });
        if (types.indexOf('string') !== -1) {
            return false;
        }
        else if (variableLengthArrays.indexOf(true) !== -1) {
            return false;
        }
        else if (isBuiltin.indexOf(false) === -1) {
            return true;
        }
        else {
            const nonBuiltins = fields.filter((field) => { return !field.isBuiltin; });
            return nonBuiltins.every((field) => {
                const msgSpec = this.getMsgSpecForType(field.baseType);
                if (!msgSpec) {
                    throw new Error(`Unable to load spec for field [${field.baseType}]`);
                }
                return msgSpec.isMessageFixedSize();
            });
        }
    }
    /**
     * Calculates the fixed size of this message if it has a fixed size
     */
    getMessageFixedSize() {
        // Return the size of the message.
        // If the message does not have a fixed size, returns null
        if (!this.isMessageFixedSize()) {
            return null;
        }
        // else
        let length = 0;
        this.fields.forEach((field) => {
            if (field.isBuiltin) {
                const typeSize = fieldsUtil.getPrimitiveSize(field.baseType);
                if (typeSize === 0) {
                    throw new Error(`Field ${field.baseType} in message ${this.getFullMessageName()} has a non-constant size`);
                }
                if (!field.isArray) {
                    length += typeSize;
                }
                else if (field.arrayLen === null) {
                    throw new Error(`Array field ${field.baseType} in message ${this.getFullMessageName()} has a variable length`);
                }
                else {
                    length += field.arrayLen * typeSize;
                }
            }
            else {
                const msgSpec = this.getMsgSpecForType(field.baseType);
                if (!msgSpec) {
                    throw new Error(`Unable to load spec for field [${field.baseType}] in message ${this.getFullMessageName()}`);
                }
                const fieldSize = msgSpec.getMessageFixedSize();
                if (fieldSize === null) {
                    throw new Error(`Field ${field.baseType} in message ${this.getFullMessageName()} has a non-constant size`);
                }
                length += fieldSize;
            }
        });
        return length;
    }
    /**
     * Generates the text used to calculate this message's md5 sum
     */
    getMd5text() {
        let text = '';
        var constants = this.constants.map(function (constant) {
            // NOTE: use the string value of the constant from when we parsed it so that JS doesn't drop decimal precision
            // e.g. message has constant "float32 A_CONSTANT=1.0"
            //  here would turn into "float32 A_CONSTANT=1" if we used its parsed value
            return constant.type + ' ' + constant.name + '=' + constant.stringValue;
        }).join('\n');
        var fields = this.fields.map((field) => {
            if (field.isBuiltin) {
                return field.type + ' ' + field.name;
            }
            else {
                const spec = this.getMsgSpecForType(field.baseType);
                return spec.getMd5sum() + ' ' + field.name;
            }
        }).join('\n');
        text += constants;
        if (text.length > 0 && fields.length > 0) {
            text += "\n";
        }
        text += fields;
        return text;
    }
    /**
     * Generates text for message class file
     */
    generateMessageClassFile() {
        return MessageWriter.createMessageClass(this);
    }
    /**
     * Generates a depth-first list of all dependencies of this message in field order.
     * @param [deps] {Array}
     * @returns {Array}
     */
    getFullDependencies(deps = []) {
        this.fields.forEach((field) => {
            if (!field.isBuiltin) {
                const fieldSpec = this.getMsgSpecForType(field.baseType);
                if (deps.indexOf(fieldSpec) === -1) {
                    deps.push(fieldSpec);
                }
                fieldSpec.getFullDependencies(deps);
            }
        });
        return deps;
    }
}
exports.MsgSpec = MsgSpec;
/**
 * Subclass of RosMsgSpec
 * Implements logic for ros services. Creates MsgSpecs for request and response
 * @class SrvSpec
 */
class SrvSpec extends RosMsgSpec {
    constructor(msgCache, packageName, messageName, type, filePath = null) {
        super(msgCache, packageName, messageName, type, filePath);
        this.fileContents = this._loadMessageFile(filePath);
        const { req, resp } = this._extractMessageSections(this.fileContents);
        this.request = new MsgSpec(msgCache, packageName, messageName + 'Request', exports.SRV_REQUEST_TYPE, null, req);
        this.response = new MsgSpec(msgCache, packageName, messageName + 'Response', exports.SRV_RESPONSE_TYPE, null, resp);
    }
    /**
     * Takes a full service definition and pulls out the request and response sections
     * @param fileContents {string}
     * @returns {object}
     * @private
     */
    _extractMessageSections(fileContents) {
        let lines = fileContents.split('\n').map((line) => line.trim());
        const sections = {
            req: '',
            resp: ''
        };
        let currentSection = 'req';
        lines.forEach((line) => {
            if (line.startsWith(MSG_DIVIDER)) {
                currentSection = 'resp';
            }
            else {
                sections[currentSection] += `\n${line}`;
            }
        });
        return sections;
    }
    getMd5text() {
        return this.request.getMd5text() + this.response.getMd5text();
    }
    getMessageDependencies(deps = new Set()) {
        this.request.getMessageDependencies(deps);
        this.response.getMessageDependencies(deps);
        return deps;
    }
    /**
     * Generates text for service class file
     */
    generateMessageClassFile() {
        return MessageWriter.createServiceClass(this);
    }
}
exports.SrvSpec = SrvSpec;
/**
 * Subclass of RosMsgSpec
 * Implements logic for ROS actions which generate 7 messages from their definition.
 * Creates MsgSpecs for goal, result, feedback, action goal, action result, action feedback, and action
 * @class ActionSpec
 */
class ActionSpec extends RosMsgSpec {
    constructor(msgCache, packageName, messageName, type, filePath = null) {
        super(msgCache, packageName, messageName, type, filePath);
        this.fileContents = this._loadMessageFile(filePath);
        const { goal, result, feedback } = this._extractMessageSections(this.fileContents);
        // Parse the action definition into its 3 respective parts
        this.goal = new MsgSpec(msgCache, packageName, messageName + 'Goal', exports.ACTION_GOAL_TYPE, null, goal);
        this.result = new MsgSpec(msgCache, packageName, messageName + 'Result', exports.ACTION_RESULT_TYPE, null, result);
        this.feedback = new MsgSpec(msgCache, packageName, messageName + 'Feedback', exports.ACTION_FEEDBACK_TYPE, null, feedback);
        this.generateActionMessages();
    }
    /**
     * Takes a full service definition and pulls out the request and response sections
     * @param fileContents {string}
     * @returns {object}
     * @private
     */
    _extractMessageSections(fileContents) {
        let lines = fileContents.split('\n').map((line) => line.trim());
        const sections = {
            goal: '',
            result: '',
            feedback: ''
        };
        let currentSection = 'goal';
        lines.forEach((line) => {
            if (line.startsWith(MSG_DIVIDER)) {
                if (currentSection === 'goal') {
                    currentSection = 'result';
                }
                else if (currentSection === 'result') {
                    currentSection = 'feedback';
                }
                else {
                    throw new Error('Invalid action spec');
                }
            }
            else {
                sections[currentSection] += `\n${line}`;
            }
        });
        return sections;
    }
    /**
     * Get a list of all the message specs created by this ros action
     */
    getMessages() {
        return [this.goal, this.result, this.feedback, this.actionGoal,
            this.actionResult, this.actionFeedback, this.action];
    }
    /**
     * Creates the remaining 4 action messages
     */
    generateActionMessages() {
        this.generateActionGoalMessage();
        this.generateActionResultMessage();
        this.generateActionFeedbackMessage();
        this.generateActionMessage();
    }
    generateActionGoalMessage() {
        const goalMessage = MessageWriter.generateActionGoalMessage(this.getFullMessageName());
        this.actionGoal = new MsgSpec(this.msgCache, this.packageName, this.messageName + 'ActionGoal', exports.ACTION_ACTION_GOAL_TYPE, null, goalMessage);
    }
    generateActionResultMessage() {
        const resultMessage = MessageWriter.generateActionResultMessage(this.getFullMessageName());
        this.actionResult = new MsgSpec(this.msgCache, this.packageName, this.messageName + 'ActionResult', exports.ACTION_ACTION_RESULT_TYPE, null, resultMessage);
    }
    generateActionFeedbackMessage() {
        const feedbackMessage = MessageWriter.generateActionFeedbackMessage(this.getFullMessageName());
        this.actionFeedback = new MsgSpec(this.msgCache, this.packageName, this.messageName + 'ActionFeedback', exports.ACTION_ACTION_FEEDBACK_TYPE, null, feedbackMessage);
    }
    generateActionMessage() {
        const actionMessage = MessageWriter.generateActionMessage(this.getFullMessageName());
        this.action = new MsgSpec(this.msgCache, this.packageName, this.messageName + 'Action', exports.ACTION_ACTION_TYPE, null, actionMessage);
    }
    getMessageDependencies(deps = new Set()) {
        this.goal.getMessageDependencies(deps);
        this.result.getMessageDependencies(deps);
        this.feedback.getMessageDependencies(deps);
        this.actionGoal.getMessageDependencies(deps);
        this.actionResult.getMessageDependencies(deps);
        this.actionFeedback.getMessageDependencies(deps);
        this.action.getMessageDependencies(deps);
        return deps;
    }
}
exports.ActionSpec = ActionSpec;
//# sourceMappingURL=MessageSpec.js.map