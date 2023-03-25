"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const base_serialize_1 = require("../lib/base_serialize");
const base_deserialize_1 = require("../lib/base_deserialize");
const BN = require("bn.js");
mocha_1.describe('Deserialization Tests', () => {
    mocha_1.it('Uint8', () => {
        const buf = Buffer.alloc(5);
        base_serialize_1.default.Array.uint8([1, 2, 3, 255, 0], buf, 0, 5);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.uint8(buf, bufferOffset)).to.equal(1);
        chai_1.expect(bufferOffset[0]).to.equal(1);
        chai_1.expect(base_deserialize_1.default.uint8(buf, bufferOffset)).to.equal(2);
        chai_1.expect(bufferOffset[0]).to.equal(2);
        chai_1.expect(base_deserialize_1.default.uint8(buf, bufferOffset)).to.equal(3);
        chai_1.expect(bufferOffset[0]).to.equal(3);
        chai_1.expect(base_deserialize_1.default.uint8(buf, bufferOffset)).to.equal(255);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.uint8(buf, bufferOffset)).to.equal(0);
        chai_1.expect(bufferOffset[0]).to.equal(5);
    });
    mocha_1.it('Uint8 Array', () => {
        const buf = Buffer.alloc(14);
        base_serialize_1.default.Array.uint8([1, 2], buf, 0, -1);
        base_serialize_1.default.Array.uint8([3, 1, 2], buf, 6, 3);
        base_serialize_1.default.Array.uint8([3], buf, 9, -1);
        const bufferOffset = [0];
        chai_1.expect(Array.from(base_deserialize_1.default.Array.uint8(buf, bufferOffset, -1))).to.deep.equal([1, 2]);
        chai_1.expect(bufferOffset[0]).to.equal(6);
        chai_1.expect(Array.from(base_deserialize_1.default.Array.uint8(buf, bufferOffset, 3))).to.deep.equal([3, 1, 2]);
        chai_1.expect(bufferOffset[0]).to.equal(9);
        chai_1.expect(Array.from(base_deserialize_1.default.Array.uint8(buf, bufferOffset, -1))).to.deep.equal([3]);
        chai_1.expect(bufferOffset[0]).to.equal(14);
    });
    mocha_1.it('Uint16', () => {
        const buf = Buffer.alloc(14);
        base_serialize_1.default.Array.uint16([65024, 257, 254, 65535], buf, 0, 4);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.uint16(buf, bufferOffset)).to.equal(65024);
        chai_1.expect(bufferOffset[0]).to.equal(2);
        chai_1.expect(base_deserialize_1.default.uint16(buf, bufferOffset)).to.equal(257);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.uint16(buf, bufferOffset)).to.equal(254);
        chai_1.expect(bufferOffset[0]).to.equal(6);
        chai_1.expect(base_deserialize_1.default.uint16(buf, bufferOffset)).to.equal(65535);
        chai_1.expect(bufferOffset[0]).to.equal(8);
    });
    mocha_1.it('Uint16 Array', () => {
        const buf = Buffer.alloc(20);
        base_serialize_1.default.Array.uint16([65024, 257], buf, 0, -1);
        base_serialize_1.default.Array.uint16([254], buf, 8, 1);
        base_serialize_1.default.Array.uint16([20, 16, 2], buf, 10, -1);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.Array.uint16(buf, bufferOffset, -1)).to.deep.equal([65024, 257]);
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(base_deserialize_1.default.Array.uint16(buf, bufferOffset, 1)).to.deep.equal([254]);
        chai_1.expect(bufferOffset[0]).to.equal(10);
        chai_1.expect(base_deserialize_1.default.Array.uint16(buf, bufferOffset, -1)).to.deep.equal([20, 16, 2]);
        chai_1.expect(bufferOffset[0]).to.equal(20);
    });
    mocha_1.it('Uint32', () => {
        const buf = Buffer.alloc(16);
        base_serialize_1.default.Array.uint32([4294967295, 0, 369131520, 168427616], buf, 0, 4);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.uint32(buf, bufferOffset)).to.equal(4294967295);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.uint32(buf, bufferOffset)).to.equal(0);
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(base_deserialize_1.default.uint32(buf, bufferOffset)).to.equal(369131520);
        chai_1.expect(bufferOffset[0]).to.equal(12);
        chai_1.expect(base_deserialize_1.default.uint32(buf, bufferOffset)).to.equal(168427616);
        chai_1.expect(bufferOffset[0]).to.equal(16);
    });
    mocha_1.it('Uint32 Array', () => {
        const buf = Buffer.alloc(28);
        base_serialize_1.default.Array.uint32([4294967295, 0], buf, 0, -1);
        base_serialize_1.default.Array.uint32([369131520], buf, 12, -1);
        base_serialize_1.default.Array.uint32([168427616, 12], buf, 20, 2);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.Array.uint32(buf, bufferOffset, -1)).to.deep.equal([4294967295, 0]);
        chai_1.expect(bufferOffset[0]).to.equal(12);
        chai_1.expect(base_deserialize_1.default.Array.uint32(buf, bufferOffset, -1)).to.deep.equal([369131520]);
        chai_1.expect(bufferOffset[0]).to.equal(20);
        chai_1.expect(base_deserialize_1.default.Array.uint32(buf, bufferOffset, 2)).to.deep.equal([168427616, 12]);
        chai_1.expect(bufferOffset[0]).to.equal(28);
    });
    mocha_1.it('Uint64', () => {
        const buf = Buffer.alloc(32);
        const bignums = [
            new BN('9223372036854775807'),
            new BN('18446744073709551615'),
            new BN('123'),
            new BN('8080808080')
        ];
        base_serialize_1.default.Array.uint64(bignums, buf, 0, 4);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.uint64(buf, bufferOffset).eq(bignums[0])).to.be.true;
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(base_deserialize_1.default.uint64(buf, bufferOffset).eq(bignums[1])).to.be.true;
        chai_1.expect(bufferOffset[0]).to.equal(16);
        chai_1.expect(base_deserialize_1.default.uint64(buf, bufferOffset).eq(bignums[2])).to.be.true;
        chai_1.expect(bufferOffset[0]).to.equal(24);
        chai_1.expect(base_deserialize_1.default.uint64(buf, bufferOffset).eq(bignums[3])).to.be.true;
        chai_1.expect(bufferOffset[0]).to.equal(32);
    });
    mocha_1.it('Uint64 Array', () => {
        const buf = Buffer.alloc(36);
        const bignums = [
            new BN('9223372036854775807'),
            new BN('18446744073709551615'),
            new BN('123'),
            new BN('8080808080')
        ];
        base_serialize_1.default.Array.uint64(bignums.slice(0, 3), buf, 0, -1);
        base_serialize_1.default.Array.uint64(bignums.slice(3, 4), buf, 28, 1);
        const bufferOffset = [0];
        let arr = base_deserialize_1.default.Array.uint64(buf, bufferOffset, -1);
        chai_1.expect(arr.length).to.equal(3);
        chai_1.expect(arr[0].eq(bignums[0])).to.be.true;
        chai_1.expect(arr[1].eq(bignums[1])).to.be.true;
        chai_1.expect(arr[2].eq(bignums[2])).to.be.true;
        chai_1.expect(bufferOffset[0]).to.equal(28);
        arr = base_deserialize_1.default.Array.uint64(buf, bufferOffset, 1);
        chai_1.expect(bufferOffset[0]).to.equal(36);
        chai_1.expect(arr.length).to.equal(1);
        chai_1.expect(arr[0].eq(bignums[3])).to.be.true;
    });
    mocha_1.it('Int8', () => {
        const buf = Buffer.alloc(5);
        base_serialize_1.default.Array.int8([1, -2, 3, -128, 127], buf, 0, 5);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.int8(buf, bufferOffset)).to.equal(1);
        chai_1.expect(bufferOffset[0]).to.equal(1);
        chai_1.expect(base_deserialize_1.default.int8(buf, bufferOffset)).to.equal(-2);
        chai_1.expect(bufferOffset[0]).to.equal(2);
        chai_1.expect(base_deserialize_1.default.int8(buf, bufferOffset)).to.equal(3);
        chai_1.expect(bufferOffset[0]).to.equal(3);
        chai_1.expect(base_deserialize_1.default.int8(buf, bufferOffset)).to.equal(-128);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.int8(buf, bufferOffset)).to.equal(127);
        chai_1.expect(bufferOffset[0]).to.equal(5);
    });
    mocha_1.it('Int8 Array', () => {
        const buf = Buffer.alloc(16);
        base_serialize_1.default.Array.int8([1, 2], buf, 0, -1);
        base_serialize_1.default.Array.int8([3, 1, 2], buf, 6, 3);
        base_serialize_1.default.Array.int8([3, -126, 24], buf, 9, -1);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.Array.int8(buf, bufferOffset, -1)).to.deep.equal([1, 2]);
        chai_1.expect(bufferOffset[0]).to.equal(6);
        chai_1.expect(base_deserialize_1.default.Array.int8(buf, bufferOffset, 3)).to.deep.equal([3, 1, 2]);
        chai_1.expect(bufferOffset[0]).to.equal(9);
        chai_1.expect(base_deserialize_1.default.Array.int8(buf, bufferOffset, -1)).to.deep.equal([3, -126, 24]);
        chai_1.expect(bufferOffset[0]).to.equal(16);
    });
    mocha_1.it('Int16', () => {
        const buf = Buffer.alloc(8);
        base_serialize_1.default.Array.int16([32767, 257, -32768, 124], buf, 0, 5);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.int16(buf, bufferOffset)).to.equal(32767);
        chai_1.expect(bufferOffset[0]).to.equal(2);
        chai_1.expect(base_deserialize_1.default.int16(buf, bufferOffset)).to.equal(257);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.int16(buf, bufferOffset)).to.equal(-32768);
        chai_1.expect(bufferOffset[0]).to.equal(6);
        chai_1.expect(base_deserialize_1.default.int16(buf, bufferOffset)).to.equal(124);
        chai_1.expect(bufferOffset[0]).to.equal(8);
    });
    mocha_1.it('Int16 Array', () => {
        const buf = Buffer.alloc(16);
        base_serialize_1.default.Array.int16([1, 32767], buf, 0, 2);
        base_serialize_1.default.Array.int16([-32768], buf, 4, -1);
        base_serialize_1.default.Array.int16([-22], buf, 10, -1);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.Array.int16(buf, bufferOffset, 2)).to.deep.equal([1, 32767]);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.Array.int16(buf, bufferOffset, -1)).to.deep.equal([-32768]);
        chai_1.expect(bufferOffset[0]).to.equal(10);
        chai_1.expect(base_deserialize_1.default.Array.int16(buf, bufferOffset, -1)).to.deep.equal([-22]);
        chai_1.expect(bufferOffset[0]).to.equal(16);
    });
    mocha_1.it('Int32', () => {
        const buf = Buffer.alloc(16);
        base_serialize_1.default.Array.int32([1, 2147483647, -2147483648, 1235456848], buf, 0, 4);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.int32(buf, bufferOffset)).to.equal(1);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.int32(buf, bufferOffset)).to.equal(2147483647);
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(base_deserialize_1.default.int32(buf, bufferOffset)).to.equal(-2147483648);
        chai_1.expect(bufferOffset[0]).to.equal(12);
        chai_1.expect(base_deserialize_1.default.int32(buf, bufferOffset)).to.equal(1235456848);
        chai_1.expect(bufferOffset[0]).to.equal(16);
    });
    mocha_1.it('Int32 Array', () => {
        const buf = Buffer.alloc(28);
        base_serialize_1.default.Array.int32([1, 2147483647], buf, 0, 2);
        base_serialize_1.default.Array.int32([-2147483648], buf, 8, -1);
        base_serialize_1.default.Array.int32([1235456848, 12], buf, 16, -1);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.Array.int32(buf, bufferOffset, 2)).to.deep.equal([1, 2147483647]);
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(base_deserialize_1.default.Array.int32(buf, bufferOffset, -1)).to.deep.equal([-2147483648]);
        chai_1.expect(bufferOffset[0]).to.equal(16);
        chai_1.expect(base_deserialize_1.default.Array.int32(buf, bufferOffset, -1)).to.deep.equal([1235456848, 12]);
        chai_1.expect(bufferOffset[0]).to.equal(28);
    });
    mocha_1.it('Int64', () => {
        const buf = Buffer.alloc(32);
        const numbers = [
            '9223372036854775807',
            '-9223372036854775807',
            '123456789',
            '-987654321'
        ];
        const bignums = numbers.map((num) => new BN(num));
        base_serialize_1.default.Array.int64(bignums, buf, 0, 4);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.int64(buf, bufferOffset).eq(bignums[0])).to.be.true;
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(base_deserialize_1.default.int64(buf, bufferOffset).eq(bignums[1])).to.be.true;
        chai_1.expect(bufferOffset[0]).to.equal(16);
        chai_1.expect(base_deserialize_1.default.int64(buf, bufferOffset).eq(bignums[2])).to.be.true;
        chai_1.expect(bufferOffset[0]).to.equal(24);
        chai_1.expect(base_deserialize_1.default.int64(buf, bufferOffset).eq(bignums[3])).to.be.true;
        chai_1.expect(bufferOffset[0]).to.equal(32);
    });
    mocha_1.it('Int64 Array', () => {
        const buf = Buffer.alloc(36);
        const numbers = [
            '9223372036854775807',
            '-9223372036854775807',
            '123456789',
            '-987654321'
        ];
        const bignums = numbers.map((num) => new BN(num));
        base_serialize_1.default.Array.int64(bignums.slice(0, 2), buf, 0, 2);
        base_serialize_1.default.Array.int64(bignums.slice(2, 4), buf, 16, -1);
        const bufferOffset = [0];
        let arr = base_deserialize_1.default.Array.int64(buf, bufferOffset, 2);
        chai_1.expect(arr[0].eq(bignums[0])).to.be.true;
        chai_1.expect(arr[1].eq(bignums[1])).to.be.true;
        chai_1.expect(arr.length).to.equal(2);
        chai_1.expect(bufferOffset[0]).to.equal(16);
        arr = base_deserialize_1.default.Array.int64(buf, bufferOffset, -1);
        chai_1.expect(bufferOffset[0]).to.equal(36);
        chai_1.expect(arr[0].eq(bignums[2])).to.be.true;
        chai_1.expect(arr[1].eq(bignums[3])).to.be.true;
        chai_1.expect(arr.length).to.equal(2);
    });
    mocha_1.it('Float32', () => {
        const buf = Buffer.alloc(16);
        base_serialize_1.default.Array.float32([0.00000012, 19875664, -2456654, -0.011], buf, 0, 4);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.float32(buf, bufferOffset)).to.be.closeTo(0.00000012, 1e-7);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.float32(buf, bufferOffset)).to.be.closeTo(19875664, 1e-7);
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(base_deserialize_1.default.float32(buf, bufferOffset)).to.be.closeTo(-2456654, 1e-7);
        chai_1.expect(bufferOffset[0]).to.equal(12);
        chai_1.expect(base_deserialize_1.default.float32(buf, bufferOffset)).to.be.closeTo(-0.011, 1e-7);
        chai_1.expect(bufferOffset[0]).to.equal(16);
    });
    mocha_1.it('Float32 Array', () => {
        const buf = Buffer.alloc(28);
        base_serialize_1.default.Array.float32([0.00000012, 19875664], buf, 0, 2);
        base_serialize_1.default.Array.float32([-2456654], buf, 8, -1);
        base_serialize_1.default.Array.float32([-0.011, 12], buf, 16, -1);
        const bufferOffset = [0];
        let arr = base_deserialize_1.default.Array.float32(buf, bufferOffset, 2);
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(arr.length).to.equal(2);
        chai_1.expect(arr[0]).to.be.closeTo(0.00000012, 1e-7);
        chai_1.expect(arr[1]).to.be.closeTo(19875664, 1e-7);
        arr = base_deserialize_1.default.Array.float32(buf, bufferOffset, -1);
        chai_1.expect(bufferOffset[0]).to.equal(16);
        chai_1.expect(arr.length).to.equal(1);
        chai_1.expect(arr[0]).to.be.closeTo(-2456654, 1e-7);
        arr = base_deserialize_1.default.Array.float32(buf, bufferOffset, -1);
        chai_1.expect(bufferOffset[0]).to.equal(28);
        chai_1.expect(arr.length).to.equal(2);
        chai_1.expect(arr[0]).to.be.closeTo(-0.011, 1e-7);
        chai_1.expect(arr[1]).to.be.closeTo(12, 1e-7);
    });
    mocha_1.it('Float64', () => {
        const buf = Buffer.alloc(32);
        base_serialize_1.default.Array.float64([0.00000012, -2456654, 2.23e-16, 19875665], buf, 0, 4);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.float64(buf, bufferOffset)).to.be.closeTo(0.00000012, Number.EPSILON);
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(base_deserialize_1.default.float64(buf, bufferOffset)).to.be.closeTo(-2456654, Number.EPSILON);
        chai_1.expect(bufferOffset[0]).to.equal(16);
        chai_1.expect(base_deserialize_1.default.float64(buf, bufferOffset)).to.be.closeTo(2.23e-16, Number.EPSILON);
        chai_1.expect(bufferOffset[0]).to.equal(24);
        chai_1.expect(base_deserialize_1.default.float64(buf, bufferOffset)).to.be.closeTo(19875665, Number.EPSILON);
        chai_1.expect(bufferOffset[0]).to.equal(32);
    });
    mocha_1.it('Float64 Array', () => {
        const buf = Buffer.alloc(48);
        base_serialize_1.default.Array.float64([0.00000012, 19875664], buf, 0, 2);
        base_serialize_1.default.Array.float64([-2456654], buf, 16, -1);
        base_serialize_1.default.Array.float64([-0.011, 12], buf, 28, -1);
        const bufferOffset = [0];
        let arr = base_deserialize_1.default.Array.float64(buf, bufferOffset, 2);
        chai_1.expect(bufferOffset[0]).to.equal(16);
        chai_1.expect(arr.length).to.equal(2);
        chai_1.expect(arr[0]).to.be.closeTo(0.00000012, Number.EPSILON);
        chai_1.expect(arr[1]).to.be.closeTo(19875664, Number.EPSILON);
        arr = base_deserialize_1.default.Array.float64(buf, bufferOffset, -1);
        chai_1.expect(bufferOffset[0]).to.equal(28);
        chai_1.expect(arr.length).to.equal(1);
        chai_1.expect(arr[0]).to.be.closeTo(-2456654, Number.EPSILON);
        arr = base_deserialize_1.default.Array.float64(buf, bufferOffset, -1);
        chai_1.expect(bufferOffset[0]).to.equal(48);
        chai_1.expect(arr.length).to.equal(2);
        chai_1.expect(arr[0]).to.be.closeTo(-0.011, Number.EPSILON);
        chai_1.expect(arr[1]).to.be.closeTo(12, 1e-7);
    });
    mocha_1.it('Time', () => {
        const buffer = Buffer.alloc(32);
        const times = [
            { secs: 0, nsecs: 0 },
            { secs: 32768, nsecs: 215888 },
            { secs: 5489, nsecs: 5653 },
            { secs: 81232, nsecs: 121 },
        ];
        base_serialize_1.default.Array.time(times, buffer, 0, 4);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.time(buffer, bufferOffset)).to.deep.equal(times[0]);
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(base_deserialize_1.default.time(buffer, bufferOffset)).to.deep.equal(times[1]);
        chai_1.expect(bufferOffset[0]).to.equal(16);
        chai_1.expect(base_deserialize_1.default.time(buffer, bufferOffset)).to.deep.equal(times[2]);
        chai_1.expect(bufferOffset[0]).to.equal(24);
        chai_1.expect(base_deserialize_1.default.time(buffer, bufferOffset)).to.deep.equal(times[3]);
        chai_1.expect(bufferOffset[0]).to.equal(32);
    });
    mocha_1.it('Time Array', () => {
        const buffer = Buffer.alloc(36);
        const times = [
            { secs: 0, nsecs: 0 },
            { secs: 32768, nsecs: 215888 },
            { secs: 5489, nsecs: 5653 },
            { secs: 81232, nsecs: 121 },
        ];
        base_serialize_1.default.Array.time(times.slice(0, 3), buffer, 0, 3);
        base_serialize_1.default.Array.time(times.slice(3, 4), buffer, 24, -1);
        const bufferOffset = [0];
        let arr = base_deserialize_1.default.Array.time(buffer, bufferOffset, 3);
        chai_1.expect(bufferOffset[0]).to.equal(24);
        chai_1.expect(arr.length).to.equal(3);
        chai_1.expect(arr[0]).to.deep.equal(times[0]);
        chai_1.expect(arr[1]).to.deep.equal(times[1]);
        chai_1.expect(arr[2]).to.deep.equal(times[2]);
        arr = base_deserialize_1.default.Array.time(buffer, bufferOffset, -1);
        chai_1.expect(bufferOffset[0]).to.equal(36);
        chai_1.expect(arr.length).to.equal(1);
        chai_1.expect(arr[0]).to.deep.equal(times[3]);
    });
    mocha_1.it('Duration', () => {
        const buffer = Buffer.alloc(32);
        const times = [
            { secs: 0, nsecs: 0 },
            { secs: -32768, nsecs: -215888 },
            { secs: 5489, nsecs: 5653 },
            { secs: 81232, nsecs: 121 },
        ];
        base_serialize_1.default.Array.duration(times, buffer, 0, 4);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.duration(buffer, bufferOffset)).to.deep.equal(times[0]);
        chai_1.expect(bufferOffset[0]).to.equal(8);
        chai_1.expect(base_deserialize_1.default.duration(buffer, bufferOffset)).to.deep.equal(times[1]);
        chai_1.expect(bufferOffset[0]).to.equal(16);
        chai_1.expect(base_deserialize_1.default.duration(buffer, bufferOffset)).to.deep.equal(times[2]);
        chai_1.expect(bufferOffset[0]).to.equal(24);
        chai_1.expect(base_deserialize_1.default.duration(buffer, bufferOffset)).to.deep.equal(times[3]);
        chai_1.expect(bufferOffset[0]).to.equal(32);
    });
    mocha_1.it('Duration Array', () => {
        const buffer = Buffer.alloc(36);
        const times = [
            { secs: 0, nsecs: 0 },
            { secs: 32768, nsecs: 215888 },
            { secs: -5489, nsecs: -5653 },
            { secs: 81232, nsecs: 121 },
        ];
        base_serialize_1.default.Array.duration(times.slice(0, 3), buffer, 0, 3);
        base_serialize_1.default.Array.duration(times.slice(3, 4), buffer, 24, -1);
        const bufferOffset = [0];
        let arr = base_deserialize_1.default.Array.duration(buffer, bufferOffset, 3);
        chai_1.expect(bufferOffset[0]).to.equal(24);
        chai_1.expect(arr.length).to.equal(3);
        chai_1.expect(arr[0]).to.deep.equal(times[0]);
        chai_1.expect(arr[1]).to.deep.equal(times[1]);
        chai_1.expect(arr[2]).to.deep.equal(times[2]);
        arr = base_deserialize_1.default.Array.duration(buffer, bufferOffset, -1);
        chai_1.expect(bufferOffset[0]).to.equal(36);
        chai_1.expect(arr.length).to.equal(1);
        chai_1.expect(arr[0]).to.deep.equal(times[3]);
    });
    mocha_1.it('Char', () => {
        const buf = Buffer.alloc(5);
        base_serialize_1.default.Array.char([1, 2, 3, 255, 0], buf, 0, 5);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.char(buf, bufferOffset)).to.equal(1);
        chai_1.expect(bufferOffset[0]).to.equal(1);
        chai_1.expect(base_deserialize_1.default.char(buf, bufferOffset)).to.equal(2);
        chai_1.expect(bufferOffset[0]).to.equal(2);
        chai_1.expect(base_deserialize_1.default.char(buf, bufferOffset)).to.equal(3);
        chai_1.expect(bufferOffset[0]).to.equal(3);
        chai_1.expect(base_deserialize_1.default.char(buf, bufferOffset)).to.equal(255);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.char(buf, bufferOffset)).to.equal(0);
        chai_1.expect(bufferOffset[0]).to.equal(5);
    });
    mocha_1.it('Char Array', () => {
        const buf = Buffer.alloc(14);
        base_serialize_1.default.Array.char([1, 2], buf, 0, -1);
        base_serialize_1.default.Array.char([3, 1, 2], buf, 6, 3);
        base_serialize_1.default.Array.char([3], buf, 9, -1);
        const bufferOffset = [0];
        chai_1.expect(Array.from(base_deserialize_1.default.Array.char(buf, bufferOffset, -1))).to.deep.equal([1, 2]);
        chai_1.expect(bufferOffset[0]).to.equal(6);
        chai_1.expect(Array.from(base_deserialize_1.default.Array.char(buf, bufferOffset, 3))).to.deep.equal([3, 1, 2]);
        chai_1.expect(bufferOffset[0]).to.equal(9);
        chai_1.expect(Array.from(base_deserialize_1.default.Array.char(buf, bufferOffset, -1))).to.deep.equal([3]);
        chai_1.expect(bufferOffset[0]).to.equal(14);
    });
    mocha_1.it('Byte', () => {
        const buf = Buffer.alloc(5);
        base_serialize_1.default.Array.byte([1, -2, 3, -128, 127], buf, 0, 5);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.byte(buf, bufferOffset)).to.equal(1);
        chai_1.expect(bufferOffset[0]).to.equal(1);
        chai_1.expect(base_deserialize_1.default.byte(buf, bufferOffset)).to.equal(-2);
        chai_1.expect(bufferOffset[0]).to.equal(2);
        chai_1.expect(base_deserialize_1.default.byte(buf, bufferOffset)).to.equal(3);
        chai_1.expect(bufferOffset[0]).to.equal(3);
        chai_1.expect(base_deserialize_1.default.byte(buf, bufferOffset)).to.equal(-128);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.byte(buf, bufferOffset)).to.equal(127);
        chai_1.expect(bufferOffset[0]).to.equal(5);
    });
    mocha_1.it('Byte Array', () => {
        const buf = Buffer.alloc(16);
        base_serialize_1.default.Array.byte([1, 2], buf, 0, -1);
        base_serialize_1.default.Array.byte([3, 1, 2], buf, 6, 3);
        base_serialize_1.default.Array.byte([3, -126, 24], buf, 9, -1);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.Array.byte(buf, bufferOffset, -1)).to.deep.equal([1, 2]);
        chai_1.expect(bufferOffset[0]).to.equal(6);
        chai_1.expect(base_deserialize_1.default.Array.byte(buf, bufferOffset, 3)).to.deep.equal([3, 1, 2]);
        chai_1.expect(bufferOffset[0]).to.equal(9);
        chai_1.expect(base_deserialize_1.default.Array.byte(buf, bufferOffset, -1)).to.deep.equal([3, -126, 24]);
        chai_1.expect(bufferOffset[0]).to.equal(16);
    });
    mocha_1.it('Bool', () => {
        const buf = Buffer.alloc(5);
        base_serialize_1.default.Array.bool([true, false, true, false, false], buf, 0, 5);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.bool(buf, bufferOffset)).to.equal(true);
        chai_1.expect(bufferOffset[0]).to.equal(1);
        chai_1.expect(base_deserialize_1.default.bool(buf, bufferOffset)).to.equal(false);
        chai_1.expect(bufferOffset[0]).to.equal(2);
        chai_1.expect(base_deserialize_1.default.bool(buf, bufferOffset)).to.equal(true);
        chai_1.expect(bufferOffset[0]).to.equal(3);
        chai_1.expect(base_deserialize_1.default.bool(buf, bufferOffset)).to.equal(false);
        chai_1.expect(bufferOffset[0]).to.equal(4);
        chai_1.expect(base_deserialize_1.default.bool(buf, bufferOffset)).to.equal(false);
        chai_1.expect(bufferOffset[0]).to.equal(5);
    });
    mocha_1.it('Bool Array', () => {
        const buf = Buffer.alloc(16);
        base_serialize_1.default.Array.bool([false, false], buf, 0, -1);
        base_serialize_1.default.Array.bool([true, true, false], buf, 6, 3);
        base_serialize_1.default.Array.bool([true, false, true], buf, 9, -1);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.Array.bool(buf, bufferOffset, -1)).to.deep.equal([false, false]);
        chai_1.expect(bufferOffset[0]).to.equal(6);
        chai_1.expect(base_deserialize_1.default.Array.bool(buf, bufferOffset, 3)).to.deep.equal([true, true, false]);
        chai_1.expect(bufferOffset[0]).to.equal(9);
        chai_1.expect(base_deserialize_1.default.Array.bool(buf, bufferOffset, -1)).to.deep.equal([true, false, true]);
        chai_1.expect(bufferOffset[0]).to.equal(16);
    });
    mocha_1.it('String', () => {
        const buf = Buffer.alloc(47);
        base_serialize_1.default.Array.string(["Hello", "World", "一番", "Strings", "here"], buf, 0, 5);
        const bufferOffset = [0];
        chai_1.expect(base_deserialize_1.default.string(buf, bufferOffset)).to.equal("Hello");
        chai_1.expect(bufferOffset[0]).to.equal(9);
        chai_1.expect(base_deserialize_1.default.string(buf, bufferOffset)).to.equal("World");
        chai_1.expect(bufferOffset[0]).to.equal(18);
        chai_1.expect(base_deserialize_1.default.string(buf, bufferOffset)).to.equal("一番");
        chai_1.expect(bufferOffset[0]).to.equal(28);
        chai_1.expect(base_deserialize_1.default.string(buf, bufferOffset)).to.equal("Strings");
        chai_1.expect(bufferOffset[0]).to.equal(39);
        chai_1.expect(base_deserialize_1.default.string(buf, bufferOffset)).to.equal("here");
        chai_1.expect(bufferOffset[0]).to.equal(47);
    });
    mocha_1.it('String Array', () => {
        const buf = Buffer.alloc(72);
        const strings = ["Hello", "World", "一番", "Strings", "here", "019283dlakjsd"];
        base_serialize_1.default.Array.string(strings.slice(0, 2), buf, 0, 2);
        base_serialize_1.default.Array.string(strings.slice(2, 5), buf, 18, -1);
        base_serialize_1.default.Array.string(strings.slice(5, 6), buf, 51, -1);
        const bufferOffset = [0];
        let arr = base_deserialize_1.default.Array.string(buf, bufferOffset, 2);
        chai_1.expect(bufferOffset[0]).to.equal(18);
        chai_1.expect(arr.length).to.equal(2);
        chai_1.expect(arr[0]).to.equal(strings[0]);
        chai_1.expect(arr[1]).to.equal(strings[1]);
        arr = base_deserialize_1.default.Array.string(buf, bufferOffset, -1);
        chai_1.expect(bufferOffset[0]).to.equal(51);
        chai_1.expect(arr.length).to.equal(3);
        chai_1.expect(arr[0]).to.equal(strings[2]);
        chai_1.expect(arr[1]).to.equal(strings[3]);
        chai_1.expect(arr[2]).to.equal(strings[4]);
        arr = base_deserialize_1.default.Array.string(buf, bufferOffset, -1);
        chai_1.expect(bufferOffset[0]).to.equal(72);
        chai_1.expect(arr.length).to.equal(1);
        chai_1.expect(arr[0]).to.equal(strings[5]);
    });
});
//# sourceMappingURL=deserialization_test.js.map