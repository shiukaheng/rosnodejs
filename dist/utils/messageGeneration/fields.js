"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitMessageType = exports.getPackageNameFromMessageType = exports.getMessageNameFromMessageType = exports.getMessageSize = exports.getArraySize = exports.getPrimitiveSize = exports.deserializePrimitive = exports.serializePrimitive = exports.parsePrimitive = exports.Field = exports.getLengthOfArray = exports.getTypeOfArray = exports.isMessage = exports.isArray = exports.isPrimitive = exports.isInteger = exports.isFloat = exports.isBool = exports.isTime = exports.isString = exports.getDefaultValue = exports.primitiveTypes = void 0;
const base_serialize_1 = require("../../ros_msg_utils/lib/base_serialize");
const base_deserialize_1 = require("../../ros_msg_utils/lib/base_deserialize");
const BN = require("bn.js");
/* map of all primitive types and their default values */
var map = {
    'char': 0,
    'byte': 0,
    'bool': false,
    'int8': 0,
    'uint8': 0,
    'int16': 0,
    'uint16': 0,
    'int32': 0,
    'uint32': 0,
    'int64': 0,
    'uint64': 0,
    'float32': 0,
    'float64': 0,
    'string': '',
    'time': { secs: 0, nsecs: 0 },
    'duration': { secs: 0, nsecs: 0 }
};
exports.primitiveTypes = Object.keys(map);
function getDefaultValue(type) {
    let match = type.match(/(.*)\[(\d*)\]/);
    if (match) {
        // it's an array
        const basetype = match[1];
        const length = (match[2].length > 0 ? parseInt(match[2]) : 0);
        return new Array(length).fill(getDefaultValue(basetype));
    }
    else {
        return map[type];
    }
}
exports.getDefaultValue = getDefaultValue;
;
function isString(type) {
    return type === 'string';
}
exports.isString = isString;
function isTime(type) {
    return type === 'time' || type === 'duration';
}
exports.isTime = isTime;
function isBool(type) {
    return type === 'bool';
}
exports.isBool = isBool;
function isFloat(type) {
    return type === 'float32' || type === 'float64';
}
exports.isFloat = isFloat;
function isInteger(type) {
    return (['byte', 'char', 'int8', 'uint8', 'int16', 'uint16',
        'int32', 'uint32', 'int64', 'uint64'].indexOf('type') >= 0);
}
exports.isInteger = isInteger;
function isPrimitive(fieldType) {
    return (exports.primitiveTypes.indexOf(fieldType) >= 0);
}
exports.isPrimitive = isPrimitive;
;
var isArrayRegex = /\[(\d*)\]$/;
function isArray(fieldType, details) {
    var match = fieldType.match(isArrayRegex);
    if (match) {
        if (match[1] && details) {
            details.length = match[1];
        }
        return true;
    }
    else {
        return false;
    }
}
exports.isArray = isArray;
;
function isMessage(fieldType) {
    return !this.isPrimitive(fieldType) && !this.isArray(fieldType);
}
exports.isMessage = isMessage;
;
function getTypeOfArray(arrayType) {
    return this.isArray(arrayType) ? arrayType.split('[')[0] : '';
}
exports.getTypeOfArray = getTypeOfArray;
function getLengthOfArray(arrayType) {
    var match = arrayType.match(/.*\[(\d*)\]$/);
    if (match[1] === '') {
        return null;
    }
    return parseInt(match[1]);
}
exports.getLengthOfArray = getLengthOfArray;
function parseType(msgType, field) {
    if (!msgType) {
        throw new Error(`Invalid empty type ${JSON.stringify(field)}`);
    }
    // else
    if (isArray(msgType)) {
        field.isArray = true;
        const constantLength = !msgType.endsWith('[]');
        const splits = msgType.split('[');
        if (splits.length > 2) {
            throw new Error(`Only support 1-dimensional array types: ${msgType}`);
        }
        field.baseType = splits[0];
        if (constantLength) {
            field.arrayLen = getLengthOfArray(msgType);
        }
        else {
            field.arrayLen = null;
        }
    }
    else {
        field.baseType = msgType;
        field.isArray = false;
        field.arrayLen = null;
    }
}
function isHeader(type) {
    return (['Header', 'std_msgs/Header', 'roslib/Header'].indexOf(type) >= 0);
}
class Field {
    constructor(name, type) {
        this.isArray = false;
        this.baseType = '';
        this.name = name;
        this.type = type;
        parseType(type, this);
        this.isHeader = isHeader(type);
        this.isBuiltin = isPrimitive(this.baseType);
    }
    getPackage() {
        if (this.isBuiltin) {
            return null;
        }
        return this.baseType.split('/')[0];
    }
    getMessage() {
        if (this.isBuiltin) {
            return null;
        }
        return this.baseType.split('/')[1];
    }
    static isHeader(type) {
        return isHeader(type);
    }
    static isBuiltin(type) {
        return isPrimitive(type);
    }
}
exports.Field = Field;
function parsePrimitive(fieldType, fieldValue) {
    let parsedValue = fieldValue;
    if (fieldType === 'bool') {
        parsedValue = (fieldValue === '1');
    }
    else if (fieldType === 'int8' || fieldType === 'byte') {
        parsedValue = parseInt(fieldValue);
    }
    else if (fieldType === 'uint8' || fieldType === 'char') {
        parsedValue = parseInt(fieldValue);
        parsedValue = Math.abs(parsedValue);
    }
    else if (fieldType === 'int16') {
        parsedValue = parseInt(fieldValue);
    }
    else if (fieldType === 'uint16') {
        parsedValue = parseInt(fieldValue);
        parsedValue = Math.abs(parsedValue);
    }
    else if (fieldType === 'int32') {
        parsedValue = parseInt(fieldValue);
    }
    else if (fieldType === 'uint32') {
        parsedValue = parseInt(fieldValue);
        parsedValue = Math.abs(parsedValue);
    }
    else if (fieldType === 'int64') {
        parsedValue = new BN(fieldValue);
    }
    else if (fieldType === 'uint64') {
        parsedValue = new BN(fieldValue);
    }
    else if (fieldType === 'float32') {
        parsedValue = parseFloat(fieldValue);
    }
    else if (fieldType === 'float64') {
        parsedValue = parseFloat(fieldValue);
    }
    else if (fieldType === 'time') {
        let now;
        if (fieldValue.secs && fieldValue.nsecs) {
            parsedValue.secs = fieldValue.secs;
            parsedValue.nsecs = fieldValue.nsecs;
        }
        else {
            if (fieldValue instanceof Date) {
                now = fieldValue.getTime();
            }
            else if (typeof fieldValue == "number") {
                now = fieldValue;
            }
            else {
                now = Date.now();
            }
            let secs = now / 1000;
            let nsecs = (now % 1000) * 1000;
            parsedValue.secs = secs;
            parsedValue.nsecs = nsecs;
        }
    }
    return parsedValue;
}
exports.parsePrimitive = parsePrimitive;
;
function serializePrimitive(fieldType, fieldValue, buffer, bufferOffset) {
    if (fieldType === 'Array') {
        throw new Error();
    }
    const serializer = base_serialize_1.default[fieldType];
    if (!serializer) {
        throw new Error(`Unable to get primitive serializer for field type ${fieldType}`);
    }
    // else
    return serializer(fieldValue, buffer, bufferOffset);
}
exports.serializePrimitive = serializePrimitive;
function deserializePrimitive(fieldType, buffer, bufferOffset) {
    const deserializer = base_deserialize_1.default[fieldType];
    if (!deserializer) {
        throw new Error(`Unable to get primitive deserializer for field type ${fieldType}`);
    }
    // else
    return deserializer(buffer, bufferOffset);
}
exports.deserializePrimitive = deserializePrimitive;
;
function getPrimitiveSize(fieldType, fieldValue) {
    var fieldSize = 0;
    if (fieldType === 'char') {
        fieldSize = 1;
    }
    else if (fieldType === 'byte') {
        fieldSize = 1;
    }
    else if (fieldType === 'bool') {
        fieldSize = 1;
    }
    else if (fieldType === 'int8') {
        fieldSize = 1;
    }
    else if (fieldType === 'uint8') {
        fieldSize = 1;
    }
    else if (fieldType === 'int16') {
        fieldSize = 2;
    }
    else if (fieldType === 'uint16') {
        fieldSize = 2;
    }
    else if (fieldType === 'int32') {
        fieldSize = 4;
    }
    else if (fieldType === 'uint32') {
        fieldSize = 4;
    }
    else if (fieldType === 'int64') {
        fieldSize = 8;
    }
    else if (fieldType === 'uint64') {
        fieldSize = 8;
    }
    else if (fieldType === 'float32') {
        fieldSize = 4;
    }
    else if (fieldType === 'float64') {
        fieldSize = 8;
    }
    else if (fieldType === 'string') {
        if (fieldValue !== undefined) {
            fieldSize = Buffer.byteLength(fieldValue, 'utf8') + 4;
        }
    }
    else if (fieldType === 'time') {
        fieldSize = 8;
    }
    else if (fieldType === 'duration') {
        fieldSize = 8;
    }
    return fieldSize;
}
exports.getPrimitiveSize = getPrimitiveSize;
function getArraySize(field, array, msgSpec) {
    var arraySize = 0;
    //  if this is a variable length array it has a 4 byte length field at the beginning
    if (field.arrayLen === null) {
        arraySize = 4;
    }
    array.forEach(function (value) {
        if (field.isBuiltin) {
            arraySize += getPrimitiveSize(field.baseType, value);
        }
        else {
            arraySize += getMessageSize(value, msgSpec.getMsgSpecForType(field.baseType));
        }
    });
    return arraySize;
}
exports.getArraySize = getArraySize;
;
function getMessageSize(message, msgSpec) {
    var messageSize = 0, innerfields = msgSpec.fields;
    innerfields.forEach(function (field) {
        var fieldValue = message[field.name];
        if (field.isArray) {
            messageSize += getArraySize(field, fieldValue, msgSpec);
        }
        else if (field.isBuiltin) {
            messageSize += getPrimitiveSize(field.type, fieldValue);
        }
        else { // it's a message
            messageSize += getMessageSize(fieldValue, msgSpec.getMsgSpecForType(field.baseType));
        }
    });
    return messageSize;
}
exports.getMessageSize = getMessageSize;
;
function getMessageNameFromMessageType(messageType) {
    return messageType.indexOf('/') !== -1 ? messageType.split('/')[1]
        : messageType;
}
exports.getMessageNameFromMessageType = getMessageNameFromMessageType;
function getPackageNameFromMessageType(messageType) {
    return messageType.indexOf('/') !== -1 ? messageType.split('/')[0]
        : '';
}
exports.getPackageNameFromMessageType = getPackageNameFromMessageType;
function splitMessageType(messageType) {
    return messageType.indexOf('/') !== -1 ? messageType.split('/')
        : ['', messageType];
}
exports.splitMessageType = splitMessageType;
//# sourceMappingURL=fields.js.map