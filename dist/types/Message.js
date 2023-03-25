"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionMsgs = void 0;
var ActionMsgs;
(function (ActionMsgs) {
    let Status;
    (function (Status) {
        Status[Status["PENDING"] = 0] = "PENDING";
        Status[Status["ACTIVE"] = 1] = "ACTIVE";
        Status[Status["PREEMPTED"] = 2] = "PREEMPTED";
        Status[Status["SUCCEEDED"] = 3] = "SUCCEEDED";
        Status[Status["ABORTED"] = 4] = "ABORTED";
        Status[Status["REJECTED"] = 5] = "REJECTED";
        Status[Status["PREEMPTING"] = 6] = "PREEMPTING";
        Status[Status["RECALLING"] = 7] = "RECALLING";
        Status[Status["RECALLED"] = 8] = "RECALLED";
        Status[Status["LOST"] = 9] = "LOST";
    })(Status = ActionMsgs.Status || (ActionMsgs.Status = {}));
})(ActionMsgs = exports.ActionMsgs || (exports.ActionMsgs = {}));
//# sourceMappingURL=Message.js.map