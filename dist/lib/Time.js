"use strict";
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
const timeUtils = require("../utils/time_utils");
let simTimeSub = null;
let simTime = timeUtils.dateToRosTime(0);
function handleSimTimeMessage(msg) {
    simTime = msg.clock;
}
const Time = {
    useSimTime: false,
    _initializeRosTime(rosnodejs, notime) {
        return __awaiter(this, void 0, void 0, function* () {
            //Only for testing purposes!
            if (notime) {
                return;
            }
            const nh = rosnodejs.nh;
            try {
                this.useSimTime = yield nh.getParam('/use_sim_time');
                if (this.useSimTime) {
                    simTimeSub = nh.subscribe('/clock', 'rosgraph_msgs/Clock', handleSimTimeMessage, { throttleMs: -1 });
                }
            }
            catch (err) {
                if (err.statusCode === undefined) {
                    throw err;
                }
            }
        });
    },
    now() {
        if (this.useSimTime) {
            return simTime;
        }
        // else
        return timeUtils.now();
    },
    rosTimeToDate: timeUtils.rosTimeToDate,
    dateToRosTime: timeUtils.dateToRosTime,
    epoch: timeUtils.epoch,
    isZeroTime: timeUtils.isZeroTime,
    toNumber: timeUtils.toNumber,
    toSeconds: timeUtils.toSeconds,
    timeComp: timeUtils.timeComp,
    add: timeUtils.add,
    lt: timeUtils.lt,
};
exports.default = Time;
//# sourceMappingURL=Time.js.map