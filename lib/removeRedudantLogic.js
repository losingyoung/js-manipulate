
const babelTypes = require('@babel/types')
module.exports = function removeRedudantLogic(path) {
    // console.log(path)
    let node = path.node
    if (node.operator !== "&&") {
        return
    }
    let isLeft = testPattern(node.left)
    let isRight = testPattern(node.right)
    if (!isLeft) {
        isLeft = testPattern2(node.left)
    }
    if (!isRight) {
        isRight = testPattern2(node.right)
    }
    if (isLeft) {
        path
            .get('left')
            .remove()
        removeVarDecla(path, isLeft)
    }
    if (isRight) {
        path
            .get('right')
            .remove()
            removeVarDecla(path, isRight)
    }

}
function removeVarDecla(path, name) {
    let functionPath = path
        .scope
        .getFunctionParent() || path
        .scope
        .getProgramParent()
    functionPath
        .path
        .traverse({
            VariableDeclarator(innerPath) {
                if (innerPath.node.id.name == name)
                innerPath.remove()
            }
        })
}
function testPattern(node) {
    if (!babelTypes.isBinaryExpression(node) || node.operator !== "==") {
        return false
    }
    let numerical = []
    let binary = []

    if (babelTypes.isNumericLiteral(node.left)) {
        numerical.push(node.left)
    }
    if (babelTypes.isNumericLiteral(node.right)) {
        numerical.push(node.right)
    }
    if (babelTypes.isBinaryExpression(node.left)) {
        binary.push(node.left)
    }
    if (babelTypes.isBinaryExpression(node.right)) {
        binary.push(node.right)
    }
    if (numerical.length !== 1 || binary.length !== 1) {
        return false
    }
    let testResult = testBinaryExp(binary[0])
    if (!testResult) {
        return false
    }

    return testResult

}
function testPattern2(node) {
    // if (!babelTypes.isBinaryExpression(node) || node.operator !== "+") {
    // return false }
    let testResult = testBinaryExp2(node)
    if (!testResult) {
        return false
    }

    return testResult
}
function testBinaryExp(node) {
    if (!babelTypes.isBinaryExpression(node.left) || !babelTypes.isNumericLiteral(node.right) || node.operator !== "%") {
        return false
    }
    let nextNode = node.left
    if (!babelTypes.isBinaryExpression(nextNode.left) || !babelTypes.isIdentifier(nextNode.right) || nextNode.operator !== "*") {
        return false
    }
    let rightId = nextNode.right.name
    nextNode = nextNode.left
    if (!babelTypes.isIdentifier(nextNode.left) || !babelTypes.isBinaryExpression(nextNode.right) || nextNode.operator !== "*") {
        return false
    }
    let leftId = nextNode.left.name
    if (rightId !== leftId) {
        return false
    }
    nextNode = nextNode.right
    if (!babelTypes.isIdentifier(nextNode.left) || !babelTypes.isNumericLiteral(nextNode.right) || nextNode.operator !== "+") {
        return false
    }
    let lastId = nextNode.left.name
    if (lastId !== leftId) {
        return false
    }
    return lastId

}
function testBinaryExp2(node) {
    if (!babelTypes.isBinaryExpression(node.left) || !babelTypes.isNumericLiteral(node.right) || node.operator !== "+") {
        return false
    }
    let nextNode = node.left
    if (!babelTypes.isBinaryExpression(nextNode.left) || !babelTypes.isNumericLiteral(nextNode.right) || nextNode.operator !== "%") {
        return false
    }
    nextNode = nextNode.left
    if (!babelTypes.isIdentifier(nextNode.left) || !babelTypes.isBinaryExpression(nextNode.right) || nextNode.operator !== "*") {
        return false
    }
    let leftId = nextNode.left.name
    nextNode = nextNode.right
    if (!babelTypes.isIdentifier(nextNode.left) || !babelTypes.isNumericLiteral(nextNode.right) || nextNode.operator !== "+") {
        return false
    }
    let lastId = nextNode.left.name
    if (lastId !== leftId) {
        return false
    }
    return lastId

}