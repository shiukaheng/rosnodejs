/// <reference path="../../../types.d.ts" />
declare type Formatter = (r: any) => string;
export declare type ConsoleOptions = {
    formatter: Formatter;
};
export default class ConsoleLogStream {
    private _formatter;
    constructor(options: ConsoleOptions);
    write(rec: any): void;
}
export {};