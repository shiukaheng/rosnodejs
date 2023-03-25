"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Time_1 = require("../lib/Time");
let GOAL_COUNT = 0;
function GoalIdGenerator(nodeHandle, now) {
    if (!now || now.secs === undefined || now.nsecs === undefined) {
        now = Time_1.default.now();
    }
    ++GOAL_COUNT;
    if (GOAL_COUNT > Number.MAX_SAFE_INTEGER) {
        GOAL_COUNT = 0;
    }
    return `${nodeHandle.getNodeName()}-${GOAL_COUNT}-${now.secs}.${now.nsecs}`;
}
exports.default = GoalIdGenerator;
//# sourceMappingURL=GoalIdGenerator.js.map