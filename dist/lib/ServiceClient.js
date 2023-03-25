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
const net = require("net");
const NetworkUtils = require("../utils/network_utils");
const serialization_utils_1 = require("../utils/serialization_utils");
const TcprosUtils = require("../utils/tcpros_utils");
const events_1 = require("events");
const LoggingManager_1 = require("./LoggingManager");
/**
 * @class ServiceClient
 * ServiceClient provides an interface to querying a service in ROS.
 * Typically ROS service calls are blocking. This isn't an option for JS though.
 * To accommodate multiple successive service calls, calls are queued along with
 * resolve/reject handlers created for that specific call. When a call completes, the
 * next call in the queue is handled
 */
class ServiceClient extends events_1.EventEmitter {
    constructor(options, nodeHandle) {
        super();
        this._persist = false;
        this._maxQueueLength = -1;
        this._resolve = false;
        this._calling = false;
        this._serviceClient = null;
        this._callQueue = [];
        this._currentCall = null;
        // ServiceClients aren't "registered" anywhere but it's not
        // waiting to get registered either so REGISTERING doesn't make sense...
        // Hence, we'll just call it REGISTERED.
        this._isShutdown = false;
        this._service = options.service;
        this._type = options.type;
        this._persist = !!options.persist;
        this._maxQueueLength = options.queueLength || -1;
        this._resolve = !!options.resolve;
        this._log = LoggingManager_1.default.getLogger('ros.rosnodejs');
        this._nodeHandle = nodeHandle;
        if (!options.typeClass) {
            throw new Error(`Unable to load service for service client ${this.getService()} with type ${this.getType()}`);
        }
        this._messageHandler = options.typeClass;
    }
    ;
    getService() {
        return this._service;
    }
    getType() {
        return this._type;
    }
    getPersist() {
        return this._persist;
    }
    isCallInProgress() {
        return this._calling;
    }
    close() {
        // don't remove service client if call is in progress
        if (!this.isCallInProgress()) {
            this._serviceClient = null;
        }
    }
    shutdown() {
        this._isShutdown = true;
        if (this._currentCall) {
            this._currentCall.reject('SHUTDOWN');
            this._currentCall = null;
        }
        if (this._serviceClient) {
            this._serviceClient.end();
            this._serviceClient = null;
        }
        for (const call of this._callQueue) {
            call.reject('SHUTDOWN');
        }
        this._callQueue = [];
    }
    isShutdown() {
        return this._isShutdown;
    }
    call(request) {
        return new Promise((resolve, reject) => {
            const newCall = makeServiceCall(request, resolve, reject);
            this._callQueue.push(newCall);
            // shift off old calls if user specified a max queue length
            if (this._maxQueueLength > 0 && this._callQueue.length > this._maxQueueLength) {
                const oldCall = this._callQueue.shift();
                const err = new Error('Unable to complete service call because of queue limitations');
                err.code = 'E_ROSSERVICEQUEUEFULL';
                oldCall.reject(err);
            }
            // if there weren't any other calls in the queue and there's no current call, execute this new call
            // otherwise new call will be handled in order when others complete
            if (this._callQueue.length === 1 && this._currentCall === null) {
                this._executeCall();
            }
        });
    }
    _executeCall() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isShutdown()) {
                return;
            }
            else if (this._callQueue.length === 0) {
                this._log.warn('Tried executing service call on empty queue');
                return;
            }
            // else
            const call = this._callQueue.shift();
            this._currentCall = call;
            this._calling = true;
            try {
                yield this._initiateServiceConnection(call);
                if (this.isShutdown()) {
                    return;
                }
                const msg = yield this._sendRequest(call);
                if (this.isShutdown()) {
                    return;
                }
                this._calling = false;
                this._currentCall = null;
                this._scheduleNextCall();
                call.resolve(msg);
            }
            catch (err) {
                if (!this.isShutdown()) {
                    // this probably just means the service didn't exist yet - don't complain about it
                    // We should still reject the call
                    if (err.code !== 'EROSAPIERROR') {
                        this._log.error(`Error during service ${this.getService()} call ${err}`);
                    }
                    this._calling = false;
                    this._currentCall = null;
                    this._scheduleNextCall();
                    call.reject(err);
                }
            }
        });
    }
    _scheduleNextCall() {
        if (this._callQueue.length > 0 && !this.isShutdown()) {
            process.nextTick(() => {
                this._executeCall();
            });
        }
    }
    _initiateServiceConnection(call) {
        return __awaiter(this, void 0, void 0, function* () {
            // if we haven't connected to the service yet, create the connection
            // this will always be the case unless this is persistent service client
            // calling for a second time.
            if (!this.getPersist() || this._serviceClient === null) {
                const resp = yield this._nodeHandle.lookupService(this.getService());
                if (this.isShutdown()) {
                    return;
                }
                const serviceUri = resp[2];
                const serviceHost = NetworkUtils.getAddressAndPortFromUri(serviceUri);
                // connect to the service's tcpros server
                return this._connectToService(serviceHost, call);
            }
            else {
                // this is a persistent service that we've already set up
                call.serviceClient = this._serviceClient;
            }
        });
    }
    _sendRequest(call) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._resolve) {
                call.request = this._messageHandler.Request.Resolve(call.request);
            }
            // serialize request
            const serializedRequest = TcprosUtils.serializeMessage(this._messageHandler.Request, call.request);
            call.serviceClient.write(serializedRequest);
            const { msg, success } = yield waitForMessage(call);
            if (this.isShutdown()) {
                throw new Error('Shutdown');
            }
            else if (success) {
                return this._messageHandler.Response.deserialize(msg);
            }
            else {
                const error = new Error(`Call to service [${this.getService()}] failed`);
                error.code = 'E_ROSSERVICEFAILED';
                throw error;
            }
        });
    }
    _connectToService(serviceHost, call) {
        return __awaiter(this, void 0, void 0, function* () {
            this._log.debug('Service client %s connecting to %j', this.getService(), serviceHost);
            this._createCallSocketAndHandlers(serviceHost, call);
            this._cacheSocketIfPersistent(call);
            const deserializer = call.deserializer = new serialization_utils_1.DeserializeStream();
            call.serviceClient.pipe(deserializer);
            const { msg } = yield waitForMessage(call);
            if (this.isShutdown()) {
                throw new Error('Shutdown');
            }
            else if (!call.initialized) {
                let header = TcprosUtils.parseTcpRosHeader(msg);
                if (header.error) {
                    throw new Error(header.error);
                }
                // stream deserialization for service response is different - set that up for next message
                deserializer.setServiceRespDeserialize();
                call.initialized = true;
            }
        });
    }
    _createCallSocketAndHandlers(serviceHost, call) {
        // create a socket connection to the service provider
        call.serviceClient = net.connect(serviceHost, () => {
            // Connection to service's TCPROS server succeeded - generate and send a connection header
            this._log.debug('Sending service client %s connection header', this.getService());
            let serviceClientHeader = TcprosUtils.createServiceClientHeader(this._nodeHandle.getNodeName(), this.getService(), this._messageHandler.md5sum(), this.getType(), this.getPersist());
            call.serviceClient.write(serviceClientHeader);
        });
        // bind a close handling function
        call.serviceClient.once('close', () => {
            call.serviceClient = null;
            // we could probably just always reset this._serviceClient to null here but...
            if (this.getPersist()) {
                this._serviceClient = null;
            }
        });
        // bind an error function - any errors connecting to the service
        // will cause the call to be rejected (in this._executeCall)
        call.serviceClient.on('error', (err) => {
            this._log.info(`Service Client ${this.getService()} error: ${err}`);
            call.reject(err);
        });
    }
    _cacheSocketIfPersistent(call) {
        // If this is a persistent service client, we're here because we haven't connected to this service before.
        // Cache the service client for later use. Future calls won't need to lookup the service with the ROS master
        // or deal with the connection header.
        if (this.getPersist()) {
            this._serviceClient = call.serviceClient;
        }
    }
}
exports.default = ServiceClient;
function waitForMessage(call) {
    return new Promise((resolve, reject) => {
        function closeHandler() {
            reject(new Error(`Socket closed while waiting for message on service`));
        }
        call.serviceClient.once('close', closeHandler);
        call.deserializer.once('message', (msg, success) => {
            call.serviceClient.removeListener('close', closeHandler);
            resolve({ msg, success });
        });
    });
}
function makeServiceCall(request, resolve, reject) {
    return {
        request,
        resolve,
        reject,
        initialized: false,
        serviceClient: null,
        deserializer: null
    };
}
//# sourceMappingURL=ServiceClient.js.map