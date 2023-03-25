"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
class IndentedWriter {
    constructor() {
        this._str = '';
        this._indentation = 0;
    }
    write(...args) {
        let formattedStr = util.format.apply(this, args);
        for (let i = 0; i < this._indentation; ++i) {
            this._str += '  ';
        }
        this._str += formattedStr;
        return this.newline();
    }
    newline(indentDir = undefined) {
        this._str += '\n';
        if (indentDir === undefined) {
            return this;
        }
        else if (indentDir > 0) {
            return this.indent();
        }
        else if (indentDir < 0) {
            return this.dedent();
        }
        // else
        return this;
    }
    indent(...args) {
        ++this._indentation;
        if (args.length > 0) {
            return this.write(...args);
        }
        // else
        return this;
    }
    isIndented() {
        return this._indentation > 0;
    }
    dedent(...args) {
        --this._indentation;
        if (this._indentation < 0) {
            this.resetIndent();
        }
        if (arguments.length > 0) {
            return this.write(...args);
        }
        // else
        return this;
    }
    resetIndent() {
        this._indentation = 0;
        return this;
    }
    dividingLine() {
        return this.write('//-----------------------------------------------------------');
    }
    get() {
        return this._str;
    }
}
exports.default = IndentedWriter;
//# sourceMappingURL=IndentedWriter.js.map