import { loadFeature, defineFeature } from 'jest-cucumber'
import { build as buildByLBVH } from '../../src/math/LBVH2D';
import { createAABBData } from '../tool/AABBTool';
import * as Vector2 from "../../src/math/Vector2"
import * as Acceleration from '../../src/math/Acceleration';
import * as Sinon from "sinon";

const feature = loadFeature('./test/features/traverse_acceleration.feature');

defineFeature(feature, test => {
	let sandbox

	let _prepare = (given) => {
		given("prepare sandbox", () => {
			sandbox = Sinon.createSandbox()
		});

		// TODO add more
	}

	let _buildAllAABBData = () => [
		createAABBData(0.5, 0.3, 0.8, 0.9, 0, 1),
		createAABBData(0.6, 0.2, 0.7, 0.5, 1, 2),
	]

	test('not intersect case1', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let acceleartion
		let result
		let isIntersectWithInstanceStub
		// let getInstanceLayerStub

		_prepare(given)

		given("create instances and their aabbs", () => {
			allAABBData = _buildAllAABBData()

			isIntersectWithInstanceStub = sandbox.stub()
			// getInstanceLayerStub = sandbox.stub()
			// getInstanceLayerStub.returns(0)
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = buildByLBVH(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion that points is outside aabb', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				[
					Vector2.create(0.75, 0.25),
					Vector2.create(0.9, 0.28)
				],
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should not intersect', () => {
			expect(result[0].isClosestHit).toBeFalsy()
			expect(result[1].isClosestHit).toBeFalsy()
		});
	});


	test('not intersect case2', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let acceleartion
		let result
		let isIntersectWithInstanceStub

		_prepare(given)

		given("create instances and their aabbs", () => {
			allAABBData = _buildAllAABBData()

			isIntersectWithInstanceStub = sandbox.stub()
			isIntersectWithInstanceStub.returns(false)
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = buildByLBVH(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion that points not intersect with instances', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				[
					Vector2.create(0.65, 0.45),
					Vector2.create(0.75, 0.55)
				],
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should not intersect', () => {
			expect(result.length).toEqual(2)

			expect(result[0].isClosestHit).toBeFalsy()
			expect(result[1].isClosestHit).toBeFalsy()
		});
	});


	test('intersect case1', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let acceleartion
		let result
		let isIntersectWithInstanceStub

		_prepare(given)

		given("create instances and their aabbs", () => {
			allAABBData = _buildAllAABBData()

			isIntersectWithInstanceStub = sandbox.stub()
			isIntersectWithInstanceStub.onCall(0).returns(true)
			isIntersectWithInstanceStub.onCall(1).returns(false)
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = buildByLBVH(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion with one point', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				[
					Vector2.create(0.65, 0.45),
				],
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should intersect', () => {
			expect(result.length).toEqual(1)

			expect(result[0].isClosestHit).toBeTruthy()
			expect(result[0].instanceIndex).toEqual(0)
		});
	});

	test('intersect case2', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let acceleartion
		let result
		let isIntersectWithInstanceStub

		_prepare(given)

		given("create instances and their aabbs", () => {
			allAABBData = _buildAllAABBData()

			isIntersectWithInstanceStub = sandbox.stub()
			isIntersectWithInstanceStub.onCall(0).returns(true)
			isIntersectWithInstanceStub.onCall(1).returns(true)
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = buildByLBVH(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				[
					Vector2.create(0.55, 0.35),
					Vector2.create(0.65, 0.25)
				],
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should intersect', () => {
			expect(result.length).toEqual(2)

			expect(result[0].isClosestHit).toBeTruthy()
			expect(result[0].instanceIndex).toEqual(0)
			expect(result[1].isClosestHit).toBeTruthy()
			expect(result[1].instanceIndex).toEqual(1)
		});
	});

	test('intersect case3', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let acceleartion
		let result
		let isIntersectWithInstanceStub

		_prepare(given)

		given("create instances and their aabbs", () => {
			allAABBData = _buildAllAABBData()

			isIntersectWithInstanceStub = sandbox.stub()
			isIntersectWithInstanceStub.onCall(0).returns(false)
			isIntersectWithInstanceStub.onCall(1).returns(true)
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = buildByLBVH(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				[
					Vector2.create(0.55, 0.35),
					Vector2.create(0.65, 0.25)
				],
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should intersect', () => {
			expect(result.length).toEqual(2)

			expect(result[0].isClosestHit).toBeFalsy()
			expect(result[1].isClosestHit).toBeTruthy()
			expect(result[1].instanceIndex).toEqual(1)

		});
	});

	// TODO extract _prepareForFindClosestHit function

	let _buildAllAABBData2 = () => [
		createAABBData(-0.1, 0.1, 0.6, 0.5, 0, 1),
		createAABBData(-0.4, -0.4, -0.1, -0.2, 1, 4),
		createAABBData(0.2, 0.2, 0.7, 0.6, 2, 3),
		createAABBData(0.3, 0.3, 0.8, 0.8, 3, 2),
	]


	test('not find closest hit case1', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let acceleartion
		let result
		let isIntersectWithInstanceStub

		_prepare(given)

		given('create instances and their aabbs that are overlap', () => {
			allAABBData = _buildAllAABBData2()

			isIntersectWithInstanceStub = sandbox.stub()
			isIntersectWithInstanceStub.returns(true)
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = buildByLBVH(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				[
					Vector2.create(0.2, -0.2),
					Vector2.create(0.3, -0.2),
					// Vector2.create(1.0, 0.3),
					// Vector2.create(2.0, 0.3),
				],
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should not intersect', () => {
			expect(result.length).toEqual(2)

			expect(result[0].isClosestHit).toBeFalsy()
			expect(result[1].isClosestHit).toBeFalsy()
			// expect(result[2].isClosestHit).toBeFalsy()
			// expect(result[3].isClosestHit).toBeFalsy()
		});
	});

	test('find closest hit case1', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let acceleartion
		let result
		let isIntersectWithInstanceStub

		_prepare(given)

		given('create instances and their aabbs that are overlap', () => {
			allAABBData = _buildAllAABBData2()

			isIntersectWithInstanceStub = sandbox.stub()
			isIntersectWithInstanceStub.returns(false)
			isIntersectWithInstanceStub.withArgs(Sinon.match.any, 1).returns(true)
			isIntersectWithInstanceStub.withArgs(Sinon.match.any, 2).returns(true)
			isIntersectWithInstanceStub.withArgs(Sinon.match.any, 3).returns(true)
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = buildByLBVH(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion with one point', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				[Vector2.create(0.4, 0.45)],
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should intersect with the closet hit', () => {
			expect(result.length).toEqual(1)

			expect(result[0].isClosestHit).toBeTruthy()
			expect(result[0].instanceIndex).toEqual(2)
		});
	});

	test('find closest hit case2', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let acceleartion
		let result
		let isIntersectWithInstanceStub

		_prepare(given)

		given('create instances and their aabbs that are overlap', () => {
			allAABBData = _buildAllAABBData2()

			isIntersectWithInstanceStub = sandbox.stub()
			isIntersectWithInstanceStub.returns(false)
			isIntersectWithInstanceStub.withArgs(Sinon.match.any, 1).returns(true)
			isIntersectWithInstanceStub.withArgs(Sinon.match.any, 2).returns(true)
			isIntersectWithInstanceStub.withArgs(Sinon.match.any, 3).returns(true)
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = buildByLBVH(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				[
					Vector2.create(0.45, 0.45),
					Vector2.create(0.75, 0.45),
					Vector2.create(0.45, 0.25),
					Vector2.create(0.75, 0.25),
				],
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should intersect with the closet hit', () => {
			expect(result.length).toEqual(4)

			expect(result[0].isClosestHit).toBeTruthy()
			expect(result[0].instanceIndex).toEqual(2)
			expect(result[1].isClosestHit).toBeTruthy()
			expect(result[1].instanceIndex).toEqual(3)
			expect(result[2].isClosestHit).toBeTruthy()
			expect(result[2].instanceIndex).toEqual(2)
			expect(result[3].isClosestHit).toBeFalsy()
			// expect(result[3].instanceIndex).toEqual(2)
		});
	});
})

