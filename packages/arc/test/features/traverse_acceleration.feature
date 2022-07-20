Feature: Traverse Acceleration
    As a Traverse Acceleration
    I want to traverse acceleration
    So that I can get intersect result

    Rule: build by middle

        Background: prepare
            Given prepare sandbox
            And create instances and their aabbs
            And build bvh with minCount=1
            And build acceleartion with bvh

        Scenario: not intersect case1
            When traverse acceleartion that point is outside aabb
            Then should not intersect

        Scenario: not intersect case2
            When traverse acceleartion that point not intersect with instances
            Then should not intersect

        Scenario: intersect case1
            # Scenario: aaa
            When traverse acceleartion
            Then should intersect

    Rule: build by lbvh

        Background: prepare by lbvh
            Given prepare sandbox
            And create instances and their aabbs
            And build bvh with minCount=1 by lbvh
            And build acceleartion with bvh

        Scenario: intersect case1 by lbvh
            When traverse acceleartion
            Then should intersect
