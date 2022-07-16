let build = (allAABBData) => {
	// forEach x,y;
	// if(count <= 5) stop;

	// bottom: local aabbs
	bottom: world aabbs(contiguous memory)

	top: bvh2D structure:
	Node:
	data: world aabb
	// isLeaf: bool

	// children: array<int>
	if no child, set to 0(check: child1, child2 should be 0 together!)
	child1
	child2

	instanceOffset
	instanceCount

	root(first one) + array<Node>
}

traverse<recursive>:
if (intersect(data, ray)) {
	if (isLeafNode(node): child1(/or child2) === 0){
		test intersect with instances(instanceOffset, instanceCount)

		return closesetHit
}

hit1 = intersect(ray, child1)
hit2 = intersect(ray, child2)

return closesetHit(hit1, hit2)
}

return miss




traverse<iterate>(otherChildResult):


if (!intersect(rootNode, ray)) {
	return miss;
}


var node = rootNode.child1

var childResultArr:array<IntersectResult, 2> = []
var childResultArrSize = 0

var parentNodeOtherChild = rootNode.child2

while (intersect(node, ray)) {
	if (isLeafNode(node): child1(/or child2) === 0){
		var intersectResult = test intersect with instances(instanceOffset, instanceCount)


// TODO fix: childResultArr.push(closesetHit(intersectResult))
childResultArr[childResultArrSize] = closesetHit(intersectResult)
childResultArrSize = childResultArrSize + 1

	node = parentNodeOtherChild
}
else {
	node = node.child1
	parentNodeOtherChild = node.child2
}
}

if (childResultArrSize > 0) {
	return closesetHit(childResultArr)
}
else {
	return miss;
}