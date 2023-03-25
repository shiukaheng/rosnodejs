"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const index_1 = require("../index");
const argparse_1 = require("argparse");
const parser = new argparse_1.ArgumentParser({
    add_help: true,
    description: 'Utility script to generate ROS messages'
});
parser.add_argument('-p', '--pkg', {
    type: 'str',
    help: 'Message package to build (e.g. std_msgs). Also builds dependencies'
});
parser.add_argument('-o', '--output', {
    type: 'str',
    help: 'Directory to output message into (e.g. /tmp). Messages are built to devel space by default'
});
parser.add_argument('-v', '--verbose', {
    action: 'store_true'
});
const args = parser.parse_args();
if (args.output) {
    args.output = path.resolve(args.output);
}
if (args.pkg) {
    index_1.default.loadPackage(args.pkg, args.output, args.verbose);
}
else {
    index_1.default.loadAllPackages(args.output, args.verbose)
        .then(() => {
        console.log('Message generation complete!');
        process.exit();
    })
        .catch((err) => {
        console.error('Error while generating messages!');
        process.exit(1);
    });
}
//# sourceMappingURL=generateMessages.js.map