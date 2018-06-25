#!/usr/bin/env node
var program = require('commander');
const App = require('../lib')

program
  .version('0.0.1')
  .command('test ')
  .action(function (cmd) {
    new App()
  })

program.parse(process.argv)