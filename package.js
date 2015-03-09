var Package = require("auto-package");

Package.name = "combokeys";
Package.versionFile();
Package.description = "Handles keyboard shortcuts in the browser";
Package.main = "Combokeys/index.js";
Package.implements = ["CommonJS/Modules/1.0"];
Package.scripts = {
    build: "mkdir dist && browserify index.js -o dist/combokeys.js --standalone Combokeys",
    test: "./node_modules/zuul/bin/zuul --phantom -- test/test.combokeys.js test/plugins/test.*.js"
};
Package.githubRepo("PolicyStat/combokeys");
Package.keywords = [
    "keyboard",
    "shortcuts",
    "events",
    "browser"
];
Package.contributors = [
    {
        "name": "Shahar Or",
        "email": "mightyiampresence@gmail.com",
        "web": "https://github.com/mightyiam"
    },
    {
        "name": "Craig Campbell",
        "web": "http://craig.is"
    }
];
Package.bugs = "https://github.com/mightyiam/combokeys/issues";
Package.license = {
    "type": "Apache 2.0",
    "url": "https://www.apache.org/licenses/LICENSE-2.0.txt"
};
Package.devDependencies = {
    "auto-package": "^1.0.0",
    "browserify": "~7.0.3",
    "chai": "^1.10.0",
    "es5-shim": "^4.0.3",
    "grunt": "~0.4.1",
    "grunt-complexity": "~0.1.2",
    "grunt-eslint": "^2.0.0",
    "load-grunt-tasks": "^1.0.0",
    "mocha": "^2.0.1",
    "phantomjs": "^1.9.12",
    "sinon": "^1.12.1",
    "zuul": "^1.13.1"
};
Package.dependencies = {
    "add-event-handler": "^1.0.0"
};
