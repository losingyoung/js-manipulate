const babelTypes = require('@babel/types')

// path 是block statement
module.exports = class FnVisitor {
  constructor({ path, baseNames, getNameSpace }) {
    if (!path) {
      console.log('no path')
      return
    }
    if (!baseNames) {
      console.log("no baseNames")
      return
    }
    if (!getNameSpace) {
      console.log('no getNameSapce')
      return
    }
    this.path = path
    this.baseNames = baseNames
    this.getNameSpace = getNameSpace
    this.init()
  }
  init() {
    const {path} = this
    let node = path.node
    let functionBody = node.body
    for (let i = 0; i < functionBody.length; i++) {
      let bodyNode = functionBody[i]
      if (babelTypes.isWhileStatement(bodyNode) && (functionBody[i - 1] && babelTypes.isVariableDeclaration(functionBody[i - 1]))) {
        let varPath =  path.get(`body.${i - 1}`)
        let whilePath = path.get(`body.${i}`)
        let testName = functionBody[i - 1].declarations[0].id.name

        if (bodyNode.test.left.name !== testName) {
          continue;
        }

        let switchState = bodyNode.body.body[0]
        if (!babelTypes.isSwitchStatement(switchState)) {
          continue
        }
        if (switchState.discriminant.name !== testName) {
          continue
        }

        let resultBlockBody = this.decodeFnBody()
        varPath.remove()
        whilePath.replaceWithMultiple(resultBlockBody)
      }
    }
  }

  decodeFnBody() {
    let initVarNameNode = getNodeSpaceAddress(functionBody[i - 1].declarations[0].init)
    let endWhileNodeVal = getNodeSpaceAddress(bodyNode.test.right)
    let cases = switchState.cases
    let resultBlockBody = []
    //   let ifToWhilePos = []
    let cancelI = 0
    let cancelArr = []
    // testname 每次值更新的变量名 curNameSpace值
    // posInfo: [{type:'if', isTrue: true}]
    function switchCases(curNameSpace, posInfo = [], boundCancelI, ques) {
      if (posInfo.length && posInfo[posInfo.length - 1].isTrue === false) {
        console.log('false if')
        if (cancelArr.indexOf(boundCancelI) > -1) {
          return
        }
      }
      for (let i = 0; i < cases.length; i++) {
        let caseNameSpace = getNodeSpaceAddress(cases[i].test)
  
        if (caseNameSpace == curNameSpace) {
          if (cases[i].isWhile) {
            continue
          }
          let curPos = posInfo.length && posInfo[posInfo.length - 1]
          if (curPos && curPos.type == 'if') {
            curPos.cases.push(cases[i])
          }
          if (cases[i].appeared) {
            cases[i].appeared.times += 1
            cases[i].appeared.pos.push(posInfo.slice(0))
          } else {
            cases[i].appeared = {
              pos: [posInfo], times: 1
            }
          }
          let newValueExpression = null
          let preEndIdx = cases[i].consequent.length - 1
          let ifReturnOrError = false
          let caseBody = cases[i].consequent.filter((line, idx) => {
            if (idx > preEndIdx) {
              return false
            }
            if (babelTypes.isReturnStatement(line) || babelTypes.isThrowStatement(line)) {
              preEndIdx = idx
              ifReturnOrError = true
            }
            // 到下一条的也不存到body
            if (babelTypes.isExpressionStatement(line) && (line.expression.left && line.expression.left.name == testName) && idx < preEndIdx) {
              newValueExpression = getNodeSpaceAddress(line.expression.right)
              return false
            }
            if (babelTypes.isBreakStatement(line)) {
              return false
            }
            return true
          })
  
  
          concatNode(resultBlockBody, caseBody, posInfo)
  
          if (ifReturnOrError) {
            return
          }
          // 根据newValueNode获取下一个case
          //    console.log(newValueExpression,preEndIdx,caseBody)
  
          if (babelTypes.isConditionalExpression(newValueExpression)) {
            // 说明是个循环 把之前的if改成while, else  提升level放到后面
            if (cases[i].appeared.times > 1 && !hasSameParent(resultBlockBody, i, posInfo)) {
              console.log('重复引用')
              return
            }
            if (cases[i].appeared.times > 1 && hasSameParent(resultBlockBody, i, posInfo)) {
              // cases[i].toWhile = true
              // ifToWhilePos.push(posInfo.slice(0))
              cases[i].isWhile = true
              cancelArr.push(cancelI)
              cancelArr = cancelArr.concat(cases[i].appearedIfNo)
              console.log('if => while')
  
              // 删除对应的位置
  
              let delIfNo = cases[i].appearedIfNo
              // 删除对应的 节点i
              delTargetNode(resultBlockBody, delIfNo)
              posInfo = delPosPathAndAppear(posInfo, delIfNo)
  
              let whileStatement = babelTypes.whileStatement(newValueExpression.test, babelTypes.blockStatement([]))
              pushNode(resultBlockBody, whileStatement, posInfo)
              whileStatement.caseI = i
              cancelI += 1
              switchCases(getNodeSpaceAddress(newValueExpression.consequent), posInfo.concat([{ type: 'while', cancelI }]), null, 3)
              switchCases(getNodeSpaceAddress(newValueExpression.alternate), posInfo, null, 4)
            } else { //if条件
              console.log('if')
              let ifStatement = babelTypes.ifStatement(newValueExpression.test, babelTypes.blockStatement([]), babelTypes.blockStatement([]))
              cancelI += 1
              ifStatement.caseI = i
              ifStatement.cancelI = cancelI
              pushNode(resultBlockBody, ifStatement, posInfo)
              cases[i].appearedIfNo = cancelI
              const CANCELI = cancelI
              switchCases(getNodeSpaceAddress(newValueExpression.consequent), posInfo.concat([{ type: 'if', isTrue: true, cases: [cases[i]], cancelI }]), cancelI, 1)
  
              switchCases(getNodeSpaceAddress(newValueExpression.alternate), posInfo.concat([{ type: 'if', isTrue: false, cases: [cases[i]], cancelI: CANCELI }]), CANCELI, 2)
  
            }
            return
          }
  
          // 说明if else后面共有的 Not sure of this
          //    if (cases[i].appeared > 1) {
          //        console.log('if common')
          //       posInfo.pop() 
          //       let lastNodes = findLastNodes(resultBlockBody, posInfo.slice(0, posInfo.length - 1).concat([{type:'if',isTrue:true}]))
          //       let fromIdx = lastNodes.indexOf(cases[i])
          //       lastNodes = lastNodes.slice(0, fromIdx)
          //       concatNode(resultBlockBody, lastNodes.map(node => {
          //           return Object.assign(node, {appeared: 1})
          //       }), posInfo)
          //       return
          //     }
          // 如果不是三连判断 只是单纯的赋值 那要获取新的namespace
          let newValueNode = getAssignmentNodeVal(newValueExpression)
  
          if (!ifReturnOrError && (newValueNode && newValueNode !== endWhileNodeVal)) {
            // switch 下一个
            console.log('switch 下一个')
            switchCases(newValueNode, posInfo, boundCancelI)
            return
          }
          console.log('branch end')
          //    path.replaceWith(caseBody[0])
  
  
        }
      }
    }
  
    switchCases(initVarNameNode)
    console.log("Called!", resultBlockBody);
  }

  getNodeSpaceAddress(node) {
    let arr = getNo(node)
    let initSpace = Geetest.getNameSpace()
    function getNo(node, arr = []) {
      if (babelTypes.isMemberExpression(node)) {
        arr.unshift(node.property.value)
        return getNo(node.object, arr)
      } else {
        return arr
      }
    }
    if (!arr.length) {
      return node
    }
    return arr.reduce((sum, cur) => {
      return sum[cur]
    }, initSpace)
  }

}

