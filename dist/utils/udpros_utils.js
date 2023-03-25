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
exports.serializeUdpHeader = exports.deserializeHeader = exports.createUdpRosError = exports.createPubHeader = exports.createSubHeader = void 0;
const ros_msg_utils = require("../ros_msg_utils/index");
const serialization_utils_1 = require("./serialization_utils");
const base_serializers = ros_msg_utils.Serialize;
//-----------------------------------------------------------------------
const callerIdPrefix = 'callerid=';
const md5Prefix = 'md5sum=';
const topicPrefix = 'topic=';
//const servicePrefix = 'service=';
const typePrefix = 'type=';
//const errorPrefix = 'error=';
const messageDefinitionPrefix = 'message_definition=';
//const latchingField = 'latching=1';
//const persistentField = 'persistent=1';
//const tcpNoDelayField = 'tcp_nodelay=1';
//-----------------------------------------------------------------------
function createSubHeader(callerId, md5sum, topic, type) {
    const fields = [
        callerIdPrefix + callerId,
        md5Prefix + md5sum,
        topicPrefix + topic,
        typePrefix + type,
    ];
    return serialization_utils_1.serializeStringFields(fields);
}
exports.createSubHeader = createSubHeader;
function createPubHeader(callerId, md5sum, type, messageDefinition) {
    const fields = [
        callerIdPrefix + callerId,
        md5Prefix + md5sum,
        typePrefix + type,
        messageDefinitionPrefix + messageDefinition
    ];
    return serialization_utils_1.serializeStringFields(fields);
}
exports.createPubHeader = createPubHeader;
function createUdpRosError(str) {
    return serialization_utils_1.serializeString(`{errorPrefix}${str}`);
}
exports.createUdpRosError = createUdpRosError;
function deserializeHeader(buff) {
    if (buff.length < 8) {
        return undefined;
    }
    let connectionId = buff.readUInt32LE(0);
    let opCode = buff.readUInt8(4);
    let msgId = buff.readUInt8(5);
    let blkN = buff.readUInt16LE(6);
    return {
        connectionId,
        opCode,
        msgId,
        blkN
    };
}
exports.deserializeHeader = deserializeHeader;
function serializeUdpHeader(connectionId, opCode, msgId, blkN) {
    const buf = Buffer.allocUnsafe(8);
    base_serializers.uint32(connectionId, buf, 0);
    base_serializers.uint8(opCode, buf, 4);
    base_serializers.uint8(msgId, buf, 5);
    base_serializers.uint16(blkN, buf, 6);
    return buf;
}
exports.serializeUdpHeader = serializeUdpHeader;
//# sourceMappingURL=udpros_utils.js.map