/**
 * 
 * @param {babel ast node} node {type: MemberExpression}
 * @param {string} expressionStr eg. ppap.apple
 */
const babelTypes = require('@babel/types')
function getMemberExpStr(node) {
    
}
function isSameExpression(node, expressionStr) {
   let expArr = expressionStr.split('.')
   expArr.reverse()
   for (let i = 0; i < expArr.length; i++) {
       let key = expArr[i]
       let nodeName = ''
       if (babelTypes.isMemberExpression(node)) {
           nodeName = node.property.name
       }
       if (babelTypes.isIdentifier(node)) {
          nodeName = node.name
       }
       
       if (key !== nodeName) {
          return false
       }
       node = node.object
   }
   return true
}
function extend() {
    let args = Array.from(arguments).map(i => i)
    return Object.assign.apply(null, [{}].concat(args))
}
module.exports = {
    isSameExpression,
    extend
}