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
const NetworkUtils = require("../utils/network_utils");
const SerializationUtils = require("../utils/serialization_utils");
const PrependLength = SerializationUtils.PrependLength;
const TcprosUtils = require("../utils/tcpros_utils");
const events_1 = require("events");
const LoggingManager_1 = require("./LoggingManager");
class ServiceServer extends events_1.EventEmitter {
    constructor(options, callback, nodeHandle) {
        super();
        this._state = 0 /* REGISTERING */;
        this._clients = {};
        this._service = options.service;
        this._type = options.type;
        this._port = null;
        this._nodeHandle = nodeHandle;
        this._log = LoggingManager_1.default.getLogger('ros.rosnodejs');
        this._requestCallback = callback;
        if (!options.typeClass) {
            throw new Error(`Unable to load service for service ${this.getService()} with type ${this.getType()}`);
        }
        this._messageHandler = options.typeClass;
        this._register();
    }
    ;
    getService() {
        return this._service;
    }
    getType() {
        return this._type;
    }
    // FIXME: remove this?
    getServiceUri() {
        return NetworkUtils.formatServiceUri(this._port);
    }
    getClientUris() {
        return Object.keys(this._clients);
    }
    /**
     * The ROS client shutdown code is a little noodly. Users can close a client through
     * the ROS node or the client itself and both are correct. Either through a node.unadvertise()
     * call or a client.shutdown() call - in both instances a call needs to be made to the ROS master
     * and the client needs to tear itself down.
     */
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._nodeHandle.unadvertiseService(this.getService());
        });
    }
    isShutdown() {
        return this._state === 2 /* SHUTDOWN */;
    }
    disconnect() {
        this._state = 2 /* SHUTDOWN */;
        for (const clientId in this._clients) {
            const client = this._clients[clientId];
            client.deserializer.removeAllListeners();
            client.socket.end();
            client.socket.destroy();
        }
        this._clients = {};
    }
    handleClientConnection(socket, uri, deserializer, header) {
        if (this.isShutdown()) {
            return;
        }
        // else
        // TODO: verify header data
        this._log.debug('Service %s handling new client connection ', this.getService());
        const error = TcprosUtils.validateServiceClientHeader(header, this.getService(), this._messageHandler.md5sum());
        if (error) {
            this._log.error('Error while validating service %s connection header: %s', this.getService(), error);
            socket.end(PrependLength(TcprosUtils.createTcpRosError(error)));
            return;
        }
        let respHeader = TcprosUtils.createServiceServerHeader(this._nodeHandle.getNodeName(), this._messageHandler.md5sum(), this.getType());
        socket.write(respHeader);
        const persist = (header['persistent'] === '1');
        // bind to message handler
        deserializer.on('message', (msg) => {
            this._handleMessage(socket, msg, uri, persist);
        });
        socket.on('close', () => {
            delete this._clients[uri];
            this._log.debug('Service client %s disconnected!', uri);
        });
        this._clients[uri] = {
            socket,
            persist,
            deserializer
        };
        this.emit('connection', header, uri);
    }
    _handleMessage(client, data, uri, persist) {
        return __awaiter(this, void 0, void 0, function* () {
            this._log.trace('Service  ' + this.getService() + ' got message! ' + data.toString('hex'));
            // deserialize msg
            const req = this._messageHandler.Request.deserialize(data);
            // call service callback
            const resp = new this._messageHandler.Response();
            const success = yield this._requestCallback(req, resp);
            // client should already have been closed, so if we got here just cut out early
            if (this.isShutdown()) {
                return;
            }
            const serializeResponse = TcprosUtils.serializeServiceResponse(this._messageHandler.Response, resp, success);
            // send service response
            client.write(serializeResponse);
            if (!persist) {
                this._log.debug('Closing non-persistent client');
                client.end();
                delete this._clients[uri];
            }
        });
    }
    _register() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._nodeHandle.registerService(this.getService());
                // if we were shutdown between the starting the registration and now, bail
                if (this.isShutdown()) {
                    return;
                }
                this._state = 1 /* REGISTERED */;
                this.emit('registered');
            }
            catch (err) {
                if (!this._nodeHandle.isShutdown()) {
                    this._log.error('Error while registering service %s: %s', this.getService(), err);
                }
            }
        });
    }
}
exports.default = ServiceServer;
//# sourceMappingURL=ServiceServer.js.map