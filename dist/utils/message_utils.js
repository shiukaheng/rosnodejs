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
exports.getHandlerForSrvType = exports.getHandlerForMsgType = exports.getAvailableMessagePackages = exports.requireMsgPackage = exports.getPackage = exports.loadMessagePackage = exports.getTopLevelMessageDirectory = void 0;
const path = require("path");
const OnTheFly = require("./messageGeneration/OnTheFlyMessages");
const ros_msg_utils = require("../ros_msg_utils/index");
// *grumble grumble* this is unfortunate
// Our ros messages are going to be loaded from all over the place
// They all need access to ros_msg_utils but we can't guarantee that
// they'll be able to find ros_msg_utils without forcing people to
// add ros_msg_utils to their node_path or installing it globally
// or installing it separately for every message package
global._ros_msg_utils = ros_msg_utils;
let messagePackageMap = {};
//-----------------------------------------------------------------------
// Utilities for loading, finding handlers for
// message serialization/deserialization
//
//  When rosnodejs starts, it searches through your cmakepath for generated
//  javascript messages. It caches paths for any of the packages it finds.
//  Then, in rosnodejs when you ask to use a message package we check for it
//  in the cache and require it if found.
//-----------------------------------------------------------------------
function getTopLevelMessageDirectory() {
    return path.join(ros_msg_utils.CMAKE_PATHS[0], ros_msg_utils.MESSAGE_PATH);
}
exports.getTopLevelMessageDirectory = getTopLevelMessageDirectory;
function loadMessagePackage(msgPackage) {
    const pkg = messagePackageMap[msgPackage] = ros_msg_utils.Find(msgPackage);
    return pkg;
}
exports.loadMessagePackage = loadMessagePackage;
function getPackage(msgPackage) {
    return messagePackageMap[msgPackage];
}
exports.getPackage = getPackage;
function requireMsgPackage(msgPackage) {
    // check our registry of on-demand generate message definition
    var fromRegistry = OnTheFly.getPackageFromRegistry(msgPackage);
    if (fromRegistry) {
        return fromRegistry;
    }
    // if we can't find it in registry, check for gennodejs
    // pre-compiled versions
    let pack = this.getPackage(msgPackage);
    if (!pack) {
        this.loadMessagePackage(msgPackage);
        return this.getPackage(msgPackage);
    }
    // else
    return pack;
}
exports.requireMsgPackage = requireMsgPackage;
function getAvailableMessagePackages() {
    return ros_msg_utils.packageMap;
}
exports.getAvailableMessagePackages = getAvailableMessagePackages;
function getHandlerForMsgType(rosDataType, loadIfMissing = false) {
    let type = OnTheFly.getMessageFromRegistry(rosDataType);
    if (type) {
        return type;
    }
    else {
        const [msgPackage, type] = rosDataType.split('/');
        let messagePackage = getPackage(msgPackage);
        if (!messagePackage && loadIfMissing) {
            messagePackage = loadMessagePackage(msgPackage);
        }
        if (!messagePackage) {
            throw new Error('Unable to find message package ' + msgPackage);
        }
        // else
        return messagePackage.msg[type];
    }
}
exports.getHandlerForMsgType = getHandlerForMsgType;
function getHandlerForSrvType(rosDataType, loadIfMissing = false) {
    let srv = OnTheFly.getServiceFromRegistry(rosDataType);
    if (srv) {
        return srv;
    }
    else {
        const [msgPackage, type] = rosDataType.split('/');
        let messagePackage = this.getPackage(msgPackage);
        if (!messagePackage && loadIfMissing) {
            messagePackage = this.loadMessagePackage(msgPackage);
        }
        if (!messagePackage) {
            throw new Error('Unable to find service package ' + msgPackage);
        }
        // else
        return messagePackage.srv[type];
    }
}
exports.getHandlerForSrvType = getHandlerForSrvType;
//# sourceMappingURL=message_utils.js.map