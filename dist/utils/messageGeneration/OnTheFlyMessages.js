"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceFromRegistry = exports.getMessageFromRegistry = exports.getAll = exports.getPackageFromRegistry = void 0;
const fieldsUtil = require("./fields");
const MessageSpec = require("./MessageSpec");
const MessageLoader_1 = require("./MessageLoader");
/** get message handler class from registry */
function getPackageFromRegistry(packagename) {
    return registry[packagename];
}
exports.getPackageFromRegistry = getPackageFromRegistry;
/** get all message and service definitions, from all packages */
function getAll() {
    return __awaiter(this, void 0, void 0, function* () {
        const msgLoader = new MessageLoader_1.default(false);
        yield msgLoader.buildPackageTree(null, false);
        const pkgCache = msgLoader.getCache();
        function tryBuildMessage(spec) {
            try {
                buildMessageFromSpec(spec);
            }
            catch (err) {
                console.error('Error building %s: %s\n%s', spec.getFullMessageName(), err, err.stack);
                throw err;
            }
        }
        for (const pkgName in pkgCache) {
            const pkg = pkgCache[pkgName];
            for (const msgName in pkg.messages) {
                tryBuildMessage(pkg.messages[msgName].spec);
            }
            for (const srvName in pkg.services) {
                tryBuildMessage(pkg.services[srvName].spec);
            }
        }
    });
}
exports.getAll = getAll;
;
const registry = {};
/*
   registry looks like:
  { 'packagename':
    {
      msg: {
        'String': classdef,
        'Pose': classdef,
        ...
      },
      srv: { Request:
             {
               'SetBool': classdef,
               ...
             },
             Response:
             {
               'SetBool': classdef,
               ...
             }
           }
    },
    'packagename2': {..}
  };
*/
/**
   @param messageType is the ROS message or service type, e.g.
   'std_msgs/String'
   @param type is from the set
   ["msg", "srv"]
*/
function getMessageFromRegistry(messageType) {
    return getMessageInternal(messageType, 'msg');
}
exports.getMessageFromRegistry = getMessageFromRegistry;
function getServiceFromRegistry(messageType) {
    return getMessageInternal(messageType, 'srv');
}
exports.getServiceFromRegistry = getServiceFromRegistry;
function getMessageInternal(messageType, type) {
    const [packageName, messageName] = splitMessageType(messageType);
    const packageSection = registry[packageName];
    if (!packageSection) {
        return undefined;
    }
    const section = packageSection[type]; // msg or srv sub-object
    if (!section) {
        return undefined;
    }
    return section[messageName];
}
function setMessageInRegistry(messageType, message, type) {
    const [packageName, messageName] = splitMessageType(messageType);
    if (!registry[packageName]) {
        registry[packageName] = { msg: {}, srv: {} };
    }
    if (type === 'srv') {
        registry[packageName][type][messageName] = message;
    }
    else {
        registry[packageName][type][messageName] = message;
    }
}
// ---------------------------------------------------------
// private functions
function buildMessageFromSpec(msgSpec) {
    const { type } = msgSpec;
    const fullMsg = msgSpec.getFullMessageName();
    switch (type) {
        case MessageSpec.MSG_TYPE:
        case MessageSpec.ACTION_GOAL_TYPE:
        case MessageSpec.ACTION_FEEDBACK_TYPE:
        case MessageSpec.ACTION_RESULT_TYPE:
        case MessageSpec.ACTION_ACTION_GOAL_TYPE:
        case MessageSpec.ACTION_ACTION_FEEDBACK_TYPE:
        case MessageSpec.ACTION_ACTION_RESULT_TYPE:
        case MessageSpec.ACTION_ACTION_TYPE:
            setMessageInRegistry(fullMsg, buildMessageClass(msgSpec), 'msg');
            break;
        case MessageSpec.SRV_TYPE:
            {
                const Request = buildMessageClass(msgSpec.request);
                const Response = buildMessageClass(msgSpec.response);
                const md5Sum = msgSpec.getMd5sum();
                const service = {
                    Request,
                    Response,
                    md5sum: () => { return md5Sum; },
                    datatype: () => { return fullMsg; }
                };
                setMessageInRegistry(fullMsg, service, 'srv');
                break;
            }
        default:
            console.warn("Unknown msgspec type:", type);
    }
}
;
// -------------------------------
// functions relating to handler class
/** Construct the class definition for the given message type. The
 * resulting class holds the data and has the methods required for
 * use with ROS, incl. serialization, deserialization, and md5sum. */
function buildMessageClass(msgSpec) {
    const md5Sum = msgSpec.getMd5sum();
    const fullMsgDefinition = msgSpec.computeFullText();
    const messageType = msgSpec.getFullMessageName();
    const Constants = (() => {
        const ret = {};
        msgSpec.constants.forEach((constant) => {
            ret[constant.name.toUpperCase()] = constant.value;
        });
        return ret;
    })();
    const messageInfo = {
        messageType,
        fields: msgSpec.fields,
        fieldTypeInfo: buildFieldTypeInfo(msgSpec),
        spec: msgSpec
    };
    class MessageClass {
        constructor(values) {
            if (msgSpec.fields) {
                for (const field of msgSpec.fields) {
                    if (!field.isBuiltin) {
                        const FieldConstructor = getFieldMessageConstructor(field, messageInfo);
                        // sub-message class
                        // is it an array?
                        if (values && typeof values[field.name] != "undefined") {
                            // values provided
                            if (field.isArray) {
                                this[field.name] = values[field.name].map(function (value) {
                                    return new FieldConstructor(value);
                                });
                            }
                            else {
                                this[field.name] =
                                    new FieldConstructor(values[field.name]);
                            }
                        }
                        else {
                            // use defaults
                            if (field.isArray) {
                                // it's an array
                                const length = field.arrayLen || 0;
                                this[field.name] = new Array(length).fill(new FieldConstructor());
                            }
                            else {
                                this[field.name] = new FieldConstructor();
                            }
                        }
                    }
                    else {
                        // simple type
                        this[field.name] =
                            (values && typeof values[field.name] != "undefined") ?
                                values[field.name] : fieldsUtil.getDefaultValue(field.type);
                    }
                }
            }
        }
        static md5sum() {
            return md5Sum;
        }
        static serialize(obj, buffer, offset) {
            serializeInnerMessage(obj, messageInfo, buffer, offset);
        }
        static Resolve(msg) {
            return msg;
        }
        static deserialize(buffer) {
            const message = new MessageClass();
            deserializeInnerMessage(message, messageInfo, buffer, [0]);
            return message;
        }
        static getMessageSize(msg) {
            return fieldsUtil.getMessageSize(msg, msgSpec);
        }
        static messageDefinition() {
            return fullMsgDefinition;
        }
        static datatype() {
            return messageType;
        }
    }
    MessageClass._info = messageInfo;
    MessageClass.Constants = Constants;
    return MessageClass;
}
function getFieldMessageConstructor(field, info) {
    const fieldTypeInfo = info.fieldTypeInfo[field.name];
    if (!fieldTypeInfo.constructor) {
        fieldTypeInfo.constructor = getMessageInternal(field.baseType, 'msg');
    }
    // else
    return fieldTypeInfo.constructor;
}
function getFieldMessageInfo(field, info) {
    const fieldTypeInfo = info.fieldTypeInfo[field.name];
    if (!fieldTypeInfo.constructor) {
        fieldTypeInfo.constructor = getMessageInternal(field.baseType, 'msg');
    }
    return fieldTypeInfo.constructor._info;
}
// ---------------------------------------------------------
function getMessageType(packageName, messageName) {
    return packageName ? packageName + '/' + messageName
        : messageName;
}
function splitMessageType(messageType) {
    return messageType.indexOf('/') !== -1 ? messageType.split('/')
        : ['', messageType];
}
function buildFieldTypeInfo(spec) {
    const fieldTypeSpecs = {};
    for (const field of spec.fields) {
        if (!field.isBuiltin) {
            fieldTypeSpecs[field.name] = {
                constructor: undefined,
                spec: spec.getMsgSpecForType(field.baseType)
            };
        }
    }
    return fieldTypeSpecs;
}
// ---------------------------------------------------------
// Serialize
function serializeInnerMessage(message, messageInfo, buffer, bufferOffset = 0) {
    const spec = messageInfo.spec;
    for (const field of spec.fields) {
        const fieldValue = message[field.name];
        if (field.isArray) {
            if (field.arrayLen === null) {
                buffer.writeUInt32LE(fieldValue.length, bufferOffset);
                bufferOffset += 4; // only for variable length arrays
            }
            const arrayType = field.baseType;
            for (const value of fieldValue) {
                if (field.isBuiltin) {
                    bufferOffset = fieldsUtil.serializePrimitive(arrayType, value, buffer, bufferOffset);
                }
                else if (fieldsUtil.isMessage(arrayType)) {
                    bufferOffset = serializeInnerMessage(value, getFieldMessageInfo(field, messageInfo), buffer, bufferOffset);
                }
            }
        }
        else if (field.isBuiltin) {
            bufferOffset = fieldsUtil.serializePrimitive(field.type, fieldValue, buffer, bufferOffset);
        }
        else { // is message
            bufferOffset = serializeInnerMessage(fieldValue, getFieldMessageInfo(field, messageInfo), buffer, bufferOffset);
        }
    }
    return bufferOffset;
}
// ---------------------------------------------------------
// Deserialize
function deserializeInnerMessage(message, info, buffer, bufferOffset) {
    for (const field of info.spec.fields) {
        let fieldValue = message[field.name];
        if (field.isArray) {
            const array = [];
            const arrayType = field.baseType;
            let arraySize;
            if (field.arrayLen !== null) {
                arraySize = field.arrayLen;
            }
            else {
                arraySize = buffer.readUInt32LE(bufferOffset[0]);
                bufferOffset[0] += 4; // only for variable length arrays
            }
            const isPrimitive = field.isBuiltin;
            for (var i = 0; i < arraySize; i++) {
                if (isPrimitive) {
                    var value = fieldsUtil.deserializePrimitive(arrayType, buffer, bufferOffset);
                    array.push(value);
                }
                else { // is message
                    let arrayMessage = {};
                    arrayMessage = deserializeInnerMessage(arrayMessage, getFieldMessageInfo(field, info), buffer, bufferOffset);
                    array.push(arrayMessage);
                }
            }
            fieldValue = array;
        }
        else if (field.isBuiltin) {
            fieldValue = fieldsUtil.deserializePrimitive(field.type, buffer, bufferOffset);
        }
        else { // is message
            var innerMessage = {};
            fieldValue = deserializeInnerMessage(innerMessage, getFieldMessageInfo(field, info), buffer, bufferOffset);
        }
        message[field.name] = fieldValue;
    }
    return message;
}
;
//# sourceMappingURL=OnTheFlyMessages.js.map