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
//------------------------------------------------------------------
const netUtils = require("./utils/network_utils");
const msgUtils = require("./utils/message_utils");
const OnTheFlyMessages = require("./utils/messageGeneration/OnTheFlyMessages");
const util = require("util");
const RosLogStream_1 = require("./utils/log/RosLogStream");
const ConsoleLogStream_1 = require("./utils/log/ConsoleLogStream");
const RosNode_1 = require("./lib/RosNode");
const NodeHandle_1 = require("./lib/NodeHandle");
const LoggingManager_1 = require("./lib/LoggingManager");
const Time_1 = require("./lib/Time");
const packages = require("./utils/messageGeneration/packages");
const ActionServer_1 = require("./actions/ActionServer");
const ActionClient_1 = require("./actions/ActionClient");
const ClientStates = require("./actions/ClientStates");
const SimpleActionClient_1 = require("./actions/SimpleActionClient");
const SimpleActionServer_1 = require("./actions/SimpleActionServer");
const MessageLoader_1 = require("./utils/messageGeneration/MessageLoader");
const RemapUtils = require("./utils/remapping_utils");
const Names_1 = require("./lib/Names");
const ThisNode_1 = require("./lib/ThisNode");
// will be initialized through call to initNode
let log = LoggingManager_1.default.getLogger();
//------------------------------------------------------------------
const Rosnodejs = {
    /**
     * Initializes a ros node for this process. Only one ros node can exist per process.
     * If called a second time with the same nodeName, returns a handle to that node.
     * @param {string} nodeName name of the node to initialize
     * @param {object} options  overrides for this node
     * @param {boolean}   options.anonymous Set node to be anonymous
     * @param {object}    options.logging logger options for this node
     * @param {function}  options.logging.getLoggers  the function for setting which loggers
     *                                                to be used for this node
     * @param {function}  options.logging.setLoggerLevel  the function for setting the logger
     *                                                    level
     * @param {string}    options.rosMasterUri the Master URI to use for this node
     * @param {number}    options.timeout time in ms to wait for node to be initialized
     *                                    before timing out. A negative value will retry forever.
     *                                    A value of '0' will try once before stopping. @default -1
     * @return {Promise} resolved when connection to master is established
     */
    initNode(nodeName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof nodeName !== 'string') {
                throw new Error('The node name must be a string');
            }
            else if (nodeName.length === 0) {
                throw new Error('The node name must not be empty!');
            }
            options = options || {};
            // process remappings from command line arguments.
            // First two are $ node <file> so we skip them
            const remappings = RemapUtils.processRemapping(process.argv.slice(2));
            // initialize netUtils from possible command line remappings
            netUtils.init(remappings);
            const [resolvedName, namespace] = _resolveNodeName(nodeName, remappings, options);
            Names_1.default.init(remappings, namespace);
            if (ThisNode_1.default.node !== null) {
                if (resolvedName === ThisNode_1.default.getNodeName()) {
                    return this.getNodeHandle();
                }
                // else
                return Promise.reject(Error('Unable to initialize node [' + resolvedName + '] - node ['
                    + ThisNode_1.default.getNodeName() + '] already exists'));
            }
            LoggingManager_1.default.initializeNodeLogger(resolvedName, options.logging);
            // create the ros node. Return a promise that will
            // resolve when connection to master is established
            const nodeOpts = options.node || {};
            const rosMasterUri = options.rosMasterUri || remappings['__master'] || process.env.ROS_MASTER_URI;
            ;
            ThisNode_1.default.node = new RosNode_1.default(resolvedName, rosMasterUri, nodeOpts);
            try {
                yield this._loadOnTheFlyMessages(options.onTheFly);
                yield waitForMaster(100, options.timeout);
                yield LoggingManager_1.default.initializeRosOptions(new NodeHandle_1.default(ThisNode_1.default.node), options.logging);
                yield Time_1.default._initializeRosTime(this, options.notime);
                return this.getNodeHandle();
            }
            catch (err) {
                log.error('Error during initialization: ' + err);
                if (this.ok()) {
                    yield this.shutdown();
                }
                throw err;
            }
        });
    },
    reset() {
        ThisNode_1.default.node = null;
    },
    shutdown() {
        return ThisNode_1.default.shutdown();
    },
    ok() {
        return ThisNode_1.default.ok();
    },
    on(evt, handler) {
        if (ThisNode_1.default.node) {
            ThisNode_1.default.node.on(evt, handler);
        }
    },
    once(evt, handler) {
        if (ThisNode_1.default.node) {
            ThisNode_1.default.node.once(evt, handler);
        }
    },
    removeListener(evt, handler) {
        if (ThisNode_1.default.node) {
            ThisNode_1.default.node.removeListener(evt, handler);
        }
    },
    _loadOnTheFlyMessages(onTheFly) {
        return __awaiter(this, void 0, void 0, function* () {
            if (onTheFly) {
                return OnTheFlyMessages.getAll();
            }
        });
    },
    loadPackage(packageName, outputDir = null, verbose = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgLoader = new MessageLoader_1.default(verbose);
            if (!outputDir) {
                outputDir = msgUtils.getTopLevelMessageDirectory();
            }
            yield msgLoader.buildPackage(packageName, outputDir);
            console.log('Finished building messages!');
        });
    },
    loadAllPackages(outputDir = null, verbose = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgLoader = new MessageLoader_1.default(verbose);
            if (!outputDir) {
                outputDir = msgUtils.getTopLevelMessageDirectory();
            }
            yield msgLoader.buildPackageTree(outputDir);
            console.log('Finished building messages!');
        });
    },
    findPackage(packageName) {
        return packages.findPackage(packageName);
    },
    require(msgPackage) {
        return msgUtils.requireMsgPackage(msgPackage);
    },
    getAvailableMessagePackages() {
        return msgUtils.getAvailableMessagePackages();
    },
    /** check that a message definition is loaded for a ros message
        type, e.g., geometry_msgs/Twist */
    checkMessage(type) {
        const parts = type.split('/');
        let rtv;
        try {
            rtv = this.require(parts[0]).msg[parts[1]];
        }
        catch (e) { }
        return rtv;
    },
    /** check that a service definition is loaded for a ros service
        type, e.g., turtlesim/TeleportRelative */
    checkService(type) {
        const parts = type.split('/');
        let rtv;
        try {
            rtv = this.require(parts[0]).srv[parts[1]];
        }
        catch (e) { }
        return rtv;
    },
    /**
     * @return {NodeHandle} for initialized node
     */
    getNodeHandle(namespace) {
        return new NodeHandle_1.default(ThisNode_1.default.node, namespace);
    },
    get nodeHandle() {
        return new NodeHandle_1.default(ThisNode_1.default.node);
    },
    get nh() {
        return new NodeHandle_1.default(ThisNode_1.default.node);
    },
    get log() {
        return LoggingManager_1.default;
    },
    get logStreams() {
        return {
            console: ConsoleLogStream_1.default,
            ros: RosLogStream_1.default
        };
    },
    get Time() {
        return Time_1.default;
    },
    //------------------------------------------------------------------
    // ActionLib
    //------------------------------------------------------------------
    /**
      Get an action client for a given type and action server.
  
      **Deprecated**: Use rosNode.nh.actionClientInterface instead.
  
      Example:
        let ac = rosNode.nh.getActionClient(
          "/turtle_shape", "turtle_actionlib/ShapeAction");
        let shapeActionGoal =
          rosnodejs.require('turtle_actionlib').msg.ShapeActionGoal;
        ac.sendGoal(new shapeActionGoal({ goal: { edges: 3,  radius: 1 } }));
     */
    getActionClient(options) {
        return this.nh.actionClientInterface(options.actionServer, options.type, options);
    },
    ActionServer: ActionServer_1.default,
    ActionClient: ActionClient_1.default,
    SimpleActionServer: SimpleActionServer_1.default,
    SimpleActionClient: SimpleActionClient_1.default,
    SimpleClientGoalState: ClientStates.SimpleClientGoalState
};
exports.default = Rosnodejs;
//------------------------------------------------------------------
// Local Helper Functions
//------------------------------------------------------------------
/**
 * @private
 * Helper function to see if the master is available and able to accept
 * connections.
 * @param {number} timeout time in ms between connection attempts
 * @param {number} maxTimeout maximum time in ms to retry before timing out.
 * A negative number will make it retry forever. 0 will only make one attempt
 * before timing out.
 */
function waitForMaster(timeout = 100, maxTimeout = -1) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = Date.now();
        yield sleep(timeout);
        while (ThisNode_1.default.ok() && !ThisNode_1.default.node.serversReady()) {
            if (maxTimeout >= 0 && Date.now() - startTime >= maxTimeout) {
                log.error(`Unable to register with master node [${ThisNode_1.default.node.getRosMasterUri()}]: unable to set up slave API Server. Stopping...`);
                throw new Error('Unable to setup slave API server.');
            }
            yield sleep(timeout);
        }
        while (ThisNode_1.default.ok()) {
            try {
                yield ThisNode_1.default.node.getMasterUri({ maxAttempts: 1 });
                log.info(`Connected to master at ${ThisNode_1.default.node.getRosMasterUri()}!`);
                break;
            }
            catch (err) {
                if (ThisNode_1.default.ok()) {
                    if (maxTimeout >= 0 && Date.now() - startTime >= maxTimeout) {
                        log.error(`Timed out before registering with master node [${ThisNode_1.default.node.getRosMasterUri()}]: master may not be running yet.`);
                        throw new Error('Registration with master timed out.');
                    }
                    else {
                        log.warnThrottle(60000, `Unable to register with master node [${ThisNode_1.default.node.getRosMasterUri()}]: master may not be running yet. Will keep trying.`);
                        yield sleep(timeout);
                    }
                }
                else {
                    log.warn(`Shutdown while trying to register with master node`);
                    throw new Error('Shutdown during initialization');
                }
            }
        }
        if (!ThisNode_1.default.ok()) {
            log.warn(`Shutdown while trying to register with master node`);
            throw new Error('Shutdown during initialization');
        }
    });
}
function sleep(timeout) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}
function _resolveNodeName(nodeName, remappings, options) {
    let namespace = remappings['__ns'] || process.env.ROS_NAMESPACE || '';
    namespace = Names_1.default.clean(namespace);
    if (namespace.length === 0 || !namespace.startsWith('/')) {
        namespace = `/${namespace}`;
    }
    Names_1.default.validate(namespace, true);
    nodeName = remappings['__name'] || nodeName;
    nodeName = Names_1.default.resolve(namespace, nodeName);
    // only anonymize node name if they didn't remap from the command line
    if (options.anonymous && !remappings['__name']) {
        nodeName = _anonymizeNodeName(nodeName);
    }
    return [nodeName, namespace];
}
/**
 * Appends a random string of numeric characters to the end
 * of the node name. Follows rospy logic.
 * @param nodeName {string} string to anonymize
 * @return {string} anonymized nodeName
 */
function _anonymizeNodeName(nodeName) {
    return util.format('%s_%s_%s', nodeName, process.pid, Date.now());
}
//# sourceMappingURL=index.js.map