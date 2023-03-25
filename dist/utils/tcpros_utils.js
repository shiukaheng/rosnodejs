"use strict";
/*
 *    Copyright 2016 Rethink Robotics
 *
 *    Copyright 2016 Chris Smith
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
exports.createTcpRosError = exports.deserializeMessage = exports.serializeServiceResponse = exports.serializeMessage = exports.validateServiceClientHeader = exports.validatePubHeader = exports.validateSubHeader = exports.parseTcpRosHeader = exports.createServiceServerHeader = exports.createServiceClientHeader = exports.createPubHeader = exports.createSubHeader = void 0;
const ros_msg_utils = require("../ros_msg_utils/index");
const serialization_utils_1 = require("./serialization_utils");
const base_serializers = ros_msg_utils.Serialize;
const base_deserializers = ros_msg_utils.Deserialize;
//-----------------------------------------------------------------------
const callerIdPrefix = 'callerid=';
const md5Prefix = 'md5sum=';
const topicPrefix = 'topic=';
const servicePrefix = 'service=';
const typePrefix = 'type=';
const errorPrefix = 'error=';
const messageDefinitionPrefix = 'message_definition=';
const latchingField = 'latching=1';
const persistentField = 'persistent=1';
const tcpNoDelayField = 'tcp_nodelay=1';
//-----------------------------------------------------------------------
/**
 * NOTE for general questions see
 * http://wiki.ros.org/ROS/TCPROS
 */
function createSubHeader(callerId, md5sum, topic, type, messageDefinition, tcpNoDelay) {
    const fields = [
        callerIdPrefix + callerId,
        md5Prefix + md5sum,
        topicPrefix + topic,
        typePrefix + type,
        messageDefinitionPrefix + messageDefinition
    ];
    if (tcpNoDelay) {
        fields.push(tcpNoDelayField);
    }
    return serialization_utils_1.serializeStringFields(fields);
}
exports.createSubHeader = createSubHeader;
function createPubHeader(callerId, md5sum, type, latching, messageDefinition) {
    const fields = [
        callerIdPrefix + callerId,
        md5Prefix + md5sum,
        typePrefix + type,
        messageDefinitionPrefix + messageDefinition
    ];
    if (latching) {
        fields.push(latchingField);
    }
    return serialization_utils_1.serializeStringFields(fields);
}
exports.createPubHeader = createPubHeader;
function createServiceClientHeader(callerId, service, md5sum, type, persistent) {
    const fields = [
        callerIdPrefix + callerId,
        servicePrefix + service,
        md5Prefix + md5sum,
    ];
    if (persistent) {
        fields.push(persistentField);
    }
    return serialization_utils_1.serializeStringFields(fields);
}
exports.createServiceClientHeader = createServiceClientHeader;
function createServiceServerHeader(callerId, md5sum, type) {
    const fields = [
        callerIdPrefix + callerId,
        md5Prefix + md5sum,
        typePrefix + type
    ];
    return serialization_utils_1.serializeStringFields(fields);
}
exports.createServiceServerHeader = createServiceServerHeader;
function parseTcpRosHeader(header) {
    let info = {};
    const fields = serialization_utils_1.deserializeStringFields(header);
    for (const field of fields) {
        let matchResult = field.match(/^(\w+)=([\s\S]+)/);
        // invalid connection header
        if (!matchResult) {
            console.error('Invalid connection header while parsing field %s', field);
            return null;
        }
        // else
        info[matchResult[1]] = matchResult[2];
    }
    return info;
}
exports.parseTcpRosHeader = parseTcpRosHeader;
function validateSubHeader(header, topic, type, md5sum) {
    if (!header.hasOwnProperty('topic')) {
        return serialization_utils_1.serializeString('Connection header missing expected field [topic]');
    }
    else if (!header.hasOwnProperty('type')) {
        return serialization_utils_1.serializeString('Connection header missing expected field [type]');
    }
    else if (!header.hasOwnProperty('md5sum')) {
        return serialization_utils_1.serializeString('Connection header missing expected field [md5sum]');
    }
    else if (header.topic !== topic) {
        return serialization_utils_1.serializeString('Got incorrect topic [' + header.topic + '] expected [' + topic + ']');
    }
    // rostopic will send '*' for some commands (hz)
    else if (header.type !== type && header.type !== '*') {
        return serialization_utils_1.serializeString('Got incorrect message type [' + header.type + '] expected [' + type + ']');
    }
    else if (header.md5sum !== md5sum && header.md5sum !== '*') {
        return serialization_utils_1.serializeString('Got incorrect md5sum [' + header.md5sum + '] expected [' + md5sum + ']');
    }
    // else
    return null;
}
exports.validateSubHeader = validateSubHeader;
function validatePubHeader(header, type, md5sum) {
    if (!header.hasOwnProperty('type')) {
        return serialization_utils_1.serializeString('Connection header missing expected field [type]');
    }
    else if (!header.hasOwnProperty('md5sum')) {
        return serialization_utils_1.serializeString('Connection header missing expected field [md5sum]');
    }
    /* Note that we are not checking the type of the incoming message against the type specified during
       susbscription. If we did, then this would break subscriptions to the `/tf` topic, where messages
       can be either tf/tfMessage (gazebo) or tf2_msgs/TFMessage (everywhere else), even though their md5 and
       type definitions are actually the same. This is in-line with rospy, where the type isn't checked either:
       https://github.com/ros/ros_comm/blob/6292d54dc14395531bffb2e165f3954fb0ef2c34/clients/rospy/src/rospy/impl/tcpros_pubsub.py#L332-L336
    */
    else if (header.md5sum !== md5sum && header.md5sum !== '*') {
        return serialization_utils_1.serializeString('Got incorrect md5sum [' + header.md5sum + '] expected [' + md5sum + ']');
    }
    // else
    return null;
}
exports.validatePubHeader = validatePubHeader;
function validateServiceClientHeader(header, service, md5sum) {
    if (!header.hasOwnProperty('service')) {
        return 'Connection header missing expected field [service]';
    }
    else if (!header.hasOwnProperty('md5sum')) {
        return 'Connection header missing expected field [md5sum]';
    }
    else if (header.service !== service) {
        return 'Got incorrect service [' + header.service + '] expected [' + service + ']';
    }
    else if (header.md5sum !== md5sum && header.md5sum !== '*') {
        return 'Got incorrect md5sum [' + header.md5sum + '] expected [' + md5sum + ']';
    }
}
exports.validateServiceClientHeader = validateServiceClientHeader;
function serializeMessage(MessageClass, message, prependMessageLength = true) {
    const msgSize = MessageClass.getMessageSize(message);
    let msgBuffer;
    let offset = 0;
    if (prependMessageLength) {
        msgBuffer = Buffer.allocUnsafe(msgSize + 4);
        offset = base_serializers.uint32(msgSize, msgBuffer, 0);
    }
    else {
        msgBuffer = Buffer.allocUnsafe(msgSize);
    }
    MessageClass.serialize(message, msgBuffer, offset);
    return msgBuffer;
}
exports.serializeMessage = serializeMessage;
function serializeServiceResponse(ResponseClass, response, success, prependResponseInfo = true) {
    let responseBuffer;
    if (prependResponseInfo) {
        if (success) {
            const respSize = ResponseClass.getMessageSize(response);
            responseBuffer = Buffer.allocUnsafe(respSize + 5);
            // add the success byte
            base_serializers.uint8(1, responseBuffer, 0);
            // add the message length
            base_serializers.uint32(respSize, responseBuffer, 1);
            ResponseClass.serialize(response, responseBuffer, 5);
        }
        else {
            const errorMessage = 'Unable to handle service call';
            const errLen = errorMessage.length;
            // FIXME: check that we don't need the extra 4 byte message len here
            responseBuffer = Buffer.allocUnsafe(5 + errLen);
            base_serializers.uint8(0, responseBuffer, 0);
            base_serializers.string(errorMessage, responseBuffer, 1);
        }
    }
    else {
        responseBuffer = Buffer.allocUnsafe(ResponseClass.getMessageSize(response));
    }
    return responseBuffer;
}
exports.serializeServiceResponse = serializeServiceResponse;
function deserializeMessage(MessageClass, messageBuffer) {
    return MessageClass.deserialize(messageBuffer, [0]);
}
exports.deserializeMessage = deserializeMessage;
function createTcpRosError(str) {
    return serialization_utils_1.serializeString(`{errorPrefix}${str}`);
}
exports.createTcpRosError = createTcpRosError;
//# sourceMappingURL=tcpros_utils.js.map