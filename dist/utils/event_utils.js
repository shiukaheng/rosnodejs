"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebroadcast = void 0;
function rebroadcast(evt, emitter, rebroadcaster) {
    emitter.on(evt, function broadcast(...d) { rebroadcaster.emit(evt, ...d); });
}
exports.rebroadcast = rebroadcast;
//# sourceMappingURL=event_utils.js.map