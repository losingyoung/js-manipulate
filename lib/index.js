const traverser = require("@babel/traverse")
const parser = require("@babel/parser");
const generator = require('@babel/generator')
const babelTypes = require('@babel/types')
const fs = require('fs')
const config = require('../config')
const defaultOpt = {
    findNameDicAndSpace: true
}
const path = require('path')
const {isSameExpression, extend} = require('./utils.js')
// const getNameSpace = require('../source/getNameSpace')
// const getNameDic = require('../source/getNameDic')

class JsTransform {
    constructor(opt = {}) {
        let sourceCode = this.sourceCode = fs.readFileSync(path.resolve(__dirname, '../source/source.js'),{encoding:"utf-8"})
        this.ast = parser.parse(sourceCode)
        this.getNameSpace = null
        this.getNameDic = null
        this.extendOpt(opt)
        this.init()
    }
    init() {
        if (this.findNameDicAndSpace) {
            let self = this
            traverser.default(this.ast, {
                enter(path) {
                    self.findNameDixAndNameSpace(path)
                }
            })
            let getNameSpaceExp = ''
            let getNameDicExp = ''
            if (typeof this.getNameSpace === 'object') {
                let key = Object.keys(this.getNameSpace)
               this.getNameSpaceExp = getNameSpaceExp = `${config.baseFuncName}.${config.nameSpaceKey}.${key[0]}`
            }
            if (typeof this.getNameDic === 'object') {
                let key = Object.keys(this.getNameDic)
               this.getNameDicExp = getNameDicExp = `${config.baseFuncName}.${config.nameDicKey}.${key[0]}`
            }
            traverser.default(this.ast, {
                enter(path) {
                        // 找到现在的namespace namenic key是哪些 后面替换
                        self.findNameSpaceAndDicFnKey(path)

                }
            })
            console.log('init',getNameSpaceExp,getNameDicExp)
        }
    }
    extendOpt(opt) {
       let combined = extend(defaultOpt, opt)
       Object.assign(this, combined)
    }
    findNameDixAndNameSpace(path) {
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
            eval('this.getNameDic = ' + code)
            path.remove()
        }
        if (isSameExpression(left, `${config.baseFuncName}.${config.nameSpaceKey}`)) {
            let {code} = generator.default(right)
            eval('this.getNameSpace = ' + code)
            path.remove()
        }
        if (this.getNameSpace && this.getNameDic) {
            
            path.stop()
        }
    }
    findNameSpaceAndDicFnKey(path) {
        let node = this.findFirstLevelPath(path)
        if (!node)return
        let left = node.left
        let right = node.right
        let fnBody = right.body.body
        if (!babelTypes.isReturnStatement(fnBody[0])) {
            return
        }
        let returnArgs = fnBody[0].argument
        console.log('fiorst', returnArgs)
    
        
    }
    findFirstLevelPath(path) {
        if (babelTypes.isProgram(path.node)) {
            return false
        }
        let node = path.node
        if (!babelTypes.isExpressionStatement(node)) {
           path.skip()
           return false
        }
        node = node.expression
        if (!babelTypes.isMemberExpression(node.left) || !babelTypes.isFunctionExpression(node.right)) {
            path.skip()
            return false
        }
        return node
    }
    
}

module.exports = JsTransform