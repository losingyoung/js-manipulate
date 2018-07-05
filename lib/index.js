const traverser = require("@babel/traverse")
const parser = require("@babel/parser");
const generator = require('@babel/generator')
const babelTypes = require('@babel/types')
const fs = require('fs')
const config = require('../config')
const defaultOpt = {
    findNameDicAndSpace: false,
    removeRedundantLogic: true
}
const path = require('path')
const {isSameExpression, extend, getMemberExpStr} = require('./utils.js')
const removeRedudantLogic = require('./removeRedudantLogic')
const decodeSwitch = require('./decodeSwitch')
// const getNameSpace = require('../source/getNameSpace')
// const getNameDic = require('../source/getNameDic')

class JsTransform {
    constructor(opt = {}) {
        let sourceCode = this.sourceCode = fs.readFileSync(path.resolve(__dirname, '../source/snippet.js'),{encoding:"utf-8"})
        this.ast = parser.parse(sourceCode)
        this.getNameSpace = null //
        this.getNameDic = null
        this.nameSpaceExp = null
        this.nameDicExp = null
        this.getNameDicFnArr = []  //所有返回namedic的函数
        this.getNameSpaceFnArr = []//所有返回namespace的函数
        this.extendOpt(opt)
        this.init()
    }
    init() {
        let self = this
        if (this.findNameDicAndSpace) {
            // 找到对应的namedic namespace执行函数
            traverser.default(this.ast, {
                enter(path) {
                    self.findNameDixAndNameSpace(path)
                }
            })
            let nameSpaceExp = ''
            let nameDicExp = ''
            if (typeof this.getNameSpace === 'object') {
                let key = Object.keys(this.getNameSpace)
                this.nameSpaceExp = nameSpaceExp = `${config.baseFuncName}.${config.nameSpaceKey}.${key[0]}`
                let keys = Object.keys(this.getNameSpace)
                this.getNameSpace = this.getNameSpace[keys[0]]
            }
            if (typeof this.getNameDic === 'object') {
                let key = Object.keys(this.getNameDic)
                this.nameDicExp = nameDicExp = `${config.baseFuncName}.${config.nameDicKey}.${key[0]}`
                let keys = Object.keys(this.getNameDic)
                this.getNameDic = this.getNameDic[keys[0]]
            }
            traverser.default(this.ast, {
                enter(path) {
                        // 找到现在获取namespace namenic fn的key是哪些 后面替换
                        self.findNameSpaceAndDicFnKey(path)
                }
            })
        }
        traverser.default(this.ast, {
            LogicalExpression(path) {
                removeRedudantLogic(path)
            },
            Function: decodeSwitch
        })
        this.generateSnippet(this.ast)
        // this.changeNameDics()
        // this.generateCode(this.ast)
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
            // path.remove()
        }
        if (isSameExpression(left, `${config.baseFuncName}.${config.nameSpaceKey}`)) {
            let {code} = generator.default(right)
            eval('this.getNameSpace = ' + code)
            
            // path.remove()
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
        if (!babelTypes.isConditionalExpression(returnArgs)) {
            return
        }
        if (!babelTypes.isBinaryExpression(returnArgs.test)) {
            return
        }
        if (!babelTypes.isUnaryExpression(returnArgs.test.left) || returnArgs.test.left.operator !== 'typeof') {
           return
        }
        let expr = returnArgs.test.left.argument
        let isNameSpace = isSameExpression(expr, this.nameSpaceExp)
        let isNameDic = isSameExpression(expr, this.nameDicExp)

        if (!isNameSpace && !isNameDic) {
            path.remove()
            return
        }
        let fnExpr = getMemberExpStr(left)
        let fnExprArr = fnExpr.split('.')
        if (fnExprArr.length > 1) {
            fnExprArr.shift()
            fnExpr = fnExprArr.join('.')
        }
        if (isNameDic) {
            this.getNameDicFnArr.push(fnExpr)
        }
        if (isNameSpace) {
            this.getNameSpaceFnArr.push(fnExpr)
        }
        
    }
    // 找到第一层表达式
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
    // 把namedic替换掉
    changeNameDics() {
        let self = this
        traverser.default(this.ast, {
            VariableDeclarator(path) {
                let node = path.node
                if (node.init&&node.init.name ===config.baseFuncName) {
                    let varBaseFnName = node.id.name
                    let functionPath = path.scope.getFunctionParent() || path.scope.getProgramParent()
                    console.log(functionPath)
                    functionPath.path.traverse({
                      CallExpression(innerPath) {
                         replaceCall2Str(innerPath, [config.baseFuncName, varBaseFnName])
                      }
                    })
                    path.skip()
                }  
            },
            CallExpression(path) {
                replaceCall2Str(path)
            },
            Literal(path) {
                self.decode16Str(path)
            }
        })
       function replaceCall2Str(path, baseNames = [config.baseFuncName]) {
          let node = path.node
          if (!babelTypes.isMemberExpression(node.callee)) {
              return
          }
          let callee = node.callee
        //   if (callee.object.name =="p3qq" && ~self.getNameDicFnArr.indexOf(callee.property.name)) {

        //   }
          if (~self.getNameDicFnArr.indexOf(callee.property.name) && ~baseNames.indexOf(callee.object.name)) {
              let argument = node.arguments[0].value
            let str = self.getNameDic(argument)
            path.replaceWith(babelTypes.stringLiteral(str))
          }
       }

    }
    decode16Str(path) {
        let node = path.node
        if (babelTypes.isStringLiteral(node)) {
            if (!node.extra) {
                return
            }
            let extra = node.extra
            if (extra.raw &&(node.value !== extra.raw)) {
                path.replaceWith(babelTypes.stringLiteral(node.value))
            }
        }
    }
    generateCode(node) {
        let {code} = generator.default(node)
        fs.writeFileSync(path.resolve(__dirname, '../result/result.js'), code)
    }
    generateSnippet(node) {
        let {code} = generator.default(node)
        fs.writeFileSync(path.resolve(__dirname, '../result/snippet.js'), code)
    }
}

module.exports = JsTransform