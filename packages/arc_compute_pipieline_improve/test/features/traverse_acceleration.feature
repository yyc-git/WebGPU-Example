Feature: Traverse Acceleration by Ray Packet
    As a Traverse Acceleration by Ray Packet
    I want to traverse acceleration by ray packet
    So that I can get intersect results

    # Rule: build by middle

    Rule: build by lbvh

        Background: prepare
            Given prepare sandbox
            And create instances and their aabbs
            And build bvh with minCount=1
            And build acceleartion with bvh

        Scenario: not intersect case1
            When traverse acceleartion that points is outside aabb
            Then should not intersect

        Scenario: not intersect case2
            When traverse acceleartion that points not intersect with instances
            Then should not intersect

        Scenario: intersect case1
            When traverse acceleartion with one point
            Then should intersect

        Scenario: intersect case2
            When traverse acceleartion
            Then should intersect

        Scenario: intersect case3
            When traverse acceleartion
            Then should intersect

    Rule: find closest hit

        Background: prepare for find closest hit
            Given prepare sandbox
            And create instances and their aabbs that are overlap
            And build bvh with minCount=1
            And build acceleartion with bvh

        Scenario: not find closest hit case1
            When traverse acceleartion
            Then should not intersect

        Scenario: find closest hit case1
            When traverse acceleartion with one point
            Then should intersect with the closet hit

        Scenario: find closest hit case2
            When traverse acceleartion
            Then should intersect with the closet hit