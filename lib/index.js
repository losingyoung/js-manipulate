const traverser = require("@babel/traverse")
const parser = require("@babel/parser");
const generator = require('@babel/generator')
const babelTypes = require('@babel/types')
const fs = require('fs')
const config = require('../config')
const defaultOpt = {}
const path = require('path')
const {isSameExpression} = require('./utils.js')
// const getNameSpace = require('../source/getNameSpace')
// const getNameDic = require('../source/getNameDic')

class JsTransform {
    constructor(opt) {
       let sourceCode = this.sourceCode = fs.readFileSync(path.resolve(__dirname, '../source/source.js'),{encoding:"utf-8"})
        this.ast = parser.parse(sourceCode)
        this.getNameSpace = null
        this.getNameDic = null
        this.init(opt)
    }
    init(opt) {
        console.log('tt',traverser)
        let self = this
        traverser.default(this.ast, {
            enter(path) {
                if (babelTypes.isProgram(path.node)) {
                    return
                }
                let node = path.node
                if (!babelTypes.isExpressionStatement(node)) {
                   path.skip()
                   return
                }
                node = node.expression
                if (!babelTypes.isMemberExpression(node.left) || !babelTypes.isCallExpression(node.right)) {
                    path.skip()
                    return
                }
                let left = node.left
                let right = node.right
                
                if (isSameExpression(left, `${config.baseFuncName}.${config.nameDicKey}`)) {
                    let {code} = generator.default(right)
                    eval('self.getNameDic = ' + code)
                }
                if (isSameExpression(left, `${config.baseFuncName}.${config.nameSpaceKey}`)) {
                    let {code} = generator.default(right)
                    eval('self.getNameSpace = ' + code)
                }
                if (self.getNameSpace && self.getNameDic) {
                    path.stop()
                }
            }
        })
         console.log('init',this.getNameSpace,this.getNameDic)
    }
    
}

module.exports = JsTransform