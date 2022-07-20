import { loadFeature, defineFeature } from 'jest-cucumber';
import { build, buildByLBVH, _findBit, _mortonEncodeGridPositionByMagicbits } from '../../src/math/BVH2D';
import { createAABBData, createAABB } from '../tool/AABBTool';
import * as Acceleration from '../../src/math/Acceleration';
import { dec2bin } from '../../src/utils/BitUtils';

const feature = loadFeature('./test/features/build_acceleration.feature');

defineFeature(feature, test => {
	test('build bvh with only one leaf node by middle', ({ given, when, then }) => {
		let allAABBData
		let tree

		given(/^create (\d+) aabbs$/, (arg0) => {
			allAABBData = [
				createAABBData(0.1, 0.2, 0.5, 0.5, 0),
				createAABBData(0.5, 0.3, 0.8, 0.9, 1),
			]
		});

		when(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = build(allAABBData, arg0)
		});

		then('should return tree which only has one leaf node', () => {
			expect(tree).toEqual({
				wholeAABB: createAABB(
					0.1, 0.2,
					0.8, 0.9
				),
				leafAllAABBData: allAABBData,
				child1: null,
				child2: null
			})
		});
	});

	test('build bvh with 2 depth by middle', ({ given, when, then }) => {
		let allAABBData
		let tree

		given(/^create (\d+) aabbs$/, (arg0) => {
			allAABBData = [
				createAABBData(0.5, 0.3, 0.3, 0.35, 0),
				createAABBData(0.1, 0.2, 0.5, 0.5, 2),
				createAABBData(-0.5, 0.2, 0.1, 0.3, 1),
			]
		});

		when(/^build bvh with minCount=(\d+), maxDepth=(\d+)$/, (arg0, arg1) => {
			tree = build(allAABBData, arg0, arg1)
		});

		then('should return correct tree', () => {
			// console.log(JSON.stringify(tree))
			expect(tree).toEqual({
				"wholeAABB": {
					"worldMin": [
						-0.5,
						0.2
					],
					"worldMax": [
						0.5,
						0.5
					]
				},
				"leafAllAABBData": null,
				"child1": {
					"wholeAABB": {
						"worldMin": [
							-0.5,
							0.2
						],
						"worldMax": [
							0.1,
							0.3
						]
					},
					"leafAllAABBData": [
						{
							"aabb": {
								"worldMin": [
									-0.5,
									0.2
								],
								"worldMax": [
									0.1,
									0.3
								]
							},
							"instanceIndex": 1
						}
					],
					"child1": null,
					"child2": null
				},
				"child2": {
					"wholeAABB": {
						"worldMin": [
							0.1,
							0.2
						],
						"worldMax": [
							0.5,
							0.5
						]
					},
					"leafAllAABBData": [
						{
							"aabb": {
								"worldMin": [
									0.1,
									0.2
								],
								"worldMax": [
									0.5,
									0.5
								]
							},
							"instanceIndex": 2
						},
						{
							"aabb": {
								"worldMin": [
									0.5,
									0.3
								],
								"worldMax": [
									0.3,
									0.35
								]
							},
							"instanceIndex": 0
						}
					],
					"child1": null,
					"child2": null
				}
			})
		});
	});

	test('build bvh with 3 aabbs by middle', ({ given, when, then }) => {
		let allAABBData
		let tree

		given(/^create (\d+) aabbs$/, (arg0) => {
			allAABBData = [
				createAABBData(0.5, 0.3, 0.3, 0.35, 0),
				createAABBData(0.1, 0.2, 0.5, 0.5, 2),
				createAABBData(-0.5, 0.2, 0.1, 0.3, 1),
				// createAABBData(0.2, -0.2, 0.4, 0.3, 3),
				// createAABBData(0.6, -0.1, 0.4, 0.4, 4),
			]
		});

		when(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = build(allAABBData, arg0)
		});

		then('should return correct tree', () => {
			// console.log(JSON.stringify(tree))
			expect(tree).toEqual(
				{
					"wholeAABB": {
						"worldMin": [
							-0.5,
							0.2
						],
						"worldMax": [
							0.5,
							0.5
						]
					},
					"leafAllAABBData": null,
					"child1": {
						"wholeAABB": {
							"worldMin": [
								-0.5,
								0.2
							],
							"worldMax": [
								0.1,
								0.3
							]
						},
						"leafAllAABBData": [
							{
								"aabb": {
									"worldMin": [
										-0.5,
										0.2
									],
									"worldMax": [
										0.1,
										0.3
									]
								},
								"instanceIndex": 1
							}
						],
						"child1": null,
						"child2": null
					},
					"child2": {
						"wholeAABB": {
							"worldMin": [
								0.1,
								0.2
							],
							"worldMax": [
								0.5,
								0.5
							]
						},
						"leafAllAABBData": null,
						"child1": {
							"wholeAABB": {
								"worldMin": [
									0.5,
									0.3
								],
								"worldMax": [
									0.3,
									0.35
								]
							},
							"leafAllAABBData": [
								{
									"aabb": {
										"worldMin": [
											0.5,
											0.3
										],
										"worldMax": [
											0.3,
											0.35
										]
									},
									"instanceIndex": 0
								}
							],
							"child1": null,
							"child2": null
						},
						"child2": {
							"wholeAABB": {
								"worldMin": [
									0.1,
									0.2
								],
								"worldMax": [
									0.5,
									0.5
								]
							},
							"leafAllAABBData": [
								{
									"aabb": {
										"worldMin": [
											0.1,
											0.2
										],
										"worldMax": [
											0.5,
											0.5
										]
									},
									"instanceIndex": 2
								}
							],
							"child1": null,
							"child2": null
						}
					}
				}
			)
		});
	});

	test('build bvh with only one leaf node by lbvh', ({ given, when, then }) => {
		let allAABBData
		let tree

		given(/^create (\d+) aabbs$/, (arg0) => {
			allAABBData = [
				createAABBData(0.1, 0.2, 0.5, 0.5, 0),
				createAABBData(0.5, 0.3, 0.8, 0.9, 1),
			]
		});

		when(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = buildByLBVH(allAABBData, arg0)
		});

		then('should return tree which only has one leaf node', () => {
			expect(tree).toEqual({
				wholeAABB: createAABB(
					0.1, 0.2,
					0.8, 0.9
				),
				leafAllAABBData: allAABBData,
				child1: null,
				child2: null
			})
		});
	});

	test('build bvh with 2 depth by lbvh', ({ given, when, then }) => {
		let allAABBData
		let tree

		given(/^create (\d+) aabbs$/, (arg0) => {
			allAABBData = [
				createAABBData(0.3, 0.3, 0.31, 0.31, 0),
				createAABBData(0.1, 0.2, 0.5, 0.5, 2),
				createAABBData(-0.5, 0.2, 0.1, 0.3, 1),
			]
		});

		when(/^build bvh with minCount=(\d+), maxDepth=(\d+)$/, (arg0, arg1) => {
			tree = buildByLBVH(allAABBData, arg0, arg1)
		});

		then('should return correct tree', () => {
			expect(tree).toEqual(
				{
					"wholeAABB": {
						"worldMin": [
							-0.5,
							0.2
						],
						"worldMax": [
							0.5,
							0.5
						]
					},
					"leafAllAABBData": null,
					"child1": {
						"wholeAABB": {
							"worldMin": [
								-0.5,
								0.2
							],
							"worldMax": [
								0.1,
								0.3
							]
						},
						"leafAllAABBData": [
							{
								"aabb": {
									"worldMin": [
										-0.5,
										0.2
									],
									"worldMax": [
										0.1,
										0.3
									]
								},
								"instanceIndex": 1
							}
						],
						"child1": null,
						"child2": null
					},
					"child2": {
						"wholeAABB": {
							"worldMin": [
								0.1,
								0.2
							],
							"worldMax": [
								0.5,
								0.5
							]
						},
						"leafAllAABBData": null,
						"child1": {
							"wholeAABB": {
								"worldMin": [
									0.3,
									0.3
								],
								"worldMax": [
									0.31,
									0.31
								]
							},
							"leafAllAABBData": [
								{
									"aabb": {
										"worldMin": [
											0.3,
											0.3
										],
										"worldMax": [
											0.31,
											0.31
										]
									},
									"instanceIndex": 0
								}
							],
							"child1": null,
							"child2": null
						},
						"child2": {
							"wholeAABB": {
								"worldMin": [
									0.1,
									0.2
								],
								"worldMax": [
									0.5,
									0.5
								]
							},
							"leafAllAABBData": [
								{
									"aabb": {
										"worldMin": [
											0.1,
											0.2
										],
										"worldMax": [
											0.5,
											0.5
										]
									},
									"instanceIndex": 2
								}
							],
							"child1": null,
							"child2": null
						}
					}
				}
			)
		});
	});


	test('build bvh with 2 same aabbs by lbvh', ({ given, when, then }) => {
		let allAABBData
		let tree

		given(/^create (\d+) aabbs$/, (arg0) => {
			allAABBData = [
				createAABBData(0.3, 0.3, 0.31, 0.31, 0),
				createAABBData(0.3, 0.3, 0.31, 0.31, 0),

				createAABBData(-0.5, 0.2, 0.1, 0.3, 1),
			]
		});

		when(/^build bvh with minCount=(\d+), maxDepth=(\d+)$/, (arg0, arg1) => {
			tree = buildByLBVH(allAABBData, arg0, arg1)
		});

		then('should return correct tree', () => {
			// console.log(JSON.stringify(tree))
			expect(tree).toEqual(
				{
					"wholeAABB": {
						"worldMin": [
							-0.5,
							0.2
						],
						"worldMax": [
							0.31,
							0.31
						]
					},
					"leafAllAABBData": null,
					"child1": {
						"wholeAABB": {
							"worldMin": [
								-0.5,
								0.2
							],
							"worldMax": [
								0.1,
								0.3
							]
						},
						"leafAllAABBData": [
							{
								"aabb": {
									"worldMin": [
										-0.5,
										0.2
									],
									"worldMax": [
										0.1,
										0.3
									]
								},
								"instanceIndex": 1
							}
						],
						"child1": null,
						"child2": null
					},
					"child2": {
						"wholeAABB": {
							"worldMin": [
								0.3,
								0.3
							],
							"worldMax": [
								0.31,
								0.31
							]
						},
						"leafAllAABBData": [
							{
								"aabb": {
									"worldMin": [
										0.3,
										0.3
									],
									"worldMax": [
										0.31,
										0.31
									]
								},
								"instanceIndex": 0
							},
							{
								"aabb": {
									"worldMin": [
										0.3,
										0.3
									],
									"worldMax": [
										0.31,
										0.31
									]
								},
								"instanceIndex": 0
							}
						],
						"child1": null,
						"child2": null
					}
				}
			)
		});
	});


	// test('aaa', ({ given, when, then }) => {
	// 	let allAABBData
	// 	let tree

	// 	given(/^create (\d+) aabbs$/, (arg0) => {
	// 		allAABBData = [
	// 			createAABBData(0.1, 0.1, 0.11, 0.11, 0),
	// 			createAABBData(0.96, 0.99, 0.961, 0.991, 1),
	// 			createAABBData(0.96, 0.99, 0.962, 0.992, 2),
	// 			createAABBData(0.95, 0.99, 0.962, 0.992, 3),
	// 		]

	// 		allAABBData[0] = [allAABBData[0], [0, 1]]
	// 		allAABBData[1] = [allAABBData[1], [973, 1003]]
	// 		allAABBData[2] = [allAABBData[2], [972, 1003]]
	// 		allAABBData[3] = [allAABBData[3], [972, 1004]]
	// 		// console.log(dec2bin(973), dec2bin(1003));

	// 	});

	// 	when(/^build bvh with minCount=(\d+), maxDepth=(\d+)$/, (arg0, arg1) => {
	// 		tree = buildByLBVH2(allAABBData, 2, 10)
	// 	});

	// 	then('should return correct tree', () => {
	// 		console.log(JSON.stringify(tree))
	// 		// expect(tree).toEqual(
	// 		// 	{
	// 		// 	}
	// 		// )
	// 	});
	// });


	test('find bit', ({ given, when, then }) => {
		let bit

		when(/^find (.*) bit at (.*)$/, (binary, index) => {
			bit = _findBit(Number(binary), Number(index))
		});

		then(/^should return (.*)$/, (b) => {
			expect(bit).toEqual(Number(b))
		});
	});


	test('morton encode', ({ given, when, then }) => {
		let code

		when(/^morton encode (.*), (.*)$/, (gridPositionX, gridPositionY) => {
			code = _mortonEncodeGridPositionByMagicbits([Number(gridPositionX), Number(gridPositionY)])
		});

		then(/^should return (.*)$/, (c) => {
			expect(code).toEqual(Number(c))
		});
	});

	test('build acceleartion', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let result

		given(/^create (\d+) aabbs$/, (arg0) => {
			allAABBData = [
				createAABBData(0.5, 0.3, 0.8, 0.9, 0),
				createAABBData(0.6, 0.2, 0.5, 0.5, 1),
				createAABBData(-0.5, 0.2, 0.1, 0.3, 2),
				createAABBData(0.2, -0.2, 0.4, 0.3, 3),
				// createAABBData(0.6, -0.1, 0.4, 0.4, 4),
			]
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = build(allAABBData, arg0)

			// console.log(JSON.stringify(tree));
		});

		when('build acceleartion with bvh', () => {
			result = Acceleration.build(tree)
		});

		then('should return correct topLevel and bottomLevel', () => {
			let [topLevelArr, bottomLevelArr] = result

			// console.log(topLevelArr)
			// console.log(bottomLevelArr)
			expect(topLevelArr).toEqual(
				[
					[
						-0.5, -0.2, 0.8,
						0.9, 0, 0,
						1, 4
					],
					[
						-0.5, -0.2, 0.4,
						0.3, 0, 0,
						2, 3
					],
					[
						0.2, -0.2, 0.4, 0.3,
						0, 1, 0, 0
					],
					[
						-0.5, 0.2, 0.1, 0.3,
						1, 1, 0, 0
					],
					[
						0.5, 0.2, 0.8, 0.9,
						0, 0, 5, 6
					],
					[
						0.6, 0.2, 0.5, 0.5,
						2, 1, 0, 0
					],
					[
						0.5, 0.3, 0.8, 0.9,
						3, 1, 0, 0
					]
				]
			)
			expect(bottomLevelArr).toEqual(
				[
					[0.2, -0.2, 0.4, 0.3, 3],
					[-0.5, 0.2, 0.1, 0.3, 2],
					[0.6, 0.2, 0.5, 0.5, 1],
					[0.5, 0.3, 0.8, 0.9, 0]
				]
			)
		});
	});


	test('build acceleartion with minCount=2', ({ given, and, when, then }) => {
		let allAABBData
		let tree
		let result

		given(/^create (\d+) aabbs$/, (arg0) => {
			allAABBData = [
				createAABBData(0.5, 0.3, 0.8, 0.9, 0),
				createAABBData(0.6, 0.2, 0.5, 0.5, 1),
				createAABBData(-0.5, 0.2, 0.1, 0.3, 2),
				createAABBData(0.2, -0.2, 0.4, 0.3, 3),
				// createAABBData(0.6, -0.1, 0.4, 0.4, 4),
			]
		});

		and(/^build bvh with minCount=(\d+)$/, (arg0) => {
			tree = build(allAABBData, arg0)

			// console.log(JSON.stringify(tree));
		});

		when('build acceleartion with bvh', () => {
			result = Acceleration.build(tree)
		});

		then('should return correct bottomLevel', () => {
			let [topLevelArr, bottomLevelArr] = result

			// console.log(topLevelArr)
			// console.log(bottomLevelArr)
			expect(bottomLevelArr).toEqual(
				[
					[-0.5, 0.2, 0.1, 0.3, 2],
					[0.2, -0.2, 0.4, 0.3, 3],
					[0.6, 0.2, 0.5, 0.5, 1],
					[0.5, 0.3, 0.8, 0.9, 0]
				]
			)
		});
	});
});
