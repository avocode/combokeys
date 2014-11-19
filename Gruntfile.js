/* eslint-env node */
module.exports = function(grunt) {
    "use strict";

    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        eslint: {
            target: [
                "Gruntfile.js",
                "index.js",
                "plugins/**/*.js",
                "test/**/*.js",
                "helpers/**/*.js"
            ]
        },

        complexity: {
            options: {
                errorsOnly: false,
                cyclomatic: 10,
                halstead: 30,
                maintainability: 85
            },
            generic: {
                src: [
                    "combokeys.js"
                ]
            },
            plugins: {
                src: [
                    "plugins/**/*.js",
                    "!plugins/**/tests/**"
                ]
            }
        }
    });

    grunt.registerTask("default", [
        "eslint",
        "complexity",
        "mocha"
    ]);
};
