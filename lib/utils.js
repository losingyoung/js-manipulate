/**
 * 
 * @param {babel node} node {type: MemberExpression}
 * @param {string} expressionStr eg. ppap.apple
 */
const babelTypes = require('@babel/types')
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

module.exports = {
    isSameExpression
}