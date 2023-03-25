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
const networkUtils = require("../utils/network_utils");
const LoggingManager_1 = require("./LoggingManager");
const XmlrpcClient_1 = require("../utils/XmlrpcClient");
//-----------------------------------------------------------------------
class MasterApiClient {
    constructor(rosMasterUri) {
        this._log = LoggingManager_1.default.getLogger(LoggingManager_1.default.DEFAULT_LOGGER_NAME + '.masterapi');
        this._log.info('Connecting to ROS Master at ' + rosMasterUri);
        this._xmlrpcClient = new XmlrpcClient_1.default(networkUtils.getAddressAndPortFromUri(rosMasterUri), this._log);
    }
    ;
    getXmlrpcClient() {
        return this._xmlrpcClient;
    }
    _call(method, data, options = {}) {
        return this._xmlrpcClient.call(method, data, options);
    }
    registerService(callerId, service, serviceUri, uri, options) {
        return this._call('registerService', [callerId, service, serviceUri, uri], options);
    }
    unregisterService(callerId, service, serviceUri, options) {
        return this._call('unregisterService', [callerId, service, serviceUri], options);
    }
    registerSubscriber(callerId, topic, topicType, uri, options) {
        return this._call('registerSubscriber', [callerId, topic, topicType, uri], options);
    }
    unregisterSubscriber(callerId, topic, uri, options) {
        return this._call('unregisterSubscriber', [callerId, topic, uri], options);
    }
    registerPublisher(callerId, topic, topicType, uri, options) {
        return this._call('registerPublisher', [callerId, topic, topicType, uri], options);
    }
    unregisterPublisher(callerId, topic, uri, options) {
        return this._call('unregisterPublisher', [callerId, topic, uri], options);
    }
    lookupNode(callerId, nodeName, options) {
        return this._call('lookupNode', [callerId, nodeName], options);
    }
    getPublishedTopics(callerId, subgraph, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield this._call('getPublishedTopics', [callerId, subgraph], options);
            return {
                topics: resp[2].map(([name, type]) => {
                    return {
                        name, type
                    };
                })
            };
        });
    }
    getTopicTypes(callerId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield this._call('getTopicTypes', [callerId], options);
            return {
                topics: resp[2].map(([name, type]) => {
                    return {
                        name, type
                    };
                })
            };
        });
    }
    getSystemState(callerId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            function toObject(memo, [topic, clients]) {
                memo[topic] = clients;
                return memo;
            }
            const resp = yield this._call('getSystemState', [callerId], options);
            return {
                publishers: resp[2][0].reduce(toObject, {}),
                subscribers: resp[2][1].reduce(toObject, {}),
                services: resp[2][2].reduce(toObject, {})
            };
        });
    }
    getUri(callerId, options) {
        return this._call('getUri', [callerId], options);
    }
    lookupService(callerId, service, options) {
        return this._call('lookupService', [callerId, service], options);
    }
}
exports.default = MasterApiClient;
;
//# sourceMappingURL=MasterApiClient.js.map