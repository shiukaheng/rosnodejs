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
const xmlrpc = require("xmlrpc-rosnodejs");
const MasterApiClient_1 = require("./MasterApiClient");
const SlaveApiClient_1 = require("./SlaveApiClient");
const ParamServerApiClient_1 = require("./ParamServerApiClient");
const Subscriber_1 = require("./Subscriber");
const Publisher_1 = require("./Publisher");
const PublisherImpl_1 = require("./impl/PublisherImpl");
const SubscriberImpl_1 = require("./impl/SubscriberImpl");
const ServiceClient_1 = require("./ServiceClient");
const ServiceServer_1 = require("./ServiceServer");
const GlobalSpinner_1 = require("../utils/spinners/GlobalSpinner");
const NetworkUtils = require("../utils/network_utils");
const messageUtils = require("../utils/message_utils");
const tcprosUtils = require("../utils/tcpros_utils");
const serialization_utils_1 = require("../utils/serialization_utils");
const events_1 = require("events");
const LoggingManager_1 = require("./LoggingManager");
const UdprosUtils = require("../utils/udpros_utils");
const UDPSocket = require("dgram");
/**
 * Create a ros node interface to the master
 * @param name {string} name of the node
 * @param rosMaster {string} full uri of ros maxter (http://localhost:11311)
 */
class RosNode extends events_1.EventEmitter {
    constructor(nodeName, rosMaster, options = {}) {
        super();
        this._udpConnectionCounter = 0;
        this._slaveApiServer = null;
        this._xmlrpcPort = null;
        this._tcprosServer = null;
        this._udprosServer = null;
        this._tcprosPort = null;
        this._udprosPort = null;
        this._publishers = {};
        this._subscribers = {};
        this._services = {};
        // ActionServers are listening to the shutdown event right now, each of which will add
        // listeners to RosNode for shutdown
        this.setMaxListeners(0);
        this._udpConnectionCounter = 0;
        this._log = LoggingManager_1.default.getLogger('ros.rosnodejs');
        this._debugLog = LoggingManager_1.default.getLogger('ros.superdebug');
        this._nodeName = nodeName;
        this._rosMasterAddress = rosMaster;
        this._masterApi = new MasterApiClient_1.default(this._rosMasterAddress);
        // the param server is hosted on the master -- share its xmlrpc client
        this._paramServerApi = new ParamServerApiClient_1.default(this._masterApi.getXmlrpcClient());
        this._setupTcprosServer(options.tcprosPort)
            .then(this._setupSlaveApi.bind(this, options.xmlrpcPort));
        this._setupUdprosServer(options.udprosPort);
        this._setupExitHandler(options.forceExit);
        this._setupSpinner(options.spinner);
        this._shutdown = false;
    }
    getLogger() {
        return this._log;
    }
    getSpinner() {
        return this._spinner;
    }
    getRosMasterUri() {
        return this._rosMasterAddress;
    }
    advertise(options) {
        let topic = options.topic;
        let pubImpl = this._publishers[topic];
        if (!pubImpl) {
            pubImpl = new PublisherImpl_1.default(options, this);
            this._publishers[topic] = pubImpl;
        }
        return new Publisher_1.default(pubImpl);
    }
    subscribe(options, callback) {
        let topic = options.topic;
        let subImpl = this._subscribers[topic];
        if (!subImpl) {
            subImpl = new SubscriberImpl_1.default(options, this);
            this._subscribers[topic] = subImpl;
        }
        const sub = new Subscriber_1.default(subImpl);
        if (callback && typeof callback === 'function') {
            sub.on('message', callback);
        }
        return sub;
    }
    advertiseService(options, callback) {
        let service = options.service;
        let serv = this._services[service];
        if (serv) {
            this._log.warn('Tried to advertise a service that is already advertised in this node [%s]', service);
            return;
        }
        // else
        serv = new ServiceServer_1.default(options, callback, this);
        this._services[service] = serv;
        return serv;
    }
    serviceClient(options) {
        return new ServiceClient_1.default(options, this);
    }
    unsubscribe(topic, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sub = this._subscribers[topic];
            if (sub) {
                this._debugLog.info('Unsubscribing from topic %s', topic);
                delete this._subscribers[topic];
                sub.shutdown();
                yield this.unregisterSubscriber(topic, options);
            }
        });
    }
    unadvertise(topic, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const pub = this._publishers[topic];
            if (pub) {
                this._debugLog.info('Unadvertising topic %s', topic);
                delete this._publishers[topic];
                pub.shutdown();
                yield this.unregisterPublisher(topic, options);
            }
        });
    }
    unadvertiseService(service, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = this._services[service];
            if (server) {
                this._debugLog.info('Unadvertising service %s', service);
                server.disconnect();
                delete this._services[service];
                yield this.unregisterService(service, options);
            }
        });
    }
    hasSubscriber(topic) {
        return this._subscribers.hasOwnProperty(topic);
    }
    hasPublisher(topic) {
        return this._publishers.hasOwnProperty(topic);
    }
    hasService(service) {
        return this._services.hasOwnProperty(service);
    }
    getNodeName() {
        return this._nodeName;
    }
    //------------------------------------------------------------------
    // Master API
    //------------------------------------------------------------------
    registerService(service, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._whenReady();
            return this._masterApi.registerService(this._nodeName, service, NetworkUtils.formatServiceUri(this._tcprosPort), this._getXmlrpcUri(), options);
        });
    }
    unregisterService(service, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._whenReady();
            return this._masterApi.unregisterService(this._nodeName, service, NetworkUtils.formatServiceUri(this._tcprosPort), options);
        });
    }
    registerSubscriber(topic, type, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._whenReady();
            return this._masterApi.registerSubscriber(this._nodeName, topic, type, this._getXmlrpcUri(), options);
        });
    }
    unregisterSubscriber(topic, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._whenReady();
            return this._masterApi.unregisterSubscriber(this._nodeName, topic, this._getXmlrpcUri(), options);
        });
    }
    registerPublisher(topic, type, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._whenReady();
            return this._masterApi.registerPublisher(this._nodeName, topic, type, this._getXmlrpcUri(), options);
        });
    }
    unregisterPublisher(topic, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._whenReady();
            return this._masterApi.unregisterPublisher(this._nodeName, topic, this._getXmlrpcUri(), options);
        });
    }
    lookupNode(nodeName, options) {
        return this._masterApi.lookupNode(this._nodeName, nodeName, options);
    }
    lookupService(service, options) {
        return this._masterApi.lookupService(this._nodeName, service, options);
    }
    getMasterUri(options) {
        return this._masterApi.getUri(this._nodeName, options);
    }
    getPublishedTopics(subgraph, options) {
        return this._masterApi.getPublishedTopics(this._nodeName, subgraph, options);
    }
    getTopicTypes(options) {
        return this._masterApi.getTopicTypes(this._nodeName, options);
    }
    getSystemState(options) {
        return this._masterApi.getSystemState(this._nodeName, options);
    }
    /**
     * Delays xmlrpc calls until our servers are set up
     * Since we need their ports for most of our calls.
     * @returns {Promise}
     * @private
     */
    _whenReady() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.serversReady()) {
                return new Promise((resolve) => {
                    this.once('slaveApiSetupComplete', () => {
                        resolve();
                    });
                });
            }
        });
    }
    _getXmlrpcUri() {
        // TODO: get host or ip or ...
        return 'http://' + NetworkUtils.getHost() + ':' + this._xmlrpcPort;
    }
    //------------------------------------------------------------------
    // Parameter Server API
    //------------------------------------------------------------------
    deleteParam(key) {
        return this._paramServerApi.deleteParam(this._nodeName, key);
    }
    setParam(key, value) {
        return this._paramServerApi.setParam(this._nodeName, key, value);
    }
    getParam(key) {
        return this._paramServerApi.getParam(this._nodeName, key);
    }
    hasParam(key) {
        return this._paramServerApi.hasParam(this._nodeName, key);
    }
    //------------------------------------------------------------------
    // Slave API
    //------------------------------------------------------------------
    /**
     * Send a topic request to another ros node
     * @param remoteAddress {string} ip address/hostname of node
     * @param remotePort {number} port of node
     * @param topic {string} topic we want a connection for
     * @param protocols {object} communication protocols this node supports (just TCPROS, really)
     */
    requestTopic(remoteAddress, remotePort, topic, protocols) {
        // every time we request a topic, it could be from a new node
        // so we create an xmlrpc client here instead of having a single one
        // for this object, like we do with the MasterApiClient
        let slaveApi = new SlaveApiClient_1.default(remoteAddress, remotePort);
        return slaveApi.requestTopic(this._nodeName, topic, protocols);
    }
    serversReady() {
        return this._xmlrpcPort !== null && this._tcprosPort !== null && this._udprosPort !== null;
    }
    shutdown() {
        return this._exit();
    }
    isShutdown() {
        return this._shutdown;
    }
    _setupSlaveApi(xmlrpcPort = null) {
        if (xmlrpcPort === null) {
            xmlrpcPort = 0;
        }
        return new Promise((resolve, reject) => {
            const server = xmlrpc.createServer({ port: xmlrpcPort }, () => {
                const { port } = server.httpServer.address();
                this._debugLog.debug('Slave API Listening on port ' + port);
                this._xmlrpcPort = port;
                this.emit('slaveApiSetupComplete', port);
            });
            server.on('NotFound', (method, params) => {
                this._log.warn('Method ' + method + ' does not exist: ' + params);
            });
            server.on('requestTopic', this._handleTopicRequest.bind(this));
            server.on('publisherUpdate', this._handlePublisherUpdate.bind(this));
            server.on('paramUpdate', this._handleParamUpdate.bind(this));
            server.on('getPublications', this._handleGetPublications.bind(this));
            server.on('getSubscriptions', this._handleGetSubscriptions.bind(this));
            server.on('getPid', this._handleGetPid.bind(this));
            server.on('shutdown', this._handleShutdown.bind(this));
            server.on('getMasterUri', this._handleGetMasterUri.bind(this));
            server.on('getBusInfo', this._handleGetBusInfo.bind(this));
            server.on('getBusStats', this._handleGetBusStats.bind(this));
            server.httpServer.on('clientError', (err, socket) => {
                this._log.error('XMLRPC Server socket error: %j', err);
            });
            this._slaveApiServer = server;
        });
    }
    _setupTcprosServer(tcprosPort = null) {
        let _createServer = (callback) => {
            const server = net.createServer((connection) => {
                const uri = connection.remoteAddress + ":" + connection.remotePort;
                this._debugLog.info('Node %s got connection from %s', this.getNodeName(), uri);
                // data from connections will be TCPROS encoded, so use a
                // DeserializeStream to handle any chunking
                const deserializeStream = new serialization_utils_1.DeserializeStream();
                connection.pipe(deserializeStream);
                deserializeStream.once('message', (headerData) => {
                    const header = tcprosUtils.parseTcpRosHeader(headerData);
                    if (!header) {
                        this._log.error('Unable to validate connection header %s', headerData);
                        connection.end(serialization_utils_1.serializeString('Unable to validate connection header'));
                        return;
                    }
                    this._debugLog.info('Got connection header: %j', header);
                    if (header.hasOwnProperty('topic')) {
                        // this is a subscriber, validate header and pass off connection to appropriate publisher
                        const topic = header.topic;
                        const pub = this._publishers[topic];
                        if (pub) {
                            pub.handleSubscriberConnection(connection, uri, header);
                        }
                        else {
                            // presumably this just means we shutdown the publisher after this
                            // subscriber started trying to connect to us
                            this._log.info('Got connection header for unknown topic %s', topic);
                        }
                    }
                    else if (header.hasOwnProperty('service')) {
                        // this is a service client, validate header and pass off connection to appropriate service provider
                        const service = header.service;
                        const serviceProvider = this._services[service];
                        if (serviceProvider) {
                            serviceProvider.handleClientConnection(connection, uri, deserializeStream, header);
                        }
                    }
                });
            });
            if (tcprosPort === null) {
                tcprosPort = 0;
            }
            server.listen(tcprosPort);
            this._tcprosServer = server;
            // it's possible the port was taken before we could use it
            server.on('error', (err) => {
                this._log.warn('Error on tcpros server! %j', err);
            });
            // the port was available
            server.on('listening', () => {
                const { port } = server.address();
                this._debugLog.info('Listening on %j', server.address());
                this._tcprosPort = port;
                callback();
            });
        };
        return new Promise((resolve) => {
            _createServer(resolve);
        });
    }
    _setupUdprosServer(udprosPort = null) {
        return new Promise((resolve) => {
            const socket = UDPSocket.createSocket('udp4');
            socket.on('error', (err) => {
                this._log.warn('Error on UDP client socket: %s', err);
                socket.close();
            });
            // init empty msg
            socket.on('message', (dgramMsg, rinfo) => {
                let header = UdprosUtils.deserializeHeader(dgramMsg);
                if (!header) {
                    this._log.warn('Unable to parse packet\'s header');
                    return;
                }
                // first dgram message
                const { connectionId } = header;
                let topic = Object.keys(this._subscribers).find(s => this._subscribers[s].getConnectionId() === connectionId);
                if (!this._subscribers[topic]) {
                    this._log.warn('Unable to find subscriberImpl for connection id: ' + connectionId);
                    return;
                }
                this._subscribers[topic].handleMessageChunk(header, dgramMsg);
            });
            socket.on('listening', () => {
                const address = socket.address();
                this._log.debug(`UDP socket bound: ${address.address}:${address.port}`);
                this._debugLog.info('Listening on %j', address);
                this._udprosPort = address.port;
                resolve();
            });
            this._udprosServer = socket;
            if (udprosPort === null) {
                udprosPort = 0;
            }
            socket.bind(udprosPort);
        });
    }
    _handleTopicRequest(...[err, req, callback]) {
        this._debugLog.info('Got topic request %j', req);
        const [_, topic, params] = req;
        if (!err) {
            let pub = this._publishers[topic];
            if (pub) {
                const protocol = params[0][0];
                if (protocol === 'TCPROS') {
                    let port = this._tcprosPort;
                    let resp = [
                        1,
                        'Allocated topic connection on port ' + port,
                        [
                            'TCPROS',
                            NetworkUtils.getHost(),
                            port
                        ]
                    ];
                    callback(null, resp);
                }
                else if (protocol === 'UDPROS') {
                    const [_, rawHeader, host, port, dgramSize] = params[0];
                    const header = tcprosUtils.parseTcpRosHeader(rawHeader);
                    const typeClass = messageUtils.getHandlerForMsgType(header.type, true);
                    const thishost = NetworkUtils.getHost();
                    const connId = ++this._udpConnectionCounter;
                    let resp = [
                        1,
                        '',
                        [
                            'UDPROS',
                            thishost,
                            port,
                            connId,
                            dgramSize,
                            UdprosUtils.createPubHeader(this.getNodeName(), typeClass.md5sum(), header.type, typeClass.messageDefinition())
                        ]
                    ];
                    pub.addUdpSubscriber(connId, thishost, port, dgramSize);
                    callback(null, resp);
                }
                else {
                    this._log.warn('Got topic request for unknown protocol [%s]', protocol);
                }
            }
        }
        else {
            this._log.error('Error during topic request: %s, %j', err, params);
            let resp = [
                0,
                'Unable to allocate topic connection for ' + topic,
                []
            ];
            callback('Error: Unknown topic ' + topic, resp);
        }
    }
    /**
     * Handle publisher update message from master
     * @param err was there an error
     * @param params {Array} [caller_id, topic, publishers]
     * @param callback function(err, resp) call when done handling message
     */
    _handlePublisherUpdate(...[err, params, callback]) {
        this._debugLog.info('Publisher update ' + err + ' params: ' + JSON.stringify(params));
        let topic = params[1];
        let sub = this._subscribers[topic];
        if (sub) {
            this._debugLog.info('Got sub for topic ' + topic);
            sub._handlePublisherUpdate(params[2]);
            callback(null, [1, 'Handled publisher update for topic ' + topic, 0]);
        }
        else {
            this._debugLog.warn(`Got publisher update for unknown topic ${topic}`);
            let err = 'Error: Unknown topic ' + topic;
            callback(err, [0, "Don't have topic " + topic, 0]);
        }
    }
    _handleParamUpdate(...[err, params, callback]) {
        this._log.error('ParamUpdate not implemented');
        callback('Not Implemented');
    }
    _handleGetPublications(...[err, params, callback]) {
        let pubs = [];
        Object.keys(this._publishers).forEach((topic) => {
            let pub = this._publishers[topic];
            pubs.push([topic, pub.getType()]);
        });
        callback(null, [
            1,
            'Returning list of publishers on node ' + this._nodeName,
            pubs
        ]);
    }
    _handleGetSubscriptions(...[err, params, callback]) {
        let subs = [];
        Object.keys(this._subscribers).forEach((topic) => {
            let sub = this._subscribers[topic];
            subs.push([topic, sub.getType()]);
        });
        callback(null, [
            1,
            'Returning list of publishers on node ' + this._nodeName,
            subs
        ]);
    }
    _handleGetPid(...[err, params, callback]) {
        callback(null, [1, 'Returning process id', process.pid]);
    }
    _handleShutdown(...[err, params, callback]) {
        let caller = params[0];
        this._log.warn('Received shutdown command from ' + caller);
        this.shutdown();
        callback(null, [1, 'Shutdown', 1]);
    }
    _handleGetMasterUri(...[err, params, callback]) {
        callback(null, [1, 'Returning master uri for node ' + this._nodeName, this._rosMasterAddress]);
    }
    _handleGetBusInfo(...[err, params, callback]) {
        const busInfo = [];
        let count = 0;
        Object.keys(this._subscribers).forEach((topic) => {
            const sub = this._subscribers[topic];
            sub.getClientUris().forEach((clientUri) => {
                busInfo.push([
                    ++count,
                    clientUri,
                    'i',
                    sub.getTransport(),
                    sub.getTopic(),
                    true
                ]);
            });
        });
        Object.keys(this._publishers).forEach((topic) => {
            const pub = this._publishers[topic];
            pub.getClientUris().forEach((clientUri) => {
                busInfo.push([
                    ++count,
                    clientUri,
                    'o',
                    pub.isUdpSubscriber(clientUri) ? 'UDPROS' : 'TCPROS',
                    pub.getTopic(),
                    true
                ]);
            });
        });
        callback(null, [1, this.getNodeName(), busInfo]);
    }
    _handleGetBusStats(...[err, params, callback]) {
        this._log.error('GetBusStats not implemented');
        callback('Not implemented');
    }
    /**
     * Initializes the spinner for this node.
     * @param [spinnerOpts] {object} either an instance of a spinner to use or the parameters to configure one
     * @param [spinnerOpts.type] {string} type of spinner to create
     */
    _setupSpinner(spinnerOpts) {
        if (spinnerOpts) {
            if (isSpinner(spinnerOpts)) {
                // looks like they created their own spinner
                this._spinner = spinnerOpts;
            }
            else {
                switch (spinnerOpts.type) {
                    case 'Global':
                        this._spinner = new GlobalSpinner_1.default(spinnerOpts);
                        break;
                }
            }
        }
        else {
            this._spinner = new GlobalSpinner_1.default();
        }
    }
    _setupExitHandler(forceExit) {
        // we need to catch that this process is about to exit so we can unregister all our
        // publishers, subscribers, and services
        let exitHandler;
        let sigIntHandler;
        const exitImpl = function exit(killProcess = false) {
            return __awaiter(this, void 0, void 0, function* () {
                this._shutdown = true;
                this.emit('shutdown');
                this._log.info('Ros node ' + this._nodeName + ' beginning shutdown at ' + Date.now());
                const clearXmlrpcQueues = () => {
                    this._masterApi.getXmlrpcClient().clear();
                };
                const shutdownServer = (server, name) => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            this._log.info('Timed out shutting down %s server', name);
                            resolve();
                        }, 200);
                        server.close(() => {
                            clearTimeout(timeout);
                            this._log.info('Server %s shutdown', name);
                            resolve();
                        });
                    })
                        .catch((err) => {
                        // no op
                        this._log.warn('Error shutting down server %s: %s', name, err);
                    });
                });
                // shutdown servers first so we don't accept any new connections
                // while unregistering
                const promises = [
                    shutdownServer(this._slaveApiServer, 'slaveapi'),
                    shutdownServer(this._tcprosServer, 'tcpros'),
                    shutdownServer(this._udprosServer, 'udpros')
                ];
                // clear out any existing calls that may block us when we try to unregister
                clearXmlrpcQueues();
                // remove all publishers, subscribers, and services.
                // remove subscribers first so that master doesn't send
                // publisherUpdate messages.
                // set maxAttempts so that we don't spend forever trying to connect
                // to a possibly non-existant ROS master.
                const unregisterPromises = [];
                Object.keys(this._subscribers).forEach((topic) => {
                    unregisterPromises.push(this.unsubscribe(topic, { maxAttempts: 1 }));
                });
                Object.keys(this._publishers).forEach((topic) => {
                    unregisterPromises.push(this.unadvertise(topic, { maxAttempts: 1 }));
                });
                Object.keys(this._services).forEach((service) => {
                    unregisterPromises.push(this.unadvertiseService(service, { maxAttempts: 1 }));
                });
                const waitForUnregister = () => __awaiter(this, void 0, void 0, function* () {
                    // catch any errors while unregistering
                    // and don't bother external callers about it.
                    try {
                        yield Promise.all(unregisterPromises);
                        this._log.info('Finished unregistering from ROS master!');
                    }
                    catch (err) {
                        this._log.warn('Error unregistering from ROS master: %s', err);
                    }
                    finally {
                        clearXmlrpcQueues();
                    }
                });
                promises.push(waitForUnregister());
                this._spinner.clear();
                LoggingManager_1.default.stopLogCleanup();
                process.removeListener('exit', exitHandler);
                process.removeListener('SIGINT', sigIntHandler);
                if (killProcess) {
                    // we can't really block the exit process, just have to hope it worked...
                    try {
                        yield Promise.all(promises);
                    }
                    finally {
                        process.exit();
                    }
                }
                // else
                yield Promise.all(promises);
            });
        };
        this._exit = exitImpl;
        exitHandler = exitImpl.bind(this);
        sigIntHandler = exitImpl.bind(this, !!forceExit);
        process.once('exit', exitHandler);
        process.once('SIGINT', sigIntHandler);
    }
}
exports.default = RosNode;
function isSpinner(s) {
    return typeof s.type !== 'string';
}
//# sourceMappingURL=RosNode.js.map