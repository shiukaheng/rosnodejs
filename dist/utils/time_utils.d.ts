import { RosTime } from "../types/RosTypes";
export declare function rosTimeToDate(rosTime: RosTime): Date;
export declare function dateToRosTime(date: number): RosTime;
export declare function now(): RosTime;
export declare function epoch(): RosTime;
export declare function isZeroTime(t: RosTime): boolean;
export declare function toNumber(t: RosTime): number;
export declare function add(a: RosTime, b: RosTime): RosTime;
export declare function lt(a: RosTime, b: RosTime): boolean;
export declare function toSeconds(t: RosTime): number;
export declare function timeComp(a: RosTime, b: RosTime): number;
