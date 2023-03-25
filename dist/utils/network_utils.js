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
exports.formatServiceUri = exports.getAddressAndPortFromUri = exports.getHost = exports.init = void 0;
const os = require("os");
const remapping_utils_1 = require("./remapping_utils");
let HOST = null;
function init(remappings) {
    const ip = remappings[remapping_utils_1.SPECIAL_KEYS.ip];
    const host = remappings[remapping_utils_1.SPECIAL_KEYS.hostname];
    const ROS_IP = process.env.ROS_IP;
    const ROS_HOSTNAME = process.env.ROS_HOSTNAME;
    HOST = ip || host || ROS_IP || ROS_HOSTNAME || os.hostname();
}
exports.init = init;
function getHost() {
    return HOST;
}
exports.getHost = getHost;
function getAddressAndPortFromUri(uriString) {
    let regexStr = /(?:http:\/\/|rosrpc:\/\/)?([a-zA-Z\d\-_.]+):(\d+)/;
    let match = uriString.match(regexStr);
    if (match === null) {
        throw new Error('Unable to find host and port from uri ' + uriString + ' with regex ' + regexStr);
    }
    // else
    return {
        host: match[1],
        port: +match[2]
    };
}
exports.getAddressAndPortFromUri = getAddressAndPortFromUri;
function formatServiceUri(port) {
    return 'rosrpc://' + this.getHost() + ':' + port;
}
exports.formatServiceUri = formatServiceUri;
//------------------------------------------------------------------
//# sourceMappingURL=network_utils.js.map