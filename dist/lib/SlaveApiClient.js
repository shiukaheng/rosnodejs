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
const xmlrpc = require("xmlrpc-rosnodejs");
//-----------------------------------------------------------------------
class SlaveApiClient {
    constructor(host, port) {
        this._xmlrpcClient = xmlrpc.createClient({ host: host, port: port });
    }
    ;
    requestTopic(callerId, topic, protocols) {
        return makeCall(this._xmlrpcClient, 'requestTopic', [callerId, topic, protocols]);
    }
}
exports.default = SlaveApiClient;
function makeCall(client, method, params) {
    return new Promise((resolve, reject) => {
        client.methodCall(method, params, (err, resp) => {
            if (err || resp[0] !== 1) {
                reject(err || new Error(`Unable to complete ${method}`));
            }
            else {
                resolve(resp);
            }
        });
    });
}
//# sourceMappingURL=SlaveApiClient.js.map