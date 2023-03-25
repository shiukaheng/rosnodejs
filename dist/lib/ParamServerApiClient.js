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
const LoggingManager_1 = require("./LoggingManager");
//-----------------------------------------------------------------------
class ParamServerApiClient {
    constructor(xmlrpcClient) {
        this._log = LoggingManager_1.default.getLogger(LoggingManager_1.default.DEFAULT_LOGGER_NAME + '.params');
        this._xmlrpcClient = xmlrpcClient;
    }
    _call(method, data, options = {}) {
        return this._xmlrpcClient.call(method, data, options);
    }
    deleteParam(callerId, key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._call('deleteParam', [callerId, key]);
        });
    }
    setParam(callerId, key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._call('setParam', [callerId, key, value]);
        });
    }
    getParam(callerId, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield this._call('getParam', [callerId, key]);
            // resp[2] is parameter value
            return resp[2];
        });
    }
    searchParam(callerId, key) {
        throw new Error('NOT IMPLEMENTED');
    }
    subscribeParam(callerId, key) {
        throw new Error('NOT IMPLEMENTED');
    }
    unsubscribeParam(callerId, key) {
        throw new Error('NOT IMPLEMENTED');
    }
    hasParam(callerId, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield this._call('hasParam', [callerId, key]);
            // resp[2] is whether it actually has param
            return resp[2];
        });
    }
    getParamNames(callerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield this._call('getParamNames', [callerId]);
            // resp[2] is parameter name list
            return resp[2];
        });
    }
}
exports.default = ParamServerApiClient;
//# sourceMappingURL=ParamServerApiClient.js.map