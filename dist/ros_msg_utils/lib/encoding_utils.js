"use strict";
/*
 *    Copyright 2016 Rethink Robotics
 *
 *    Copyright 2016 Chris Smith
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getByteLength = void 0;
/**
 * Returns the number of bytes in a string (using utf8 encoding),
 * in order to know the length needed to serialize it into a Buffer
 * @param strValue
 * @return {Number}
 */
function getByteLength(strValue) {
    return Buffer.byteLength(strValue, 'utf8');
}
exports.getByteLength = getByteLength;
//# sourceMappingURL=encoding_utils.js.map