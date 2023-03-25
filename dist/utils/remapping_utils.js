"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRemapping = exports.SPECIAL_KEYS = void 0;
var SPECIAL_KEYS;
(function (SPECIAL_KEYS) {
    SPECIAL_KEYS["name"] = "__name";
    SPECIAL_KEYS["log"] = "__log";
    SPECIAL_KEYS["ip"] = "__ip";
    SPECIAL_KEYS["hostname"] = "__hostname";
    SPECIAL_KEYS["master"] = "__master";
    SPECIAL_KEYS["ns"] = "__ns";
})(SPECIAL_KEYS = exports.SPECIAL_KEYS || (exports.SPECIAL_KEYS = {}));
;
function processRemapping(args) {
    const len = args.length;
    const remapping = {};
    for (let i = 0; i < len; ++i) {
        const arg = args[i];
        let p = arg.indexOf(':=');
        if (p >= 0) {
            const local = arg.substring(0, p);
            const external = arg.substring(p + 2);
            remapping[local] = external;
        }
    }
    return remapping;
}
exports.processRemapping = processRemapping;
//# sourceMappingURL=remapping_utils.js.map