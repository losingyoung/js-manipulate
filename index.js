
const fs = require('fs')
const BabelParser = require('@babel/parser')
const NameDic = require('./geetest/nameDic')
const babel = require("@babel/core");
const BabelTypes = require('@babel/types')


function Geetest() {
}

Geetest.getNameSpace = function () {
    return Geetest.J46.NameSpace;
};
Geetest.getNameDic = function (idx) {
    return NameDic[idx]
};
Geetest.J46 = {
    NameSpace: function V76(h76, M46) {
        var r46 = 2;
        while (r46 !== 10) {
            switch (r46) {
            case 14:
                g76[c76][(G76 + M46 * c76) % h76] = g76[G76];
                r46 = 13;
                break;
            case 7:
                var G76 = h76 - 1;
                r46 = 6;
                break;
            case 8:
                r46 = c76 < h76 ? 7 : 11;
                break;
            case 3:
                B46 += 1;
                r46 = 5;
                break;
            case 2:
                var g76 = [];
                r46 = 1;
                break;
            case 9:
                var c76 = 0;
                r46 = 8;
                break;
            case 5:
                r46 = B46 < h76 ? 4 : 9;
                break;
            case 1:
                var B46 = 0;
                r46 = 5;
                break;
            case 6:
                r46 = G76 >= 0 ? 14 : 12;
                break;
            case 4:
                g76[(B46 + M46) % h76] = [];
                r46 = 3;
                break;
            case 13:
                G76 -= 1;
                r46 = 6;
                break;
            case 12:
                c76 += 1;
                r46 = 8;
                break;
            case 11:
                return g76;
            }
        }
    }(35, 12)
};
const redudantExpressionVisitor = {
    LogicalExpression: removeRedudantLogic
}
function visitorFn (path){

    let node = path.node
    let functionBody = node.body&& node.body.body
    let ifTryStat = false
    if (BabelTypes.isTryStatement(node)) {
        functionBody = node.block.body
        ifTryStat = true
    }
    for (let i = 0; i < functionBody.length; i++) {
        let bodyNode = functionBody[i]
        if (BabelTypes.isWhileStatement(bodyNode) && (functionBody[i - 1]&&BabelTypes.isVariableDeclaration(functionBody[i - 1]))) {
          let varPath = ifTryStat ? path.get(`block.body.${i - 1}`) : path.get(`body.body.${i - 1}`)
          let whilePath = ifTryStat ? path.get(`block.body.${i}`) : path.get(`body.body.${i}`)
          let testName = functionBody[i - 1].declarations[0].id.name
          
          if (bodyNode.test.left.name !== testName) {
              continue;
          } 
          
          let switchState = bodyNode.body.body[0]
          if (!BabelTypes.isSwitchStatement(switchState)) {
              continue
          }
          if (switchState.discriminant.name !== testName){
              continue
          }
          
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
              if (posInfo.length&&posInfo[posInfo.length - 1].isTrue === false) {
                  console.log('false if')
                  if (cancelArr.indexOf(boundCancelI) > -1) {
                    return
                  }
              }
             for (let i = 0; i < cases.length; i++) {
                 let caseNameSpace = getNodeSpaceAddress(cases[i].test)
                 
                 if (caseNameSpace == curNameSpace) {
                     if (cases[i].isWhile){
                        continue
                     }
                     let curPos = posInfo.length && posInfo[posInfo.length - 1]
                     if (curPos&&curPos.type=='if') {
                        curPos.cases.push(cases[i])
                     }
                     if (cases[i].appeared) {
                        cases[i].appeared.times += 1
                        cases[i].appeared.pos.push(posInfo.slice(0))
                     } else {
                        cases[i].appeared = {
                            pos:[posInfo], times:1
                        }
                     }
                     let newValueExpression = null
                     let preEndIdx = cases[i].consequent.length - 1
                     let ifReturnOrError = false
                     let caseBody = cases[i].consequent.filter((line, idx) => {
                         if (idx > preEndIdx) {
                             return false
                         }
                         if (BabelTypes.isReturnStatement(line) || BabelTypes.isThrowStatement(line)) {
                            preEndIdx = idx
                            ifReturnOrError = true
                         }
                         // 到下一条的也不存到body
                         if (BabelTypes.isExpressionStatement(line) && (line.expression.left && line.expression.left.name == testName) &&idx<preEndIdx) {
                           newValueExpression = getNodeSpaceAddress(line.expression.right)
                           return false
                         }
                         if(BabelTypes.isBreakStatement(line)){
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
                     
                     if (BabelTypes.isConditionalExpression(newValueExpression)) {
                         // 说明是个循环 把之前的if改成while, else  提升level放到后面
                         if (cases[i].appeared.times > 1 &&!hasSameParent(resultBlockBody, i, posInfo)) {
                             console.log('重复引用')
                             return
                         }
                        if (cases[i].appeared.times > 1 &&hasSameParent(resultBlockBody, i, posInfo)) {
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

                            let whileStatement = BabelTypes.whileStatement(newValueExpression.test, BabelTypes.blockStatement([]))
                            pushNode(resultBlockBody, whileStatement, posInfo)
                            whileStatement.caseI = i
                            cancelI+=1
                            switchCases(getNodeSpaceAddress(newValueExpression.consequent), posInfo.concat([{type:'while', cancelI}]),null,3)
                            switchCases(getNodeSpaceAddress(newValueExpression.alternate), posInfo,null,4)
                        } else { //if条件
                            console.log('if')
                            let ifStatement = BabelTypes.ifStatement(newValueExpression.test, BabelTypes.blockStatement([]), BabelTypes.blockStatement([]))
                            cancelI+=1
                            ifStatement.caseI = i
                            ifStatement.cancelI = cancelI
                            pushNode(resultBlockBody,ifStatement, posInfo)
                            cases[i].appearedIfNo= cancelI
                            const CANCELI = cancelI
                            switchCases(getNodeSpaceAddress(newValueExpression.consequent), posInfo.concat([{type: 'if', isTrue: true, cases:[cases[i]], cancelI}]), cancelI,1)

                            switchCases(getNodeSpaceAddress(newValueExpression.alternate), posInfo.concat([{type: 'if', isTrue: false, cases:[cases[i]], cancelI: CANCELI}]), CANCELI, 2)
                            
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
          
          
          varPath.remove()
          whilePath.replaceWithMultiple(resultBlockBody)
        }
    }
    // path.traverse({FunctionDeclaration: visitorFn})
  }
 
const visitor = {
    FunctionDeclaration: visitorFn,
    FunctionExpression:visitorFn,
    Function: visitorFn,
    TryStatement:visitorFn,
    // LogicalExpression:removeRedudantLogic
  };
  function getNodeSpaceAddress(node) {
      let arr = getNo(node)
      let initSpace = Geetest.getNameSpace()
      function getNo(node, arr = []) {
        if (BabelTypes.isMemberExpression(node)) {
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
    function getAssignmentNodeVal(assignment) {
    //   console.log(assignment)
        return assignment
    }
    function findLastNodes(nodeArr, posInfo) {
    let curNodeArr = nodeArr
    for (let i = 0; i < posInfo.length; i++) {
        let level = posInfo[i]
        let lastNode = curNodeArr[curNodeArr.length - 1]
        if (BabelTypes.isIfStatement(lastNode)) {
            curNodeArr = level.isTrue ? lastNode.consequent.body : lastNode.alternate.body
        }
        if (BabelTypes.isWhileStatement(lastNode)) {
            curNodeArr = lastNode.body.body
        }
    }
    return curNodeArr
    }
    function delTargetNode(nodeArr, cancelI) {
        if (nodeArr.length === 0) {
            return
        }
        let curNodeArr = nodeArr
        for (let i = 0; i < nodeArr.length; i++) {
            if (nodeArr.length === 0) {
                break
            }
            let node = nodeArr[i]
            if (node.cancelI === cancelI) {
                // minusOneNodeAppear(node)
                nodeArr.splice(i, 1)
                return
            }
            if (BabelTypes.isIfStatement(node)) {
                curNodeArr = node.consequent.body // false的暂时不会走到 --------
                delTargetNode(curNodeArr, cancelI)
            }
            if (BabelTypes.isWhileStatement(node)) {
                curNodeArr = node.body.body
                delTargetNode(curNodeArr, cancelI)
            }
        }
        
    }
    function delPosPathAndAppear(posInfo, cancelI) {
        let posIdx = 0
        posInfo.some((pos, idx) => {
            if (pos.cancelI === cancelI) {
                posIdx = idx
                return true
            }
            return false
        })
        let poses = posInfo.slice(posIdx)
        poses.forEach(pos => {
            pos.cases&&pos.cases.forEach(Case => {
                Case.appeared = {pos:[],times:0}
            })
        })
        return posInfo.slice(0, posIdx)
    }
    function hasSameParent(nodeArr, caseI, posInfo) {
        let poses = posInfo.slice(0)
        let curNode = nodeArr
        for (let posI = 0; posI < poses.length; posI++) {
            let pos = poses[posI]
            for (let nodeI = 0; nodeI < curNode.length; nodeI++) {
                let node = curNode[nodeI]
                if (node.caseI === caseI) {
                    return true
                }
                if (node.cancelI === pos.cancelI) {
                    if (BabelTypes.isIfStatement(node)) {
                        curNode = pos.isTrue ? node.consequent.body : node.alternate.body
                    }
                    if (BabelTypes.isWhileStatement(node)) {
                        curNode = node.body.body
                    }
                }
            }
        }
        return false
    }
    function pushNode(nodeArr, node, posInfo) {
    let curNodeArr = findLastNodes(nodeArr, posInfo)
    curNodeArr.push(node)
    }
    function concatNode(nodeArr, nodes, posInfo) {
    // let curNodeArr = findLastNodes(nodeArr, posInfo)
    let curNodeArr = nodeArr
    for (let i = 0; i < posInfo.length; i++) {
        if (curNodeArr.length == 0) {
            break
        }
        let level = posInfo[i]
        let lastNode = curNodeArr[curNodeArr.length - 1]
    //    if (BabelTypes.isIfStatement(lastNode)) {
        if (lastNode.type == 'IfStatement') {
            curNodeArr = level.isTrue ? lastNode.consequent.body : lastNode.alternate.body
        }
    //    if (BabelTypes.isWhileStatement(lastNode)) {
        if (lastNode.type == 'WhileStatement') {
            curNodeArr = lastNode.body.body
        }
    }
    nodes.forEach(node => {
        curNodeArr.push(node)
    })
    // curNodeArr = curNodeArr.push(nodes)
    }
fs.readFile('./source/fullpage.js',{encoding:"utf-8"}, (err, data) => {
    var result = babel.transform(data, {
        "compact": false,
        plugins: [{
            visitor: visitor
        }]
    });
    fs.writeFile('./result/fullpage.js', result.code, err => {
        console.log('fini')
    })
    // console.log(result.code)
})
// fs.readFile('./geetest/newFullPage.js', {encoding:"utf-8"}, (err, data) => {
//     const reg = /Geetest.getNameDic\(\d+\)/g;
//     var result = data.match(reg)

//     if (result) {
//         let str = data.toString()
//         result.forEach((nameStr, idx) => {
//             // console.log('name', nameStr)
//             const regNo = /Geetest.getNameDic\((\d+)\)/
//             let numberResult = nameStr.match(regNo)
//             if (numberResult) {
//                 let no = numberResult[1]

//                 // console.log('no' + "=>" + no)
//                 let replacedStr = NameDic[no]
                
//                 str = str.replace(numberResult[0], "\"" + replacedStr.replace(/\n/g,"???") + "\"")
//             }
            
//         })
//         console.log('endfor')
//         console.log(str.match(/divider/g))
//         fs.writeFile('./geetest/newTest.js', str, err => {
//             console.log('err',err)
//         })
//     }
// })