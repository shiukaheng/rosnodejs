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
'use strict';
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
const messageUtils = require("../utils/message_utils");
const Names_1 = require("./Names");
const ActionClientInterface_1 = require("./ActionClientInterface");
const ActionServerInterface_1 = require("./ActionServerInterface");
/**
 * Handle class for nodes created with rosnodejs
 * @param node {RosNode} node that handle is attached to.
 * @param namespace {string} namespace of node. @default null
 */
class NodeHandle {
    constructor(node, namespace = null) {
        this._node = node;
        this._namespace = '';
        this.setNamespace(namespace);
    }
    setNamespace(namespace) {
        if (typeof namespace !== 'string') {
            namespace = '';
        }
        if (namespace.startsWith('~')) {
            namespace = Names_1.default.resolve(namespace);
        }
        this._namespace = this.resolveName(namespace, true);
    }
    getNodeName() {
        return this._node.getNodeName();
    }
    isShutdown() {
        return this._node && this._node.isShutdown();
    }
    //------------------------------------------------------------------
    // Pubs, Subs, Services
    //------------------------------------------------------------------
    /**
     * Creates a ros publisher with the provided options
     * @param topic {string}
     * @param type {string|Object} string representing message type or instance
     * @param [options] {object}
     * @param [options.latching] {boolean} latch messages
     * @param [options.tpcNoDelay] {boolean} set TCP no delay option on Socket
     * @param [options.queueSize] {number} number of messages to queue when publishing
     * @param [options.throttleMs] {number} milliseconds to throttle when publishing
     * @return {Publisher}
     */
    advertise(topic, type, options = {}) {
        if (!topic) {
            throw new Error(`Unable to advertise unnamed topic - got ${topic}`);
        }
        if (!type) {
            throw new Error(`Unable to advertise topic ${topic} without type - got ${type}`);
        }
        try {
            const pubOptions = Object.assign(Object.assign(Object.assign({}, options), { topic: this.resolveName(topic) }), resolveMsgType(type));
            return this._node.advertise(pubOptions);
        }
        catch (err) {
            this._node._log.error(`Exception trying to advertise topic ${topic}`);
            throw err;
        }
    }
    /**
     * Creates a ros subscriber with the provided options
     * @param topic {string}
     * @param type {string|Object} string representing message type or instance
     * @param callback {function} function to call when message is received
     * @param [options] {object}
     * @param [options.queueSize] {number} number of messages to queue when subscribing
     * @param [options.throttleMs] {number} milliseconds to throttle when subscribing
     * @param [options.transports] {string[]} transports list
     * @return {Subscriber}
     */
    subscribe(topic, type, callback, options = {}) {
        if (!topic) {
            throw new Error(`Unable to subscribe to unnamed topic - got ${topic}`);
        }
        if (!type) {
            throw new Error(`Unable to subscribe to topic ${topic} without type - got ${type}`);
        }
        try {
            if (!Array.isArray(options.transports) || options.transports.length == 0 || (!~options.transports.indexOf('TCPROS') && !~options.transports.indexOf('UDPROS'))) {
                options.transports = ['TCPROS'];
            }
            const subOptions = Object.assign(Object.assign(Object.assign({}, options), { 
                // need to explicitly include transports here because
                // typescript doesn't know it exists
                transports: options.transports, topic: this.resolveName(topic) }), resolveMsgType(type));
            if (!!~options.transports.indexOf('UDPROS') && (!options.dgramSize || options.dgramSize <= 0)) {
                subOptions.dgramSize = 1500;
            }
            if (!!~options.transports.indexOf('UDPROS')) {
                subOptions.port = this._node._udprosPort;
            }
            return this._node.subscribe(subOptions, callback);
        }
        catch (err) {
            this._node._log.error(`Exception trying to subscribe to topic ${topic}`);
            throw err;
        }
    }
    /**
     * Creates a ros Service server with the provided options
     * @param service {string}
     * @param type {string|Object} string representing service type or instance
     * @param callback {function} function to call when this service is called
     *   e.g.
     *     (request, response) => {
     *       response.data = !request.data;
     *       return true;
     *     }
     * @return {ServiceServer}
     */
    advertiseService(service, type, callback) {
        if (!service) {
            throw new Error(`Unable to advertise unnamed service - got ${service}`);
        }
        if (!type) {
            throw new Error(`Unable to advertise service ${service} without type - got ${type}`);
        }
        try {
            let options = Object.assign({ service: this.resolveName(service) }, resolveSrvType(type));
            return this._node.advertiseService(options, callback);
        }
        catch (err) {
            this._node._log.error(`Exception trying to advertise service ${service}`);
            throw err;
        }
    }
    /**
     * Creates a ros Service client with the provided options
     * @param service {string}
     * @param type {string|Object} string representing service type or instance
     * @param options {Object} extra options to pass to service client
     * @return {ServiceClient}
     */
    serviceClient(service, type, options) {
        if (!service) {
            throw new Error(`Unable to create unnamed service client - got ${service}`);
        }
        if (!type) {
            throw new Error(`Unable to create service client ${service} without type - got ${type}`);
        }
        try {
            const clientOptions = Object.assign(Object.assign(Object.assign({}, options), { service: this.resolveName(service) }), resolveSrvType(type));
            return this._node.serviceClient(clientOptions);
        }
        catch (err) {
            this._node._log.error(`Exception trying to create service client ${service}`);
            throw err;
        }
    }
    /**
     * @deprecated - use actionClientInterface
     */
    actionClient(actionServer, type, options = {}) {
        return this.actionClientInterface(actionServer, type, options);
    }
    /**
     * Create an action client
     * @param  {String} actionServer name of the action server
     * (e.g., "/turtle_shape")
     * @param  {String} type action type
     * (e.g., "turtle_actionlib/Shape")
     * @return {[type]} an instance of ActionClientInterface
     */
    actionClientInterface(actionServer, type, options = {}) {
        if (!actionServer) {
            throw new Error(`Unable to create action client to unspecified server - [${actionServer}]`);
        }
        else if (!type) {
            throw new Error(`Unable to create action client ${actionServer} without type - got ${type}`);
        }
        // don't namespace action client - topics will be resolved by
        // advertising through this NodeHandle
        return new ActionClientInterface_1.default(Object.assign({}, options, {
            actionServer,
            type,
            nh: this
        }));
    }
    actionServerInterface(actionServer, type, options = {}) {
        if (!actionServer) {
            throw new Error(`Unable to create unspecified action server  [${actionServer}]`);
        }
        else if (!type) {
            throw new Error(`Unable to create action server ${actionServer} without type - got ${type}`);
        }
        // don't namespace action server - topics will be resolved by
        // advertising through this NodeHandle
        return new ActionServerInterface_1.default(Object.assign({}, options, {
            actionServer,
            type,
            nh: this
        }));
    }
    /**
     * Stop receiving callbacks for this topic
     * Unregisters subscriber from master
     * @param topic {string} topic to unsubscribe from
     */
    unsubscribe(topic) {
        return this._node.unsubscribe(this.resolveName(topic));
    }
    /**
     * Stops publishing on this topic
     * Unregisters publisher from master
     * @param topic {string} topic to unadvertise
     */
    unadvertise(topic) {
        return this._node.unadvertise(this.resolveName(topic));
    }
    /**
     * Unregister service from master
     * @param service {string} service to unadvertise
     */
    unadvertiseService(service) {
        return this._node.unadvertiseService(this.resolveName(service));
    }
    /**
     * Polls master for service
     * @param service {string} name of service
     * @param [timeout] {number} give up after some time
     * @return {Promise} resolved when service exists or timeout occurs. Returns true/false for service existence
     */
    waitForService(service, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            service = this.resolveName(service);
            const hasTimeout = typeof timeout === 'number';
            const start = Date.now();
            while (!hasTimeout || start + timeout > Date.now()) {
                try {
                    yield this._node.lookupService(service);
                    return true;
                }
                catch (err) {
                    yield sleep(500);
                }
            }
            return false;
        });
    }
    getMasterUri() {
        return this._node.getMasterUri();
    }
    /**
     * @typedef {Object} TopicList
     * @property {{name: string, type: string}[]} topics Array of topics
     */
    /**
     * Get list of topics that can be subscribed to. This does not return
     * topics that have no publishers.
     *
     * @param {string} subgraph Restrict topic names to match within the
     *                          specified subgraph. Subgraph namespace is
     *                          resolved relative to this node's namespace.
     *                          Will return all names if no subgraph is given.
     * @return {Promise.<TopicList>}
     */
    getPublishedTopics(subgraph = "") {
        return this._node.getPublishedTopics(subgraph);
    }
    /**
     * Retrieve list topic names and their types.
     *
     * @return {Promise.<TopicList>}
     */
    getTopicTypes() {
        return this._node.getTopicTypes();
    }
    /**
     * @typedef {Object} SystemState
     * @property {{...string:Array.<string>}} publishers An object with topic names as keys and
     * an array of publishers as values
     * @property {{...string:Array.<string>}} subscribers An object with topic names as keys and
     * an array of subscribers as values
     * @property {{...string:Array.<string>}} services An object with service names as keys and
     * an array of providers as values
     */
    /**
     * Retrieve list representation of system state (i.e. publishers,
     * subscribers, and services).
     *
     * @return {Promise.<SystemState>}
     */
    getSystemState() {
        return this._node.getSystemState();
    }
    //------------------------------------------------------------------
    // Param Interface
    //------------------------------------------------------------------
    deleteParam(key) {
        return this._node.deleteParam(this.resolveName(key));
    }
    setParam(key, value) {
        return this._node.setParam(this.resolveName(key), value);
    }
    getParam(key) {
        return this._node.getParam(this.resolveName(key));
    }
    hasParam(key) {
        return this._node.hasParam(this.resolveName(key));
    }
    //------------------------------------------------------------------
    // Namespacing
    //------------------------------------------------------------------
    resolveName(name, remap = true, noValidate = false) {
        if (!noValidate) {
            Names_1.default.validate(name, true);
        }
        if (name.length === 0) {
            return this._namespace;
        }
        if (name.startsWith('~')) {
            throw new Error('Using ~ names with NodeHandle methods is not allowed');
        }
        else if (!name.startsWith('/') && this._namespace.length > 0) {
            name = Names_1.default.append(this._namespace, name);
        }
        else {
            name = Names_1.default.clean(name);
        }
        if (remap) {
            return Names_1.default.remap(name);
        }
        else {
            return Names_1.default.resolve(name, false);
        }
    }
    remapName(name) {
        name = this.resolveName(name, false);
        return Names_1.default.remap(name);
    }
}
exports.default = NodeHandle;
function resolveMsgType(type) {
    if (typeof type === 'string') {
        return {
            type,
            typeClass: messageUtils.getHandlerForMsgType(type, true)
        };
    }
    else {
        return {
            type: type.datatype(),
            typeClass: type
        };
    }
}
function resolveSrvType(type) {
    if (typeof type === 'string') {
        return {
            type,
            typeClass: messageUtils.getHandlerForSrvType(type, true)
        };
    }
    else {
        return {
            type: type.datatype(),
            typeClass: type
        };
    }
}
function sleep(timeoutMs) {
    return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}
//# sourceMappingURL=NodeHandle.js.map