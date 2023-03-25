"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommState = exports.SimpleClientGoalState = exports.SimpleGoalState = void 0;
var SimpleGoalState;
(function (SimpleGoalState) {
    SimpleGoalState["PENDING"] = "PENDING";
    SimpleGoalState["ACTIVE"] = "ACTIVE";
    SimpleGoalState["DONE"] = "DONE";
})(SimpleGoalState = exports.SimpleGoalState || (exports.SimpleGoalState = {}));
;
var SimpleClientGoalState;
(function (SimpleClientGoalState) {
    SimpleClientGoalState["PENDING"] = "PENDING";
    SimpleClientGoalState["ACTIVE"] = "ACTIVE";
    SimpleClientGoalState["RECALLED"] = "RECALLED";
    SimpleClientGoalState["REJECTED"] = "REJECTED";
    SimpleClientGoalState["PREEMPTED"] = "PREEMPTED";
    SimpleClientGoalState["ABORTED"] = "ABORTED";
    SimpleClientGoalState["SUCCEEDED"] = "SUCCEEDED";
    SimpleClientGoalState["LOST"] = "LOST";
})(SimpleClientGoalState = exports.SimpleClientGoalState || (exports.SimpleClientGoalState = {}));
;
var CommState;
(function (CommState) {
    CommState[CommState["WAITING_FOR_GOAL_ACK"] = 0] = "WAITING_FOR_GOAL_ACK";
    CommState[CommState["PENDING"] = 1] = "PENDING";
    CommState[CommState["ACTIVE"] = 2] = "ACTIVE";
    CommState[CommState["WAITING_FOR_RESULT"] = 3] = "WAITING_FOR_RESULT";
    CommState[CommState["WAITING_FOR_CANCEL_ACK"] = 4] = "WAITING_FOR_CANCEL_ACK";
    CommState[CommState["RECALLING"] = 5] = "RECALLING";
    CommState[CommState["PREEMPTING"] = 6] = "PREEMPTING";
    CommState[CommState["DONE"] = 7] = "DONE";
})(CommState = exports.CommState || (exports.CommState = {}));
;
//# sourceMappingURL=ClientStates.js.map