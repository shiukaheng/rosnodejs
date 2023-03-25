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
const fs = require("fs");
const path = require("path");
const packages = require("./packages");
const fieldsUtil = require("./fields");
const IndentedWriter_1 = require("./IndentedWriter");
const MsgSpec = require("./MessageSpec");
var LoadStatus;
(function (LoadStatus) {
    LoadStatus[LoadStatus["LOADING"] = 0] = "LOADING";
    LoadStatus[LoadStatus["LOADED"] = 1] = "LOADED";
})(LoadStatus || (LoadStatus = {}));
class MessageManager {
    constructor(verbose = false) {
        this._loadingPkgs = new Map();
        this._packageCache = null;
        this._verbose = verbose;
    }
    log(...args) {
        if (this._verbose) {
            console.log(...args);
        }
    }
    getCache() {
        return this._packageCache;
    }
    getMessageSpec(msgType, type = MsgSpec.MSG_TYPE) {
        const [pkg, messageName] = fieldsUtil.splitMessageType(msgType);
        if (this._packageCache.hasOwnProperty(pkg)) {
            let pkgCache;
            switch (type) {
                case MsgSpec.MSG_TYPE:
                    pkgCache = this._packageCache[pkg].messages;
                    break;
                case MsgSpec.SRV_TYPE:
                    pkgCache = this._packageCache[pkg].services;
                    break;
            }
            if (pkgCache) {
                // be case insensitive here...
                if (pkgCache.hasOwnProperty(messageName)) {
                    return pkgCache[messageName].spec;
                }
                const lcName = messageName.toLowerCase();
                if (pkgCache.hasOwnProperty(lcName)) {
                    return pkgCache[lcName].spec;
                }
            }
        }
        // fall through
        return null;
    }
    buildPackageTree(outputDirectory, writeFiles = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initTree();
            // none of the loading here depends on message dependencies
            // so don't worry about doing it in order, just do it all...
            const packages = Object.keys(this._packageCache);
            try {
                yield Promise.all(packages.map((pkgName) => {
                    return this.loadPackage(pkgName, outputDirectory, false, writeFiles);
                }));
            }
            catch (err) {
                console.error(err.stack);
                throw err;
            }
        });
    }
    buildPackage(packageName, outputDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            const deps = new Set();
            yield this.initTree();
            yield this.loadPackage(packageName, outputDirectory, true, true, (depName) => {
                if (!deps.has(depName)) {
                    deps.add(depName);
                    return true;
                }
                return false;
            });
        });
    }
    initTree() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._packageCache === null) {
                this.log('Traversing ROS_PACKAGE_PATH...');
                yield packages.findMessagePackages();
            }
            this._loadMessagesInCache(packages.getMessagePackageCache());
        });
    }
    loadPackage(packageName, outputDirectory, loadDeps = true, writeFiles = true, filterDepFunc = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._loadingPkgs.has(packageName)) {
                return;
            }
            // else
            this.log('Loading package %s', packageName);
            this._loadingPkgs.set(packageName, LoadStatus.LOADING);
            if (loadDeps) {
                // get an ordered list of dependencies for this message package
                let dependencies = sortPackageList([...getFullDependencySet(packageName, this._packageCache)], this._packageCache);
                // filter out any packages that have already been loaded or are loading
                if (filterDepFunc && typeof filterDepFunc === 'function') {
                    dependencies = dependencies.filter(filterDepFunc);
                }
                yield Promise.all(dependencies.map((depName) => {
                    return this.loadPackage(depName, outputDirectory, loadDeps, writeFiles, filterDepFunc);
                }));
            }
            // actions get parsed and are then cached with the rest of the messages
            // which is why there isn't a loadPackageActions
            if (writeFiles) {
                yield this.initPackageWrite(packageName, outputDirectory);
                yield this.writePackageMessages(packageName, outputDirectory);
                yield this.writePackageServices(packageName, outputDirectory);
                this._loadingPkgs.set(packageName, LoadStatus.LOADING);
                console.log('Finished building package %s', packageName);
            }
        });
    }
    initPackageWrite(packageName, jsMsgDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const packageDir = path.join(jsMsgDir, packageName);
            yield createDirectory(packageDir);
            if (this.packageHasMessages(packageName) || this.packageHasActions(packageName)) {
                const msgDir = path.join(packageDir, 'msg');
                yield createDirectory(msgDir);
                yield this.createMessageIndex(packageName, msgDir);
            }
            if (this.packageHasServices(packageName)) {
                const srvDir = path.join(packageDir, 'srv');
                yield createDirectory(srvDir);
                yield this.createServiceIndex(packageName, srvDir);
            }
            yield this.createPackageIndex(packageName, packageDir);
        });
    }
    createPackageIndex(packageName, directory) {
        const w = new IndentedWriter_1.default();
        w.write('module.exports = {')
            .indent();
        const hasMessages = this.packageHasMessages(packageName) || this.packageHasActions(packageName);
        const hasServices = this.packageHasServices(packageName);
        if (hasMessages) {
            w.write('msg: require(\'./msg/_index.js\'),');
        }
        if (hasServices) {
            w.write('srv: require(\'./srv/_index.js\')');
        }
        w.dedent()
            .write('};');
        return writeFile(path.join(directory, '_index.js'), w.get());
    }
    createIndex(packageName, directory, msgKey) {
        const messages = Object.keys(this._packageCache[packageName][msgKey]);
        const w = new IndentedWriter_1.default();
        w.write('module.exports = {')
            .indent();
        messages.forEach((message) => {
            w.write('%s: require(\'./%s.js\'),', message, message);
        });
        w.dedent()
            .write('};');
        return writeFile(path.join(directory, '_index.js'), w.get());
    }
    createMessageIndex(packageName, directory) {
        return this.createIndex(packageName, directory, 'messages');
    }
    createServiceIndex(packageName, directory) {
        return this.createIndex(packageName, directory, 'services');
    }
    packageHasMessages(packageName) {
        return Object.keys(this._packageCache[packageName].messages).length > 0;
    }
    packageHasServices(packageName) {
        return Object.keys(this._packageCache[packageName].services).length > 0;
    }
    packageHasActions(packageName) {
        return Object.keys(this._packageCache[packageName].actions).length > 0;
    }
    writePackageMessages(packageName, jsMsgDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgDir = path.join(jsMsgDir, packageName, 'msg');
            const packageMsgs = this._packageCache[packageName].messages;
            const pkgNames = Object.keys(packageMsgs);
            const numMsgs = pkgNames.length;
            if (numMsgs > 0) {
                this.log('Building %d messages from %s', numMsgs, packageName);
                const promises = [];
                pkgNames.forEach((msgName) => {
                    const spec = packageMsgs[msgName].spec;
                    this.log(`Building message ${spec.packageName}/${spec.messageName}`);
                    promises.push(writeFile(path.join(msgDir, `${msgName}.js`), spec.generateMessageClassFile()));
                });
                yield Promise.all(promises);
            }
        });
    }
    writePackageServices(packageName, jsMsgDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgDir = path.join(jsMsgDir, packageName, 'srv');
            const packageSrvs = this._packageCache[packageName].services;
            const srvNames = Object.keys(packageSrvs);
            const numSrvs = srvNames.length;
            if (numSrvs > 0) {
                this.log('Building %d services from %s', numSrvs, packageName);
                const promises = [];
                srvNames.forEach((srvName) => {
                    const spec = packageSrvs[srvName].spec;
                    this.log(`Building service ${spec.packageName}/${spec.messageName}`);
                    promises.push(writeFile(path.join(msgDir, `${srvName}.js`), spec.generateMessageClassFile()));
                });
                yield Promise.all(promises);
            }
        });
    }
    _loadMessagesInCache(packageCache) {
        this.log('Loading messages...');
        this._packageCache = {};
        for (const packageName in packageCache) {
            const packageInfo = packageCache[packageName];
            const packageDeps = new Set();
            const messages = {};
            for (const message in packageInfo.messages) {
                const { file } = packageInfo.messages[message];
                this.log('Loading message %s from %s', message, file);
                const spec = MsgSpec.create(this, packageName, message, MsgSpec.MSG_TYPE, file);
                spec.getMessageDependencies(packageDeps);
                messages[message] = { spec, file };
            }
            const services = {};
            for (const message in packageInfo.services) {
                const { file } = packageInfo.services[message];
                this.log('Loading service %s from %s', message, file);
                const spec = MsgSpec.create(this, packageName, message, MsgSpec.SRV_TYPE, file);
                spec.getMessageDependencies(packageDeps);
                services[message] = { spec, file };
            }
            const actions = {};
            for (const message in packageInfo.actions) {
                const { file } = packageInfo.actions[message];
                this.log('Loading action %s from %s', message, file);
                const spec = MsgSpec.create(this, packageName, message, MsgSpec.ACTION_TYPE, file);
                // cache the individual messages for later lookup (needed when writing files)
                const packageMsgs = packageInfo.messages;
                spec.getMessages().forEach((spec) => {
                    // only write this action if it doesn't exist yet - this should be expected if people
                    // have already run catkin_make, as it will generate action message definitions that
                    // will just get loaded as regular messages
                    if (!packageMsgs.hasOwnProperty(spec.messageName)) {
                        messages[spec.messageName] = { file: null, spec };
                    }
                });
                spec.getMessageDependencies(packageDeps);
                actions[message] = { spec, file };
            }
            this._packageCache[packageName] = {
                messages,
                services,
                actions,
                localDeps: packageDeps
            };
        }
    }
}
exports.default = MessageManager;
//----------------------------------------------------------------------
// Helper functions
function sortPackageList(packageList, cache) {
    // we'll cache full list of dependencies for each package here so we don't need to rebuild it
    const fullPkgDeps = {};
    function getDeps(pkg) {
        const deps = fullPkgDeps[pkg];
        if (!deps) {
            return fullPkgDeps[pkg] = [...getFullDependencySet(pkg, cache)];
        }
        return deps;
    }
    packageList.sort(function sorter(pkgA, pkgB) {
        let aDeps = getDeps(pkgA);
        let bDeps = getDeps(pkgB);
        const aDependsOnB = aDeps.includes(pkgB);
        const bDependsOnA = bDeps.includes(pkgA);
        if (aDependsOnB && bDependsOnA) {
            throw new Error(`Found circular dependency while sorting chain between [${pkgA}] and [${pkgB}]`);
        }
        if (aDependsOnB) {
            return 1;
        }
        else if (bDependsOnA) {
            return -1;
        }
        return 0;
    });
    return packageList;
}
function getFullDependencySet(originalPackage, cache) {
    const dependencyList = new Set();
    function getDependencies(msgPackage) {
        const localDeps = cache[msgPackage].localDeps;
        localDeps.forEach((dep) => {
            if (dep === originalPackage) {
                throw new Error('Found circular dependency while building chain');
            }
            dependencyList.add(dep);
            getDependencies(dep);
        });
    }
    getDependencies(originalPackage);
    return dependencyList;
}
function createDirectory(directory) {
    return __awaiter(this, void 0, void 0, function* () {
        let curPath = '/';
        const paths = directory.split(path.sep);
        function createLocal(dirPath) {
            return new Promise((resolve, reject) => {
                fs.mkdir(dirPath, (err) => {
                    if (err && err.code !== 'EEXIST' && err.code !== 'EISDIR') {
                        reject(err);
                    }
                    resolve();
                });
            });
        }
        for (const localPath of paths) {
            curPath = path.join(curPath, localPath);
            yield createLocal(curPath);
        }
    });
}
function writeFile(filepath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filepath, data, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
//# sourceMappingURL=MessageLoader.js.map