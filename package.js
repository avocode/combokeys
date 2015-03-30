var Package = require('auto-package')

Package.name = 'combokeys'
Package.versionFile()
Package.description = 'Handles keyboard shortcuts in the browser'
Package.main = 'Combokeys/index.js'
Package.implements = ['CommonJS/Modules/1.0']
Package.scripts = {
  lint: 'standard',
  unit: './node_modules/zuul/bin/zuul --phantom -- test',
  build: 'mkdir -p dist && browserify . -o dist/combokeys.js --standalone Combokeys',
  test: 'npm run lint && npm run unit && npm run build'

}
Package.githubRepo('PolicyStat/combokeys')
Package.keywords = [
  'keyboard',
  'shortcuts',
  'events',
  'browser'
]
Package.contributors = [
  {
    'name': 'Shahar Or',
    'email': 'mightyiampresence@gmail.com',
    'web': 'https://github.com/mightyiam'
  },
  {
    'name': 'Craig Campbell',
    'web': 'http://craig.is'
  }
]
Package.bugs = 'https://github.com/mightyiam/combokeys/issues'
Package.license = {
  'type': 'Apache 2.0',
  'url': 'https://www.apache.org/licenses/LICENSE-2.0.txt'
}
Package.devDependencies = {
  standard: '*',
  'auto-package': '^1.0.0',
  'browserify': '^9.0.3',
  'proclaim': '^3.1.0',
  'es5-shim': '^4.0.3',
  'grunt': '~0.4.1',
  'grunt-complexity': '~0.1.2',
  'grunt-eslint': '^2.0.0',
  'load-grunt-tasks': '^1.0.0',
  'mocha': '^2.0.1',
  'phantomjs': '^1.9.12',
  'sinon': '^1.12.1',
  'zuul': '^2.1.1'
}
Package.dependencies = {
  'dom-event': '^0.0.4'
}
Package.standard = {
  ignore: [
    'dist/**'
  ]
}
