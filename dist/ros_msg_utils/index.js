"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deserialize = exports.Serialize = void 0;
const base_serialize_1 = require("./lib/base_serialize");
exports.Serialize = base_serialize_1.default;
const base_deserialize_1 = require("./lib/base_deserialize");
exports.Deserialize = base_deserialize_1.default;
var encoding_utils_1 = require("./lib/encoding_utils");
Object.defineProperty(exports, "getByteLength", { enumerable: true, get: function () { return encoding_utils_1.getByteLength; } });
__exportStar(require("./lib/message_cache"), exports);
//# sourceMappingURL=index.js.map