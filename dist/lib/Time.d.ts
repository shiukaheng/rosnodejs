import * as timeUtils from '../utils/time_utils';
import { RosTime } from '../types/RosTypes';
declare const Time: {
    useSimTime: boolean;
    _initializeRosTime(rosnodejs: any, notime: boolean): Promise<void>;
    now(): RosTime;
    rosTimeToDate: typeof timeUtils.rosTimeToDate;
    dateToRosTime: typeof timeUtils.dateToRosTime;
    epoch: typeof timeUtils.epoch;
    isZeroTime: typeof timeUtils.isZeroTime;
    toNumber: typeof timeUtils.toNumber;
    toSeconds: typeof timeUtils.toSeconds;
    timeComp: typeof timeUtils.timeComp;
    add: typeof timeUtils.add;
    lt: typeof timeUtils.lt;
};
export default Time;
