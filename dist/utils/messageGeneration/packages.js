'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessagePackageCache = exports.findMessagePackages = exports.findPackage = void 0;
const fs = require("fs");
const path = require("path");
let messagePackageCache = {};
const rosPackageCache = {};
// ---------------------------------------------------------
// Implements the same crawling algorithm as rospack find
// See http://ros.org/doc/api/rospkg/html/rospack.html
// packages = {};
function findPackage(packageName) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        var directory = rosPackageCache[packageName.toLowerCase()];
        if (directory) {
            return directory;
        }
        const packagePath = getRosPackagePath();
        var rosPackagePaths = packagePath.split(':');
        for (const directory of rosPackagePaths) {
            try {
                for (var _b = (e_1 = void 0, __asyncValues(getPackages(directory))), _c; _c = yield _b.next(), !_c.done;) {
                    const pkg = _c.value;
                    rosPackageCache[pkg.name.toLowerCase()] = pkg.directory;
                    if (pkg.name === packageName) {
                        return pkg.directory;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        const error = new Error('ENOTFOUND - Package ' + packageName + ' not found');
        error.name = 'PackageNotFoundError';
        throw error;
    });
}
exports.findPackage = findPackage;
function findMessagePackages() {
    var packagePath = getRosPackagePath();
    var rosPackagePaths = packagePath.split(':');
    return buildMessagePackageCache(rosPackagePaths);
}
exports.findMessagePackages = findMessagePackages;
function getMessagePackageCache() {
    return Object.assign({}, messagePackageCache);
}
exports.getMessagePackageCache = getMessagePackageCache;
function findMessagesInPackageDirectory(dir) {
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const packageEntry = {
            directory: dir,
            messages: {},
            services: {},
            actions: {}
        };
        try {
            for (var _b = __asyncValues(getMessages(dir)), _c; _c = yield _b.next(), !_c.done;) {
                const message = _c.value;
                switch (message.type) {
                    case 'message':
                        packageEntry.messages[message.name] = message;
                        break;
                    case 'service':
                        packageEntry.services[message.name] = message;
                        break;
                    case 'action':
                        packageEntry.actions[message.name] = message;
                        break;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return packageEntry;
    });
}
function buildMessagePackageCache(directories) {
    var e_3, _a;
    return __awaiter(this, void 0, void 0, function* () {
        for (const directory of directories) {
            try {
                for (var _b = (e_3 = void 0, __asyncValues(getPackages(directory))), _c; _c = yield _b.next(), !_c.done;) {
                    const pkg = _c.value;
                    if (!messagePackageCache.hasOwnProperty(pkg.name)) {
                        const packageEntry = yield findMessagesInPackageDirectory(pkg.directory);
                        if (Object.keys(packageEntry.messages).length > 0 ||
                            Object.keys(packageEntry.services).length > 0 ||
                            Object.keys(packageEntry.actions).length > 0) {
                            messagePackageCache[pkg.name] = packageEntry;
                        }
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
    });
}
function getRosEnvVar(envVarName) {
    const envVar = process.env[envVarName];
    if (!envVar) {
        throw new Error(`Unable to find required environment variable ${envVarName}`);
    }
    return envVar;
}
function getRosPackagePath() {
    return getRosEnvVar('ROS_PACKAGE_PATH');
}
function getRosRoot() {
    return getRosEnvVar('ROS_ROOT');
}
function getPackages(directory, symlinks = []) {
    return __asyncGenerator(this, arguments, function* getPackages_1() {
        var e_4, _a;
        const dir = yield __await(fs.promises.opendir(directory));
        let recurse = true;
        const subdirs = [];
        try {
            for (var dir_1 = __asyncValues(dir), dir_1_1; dir_1_1 = yield __await(dir_1.next()), !dir_1_1.done;) {
                const dirent = dir_1_1.value;
                if (dirent.isDirectory()) {
                    subdirs.push(dirent);
                }
                else if (dirent.isFile()) {
                    if (dirent.name === 'CATKIN_IGNORE' || path.basename(dirent.name) === 'rospack_nosubdirs') {
                        recurse = false;
                    }
                    else if (dirent.name === 'package.xml' || dirent.name === 'manifest.xml') {
                        yield yield __await({ name: path.basename(directory), directory });
                        recurse = false;
                    }
                }
                else if (dirent.isSymbolicLink()) {
                    const linkPath = path.join(directory, dirent.name);
                    const [targetPath, stats] = yield __await(Promise.all([
                        fs.promises.readlink(linkPath),
                        fs.promises.stat(linkPath)
                    ]));
                    if (symlinks.includes(targetPath)) {
                        continue;
                    }
                    else if (stats.isDirectory()) {
                        symlinks.push(targetPath);
                        subdirs.push(dirent);
                    }
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (dir_1_1 && !dir_1_1.done && (_a = dir_1.return)) yield __await(_a.call(dir_1));
            }
            finally { if (e_4) throw e_4.error; }
        }
        if (recurse) {
            for (const dirent of subdirs) {
                yield __await(yield* __asyncDelegator(__asyncValues(getPackages(path.join(directory, dirent.name), symlinks))));
            }
        }
    });
}
function getMessages(directory, symlinks = []) {
    return __asyncGenerator(this, arguments, function* getMessages_1() {
        var e_5, _a;
        const dir = yield __await(fs.promises.opendir(directory));
        let recurse = true;
        const subdirs = [];
        try {
            for (var dir_2 = __asyncValues(dir), dir_2_1; dir_2_1 = yield __await(dir_2.next()), !dir_2_1.done;) {
                const dirent = dir_2_1.value;
                if (dirent.isDirectory()) {
                    subdirs.push(dirent);
                }
                else if (dirent.isFile()) {
                    if (dirent.name === 'CATKIN_IGNORE' || path.basename(dirent.name) === 'rospack_nosubdirs') {
                        recurse = false;
                    }
                    else {
                        const extension = path.extname(dirent.name);
                        const name = path.basename(dirent.name, extension);
                        const file = path.join(directory, dirent.name);
                        if (extension === '.msg') {
                            yield yield __await({ type: 'message', name, file });
                        }
                        else if (extension === '.srv') {
                            yield yield __await({ type: 'service', name, file });
                        }
                        else if (extension === '.action') {
                            yield yield __await({ type: 'action', name, file });
                        }
                    }
                }
                else if (dirent.isSymbolicLink()) {
                    const linkPath = path.join(directory, dirent.name);
                    const [targetPath, stats] = yield __await(Promise.all([
                        fs.promises.readlink(linkPath),
                        fs.promises.stat(linkPath)
                    ]));
                    if (symlinks.includes(targetPath)) {
                        continue;
                    }
                    else if (stats.isDirectory()) {
                        symlinks.push(targetPath);
                        subdirs.push(dirent);
                    }
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (dir_2_1 && !dir_2_1.done && (_a = dir_2.return)) yield __await(_a.call(dir_2));
            }
            finally { if (e_5) throw e_5.error; }
        }
        if (recurse) {
            for (const dirent of subdirs) {
                yield __await(yield* __asyncDelegator(__asyncValues(getMessages(path.join(directory, dirent.name), symlinks))));
            }
        }
    });
}
//# sourceMappingURL=packages.js.map