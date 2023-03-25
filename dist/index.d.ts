import RosLogStream from './utils/log/RosLogStream';
import ConsoleLogStream from './utils/log/ConsoleLogStream';
import NodeHandle from './lib/NodeHandle';
import ActionServer from './actions/ActionServer';
import ActionClient from './actions/ActionClient';
import * as ClientStates from './actions/ClientStates';
import SimpleActionClient from './actions/SimpleActionClient';
import SimpleActionServer from './actions/SimpleActionServer';
import type { ActionClientInterfaceOptions } from './lib/ActionClientInterface';
declare const Rosnodejs: {
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
    initNode(nodeName: string, options: any): Promise<NodeHandle>;
    reset(): void;
    shutdown(): Promise<void>;
    ok(): boolean;
    on<T extends any[]>(evt: string, handler: (...args: T) => void): void;
    once<T_1 extends any[]>(evt: string, handler: (...args: T_1) => void): void;
    removeListener<T_2 extends any[]>(evt: string, handler: (...args: T_2) => void): void;
    _loadOnTheFlyMessages(onTheFly: boolean): Promise<void>;
    loadPackage(packageName: string, outputDir?: string, verbose?: boolean): Promise<void>;
    loadAllPackages(outputDir?: string, verbose?: boolean): Promise<void>;
    findPackage(packageName: string): Promise<string>;
    require(msgPackage: string): import("./types/Message").MessageRegistryPackageEntry;
    getAvailableMessagePackages(): {
        [key: string]: string;
    };
    /** check that a message definition is loaded for a ros message
        type, e.g., geometry_msgs/Twist */
    checkMessage<T_3 = any>(type: string): T_3;
    /** check that a service definition is loaded for a ros service
        type, e.g., turtlesim/TeleportRelative */
    checkService<T_4 = any>(type: string): T_4;
    /**
     * @return {NodeHandle} for initialized node
     */
    getNodeHandle(namespace?: string): NodeHandle;
    readonly nodeHandle: NodeHandle;
    readonly nh: NodeHandle;
    readonly log: import("./lib/LoggingManager").LoggingManager;
    readonly logStreams: {
        console: typeof ConsoleLogStream;
        ros: typeof RosLogStream;
    };
    readonly Time: {
        useSimTime: boolean;
        _initializeRosTime(rosnodejs: any, notime: boolean): Promise<void>;
        now(): import("./types/RosTypes").RosTime;
        rosTimeToDate: typeof import("./utils/time_utils").rosTimeToDate;
        dateToRosTime: typeof import("./utils/time_utils").dateToRosTime;
        epoch: typeof import("./utils/time_utils").epoch;
        isZeroTime: typeof import("./utils/time_utils").isZeroTime;
        toNumber: typeof import("./utils/time_utils").toNumber;
        toSeconds: typeof import("./utils/time_utils").toSeconds;
        timeComp: typeof import("./utils/time_utils").timeComp;
        add: typeof import("./utils/time_utils").add;
        lt: typeof import("./utils/time_utils").lt;
    };
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
    getActionClient(options: Omit<ActionClientInterfaceOptions, 'nh'>): any;
    ActionServer: typeof ActionServer;
    ActionClient: typeof ActionClient;
    SimpleActionServer: typeof SimpleActionServer;
    SimpleActionClient: typeof SimpleActionClient;
    SimpleClientGoalState: typeof ClientStates.SimpleClientGoalState;
};
export default Rosnodejs;