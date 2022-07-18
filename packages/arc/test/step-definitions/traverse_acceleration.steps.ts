import { loadFeature, defineFeature } from 'jest-cucumber'
import { build } from '../../src/math/BVH2D';
import { createAABBData, createAABB } from '../tool/AABBTool';
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
	}

	test('not intersect case1', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let acceleartion
		let result
		let isIntersectWithInstanceStub

		_prepare(given)

		given("create instances and their aabbs", () => {
			allAABBData = [
				createAABBData(0.5, 0.3, 0.8, 0.9, 0),
				createAABBData(0.6, 0.2, 0.7, 0.5, 1),
			]

			isIntersectWithInstanceStub = sandbox.stub()
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = build(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion that point is outside aabb', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				Vector2.create(0.75, 0.25),
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should not intersect', () => {
			expect(result.isClosestHit).toBeFalsy()
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
			allAABBData = [
				createAABBData(0.5, 0.3, 0.8, 0.9, 0),
				createAABBData(0.6, 0.2, 0.7, 0.5, 1),
			]

			isIntersectWithInstanceStub = sandbox.stub()
			isIntersectWithInstanceStub.returns(false)
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = build(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion that point not intersect with instances', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				Vector2.create(0.65, 0.45),
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should not intersect', () => {
			expect(result.isClosestHit).toBeFalsy()
		});
	});


	test('intersect case1', ({ given, and, when, then }) => {
	// test('aaa', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let acceleartion
		let result
		let isIntersectWithInstanceStub

		_prepare(given)

		given("create instances and their aabbs", () => {
			allAABBData = [
				createAABBData(0.5, 0.3, 0.8, 0.9, 0),
				createAABBData(0.6, 0.2, 0.7, 0.5, 1),
			]

			isIntersectWithInstanceStub = sandbox.stub()
			isIntersectWithInstanceStub.onCall(0).returns(false)
			isIntersectWithInstanceStub.onCall(1).returns(true)
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = build(allAABBData, arg0)
		});

		and('build acceleartion with bvh', () => {
			acceleartion = Acceleration.build(tree)
		});

		when('traverse acceleartion', () => {
			let [topLevelArr, bottomLevelArr] = acceleartion

			result = Acceleration.traverse(
				isIntersectWithInstanceStub,
				Vector2.create(0.65, 0.45),
				topLevelArr,
				bottomLevelArr
			)
		});

		then('should intersect', () => {
			expect(result.isClosestHit).toBeTruthy()
			expect(result.instanceIndex).toEqual(1)
		});
	});
})