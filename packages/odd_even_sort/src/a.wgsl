override workgroupSize = 64;
override elementCount = 128;

var<workgroup> arrOfTwoElements: array<f32,elementCount>;
var<workgroup> isSwap: bool;
var<workgroup> stepCount: u32;

struct BeforeSortData {
  data : array<f32, elementCount>
}

struct AfterSortData {
  data : array<f32, elementCount>
}


@binding(0) @group(0) var<storage, read> beforeSortData : BeforeSortData;
@binding(1) @group(0) var<storage, read_write> afterSortData :  AfterSortData;

@compute @workgroup_size(workgroupSize, 1, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

u32 index = GlobalInvocationID.x * 2;

arrOfTwoElements[index] = beforeSortData.data[index];
arrOfTwoElements[index+ 1 ] = beforeSortData.data[index + 1];

// set to any value only if > 0
// isSwap = 1;
isSwap = false;

stepCount = 0;

workgroupBarrier();


// while(isSwap != 0){
while(true){
// isSwap = 0;

// workgroupBarrier();

// u32 index = GlobalInvocationID.x * 2;

// f32 a = beforeSortData.data[index];
// f32 b = beforeSortData.data[index + 1];

u32 firstIndex;
u32 secondIndex;

TODO global_invocation_id, local?

if(stepCount % 2 == 0){
firstIndex = 
}

var a = arrOfTwoElements[index];
var b = arrOfTwoElements[index + 1];

if(a > b){
arrOfTwoElements[index] = b;
arrOfTwoElements[index + 1] = a;

// isSwap += 1;
// isSwap += 1;
isSwap = true;

workgroupBarrier();
}
// else{
// arrOfTwoElements[index] = a;
// arrOfTwoElements[index + 1] = b;
// }

if(!isSwap){
    break;
}

}

// if(isSwap == 0){
// u32 index = GlobalInvocationID.x * 2;

// afterSortData.data[index] = arrOfTwoElements[index];
// afterSortData.data[index + 1] = arrOfTwoElements[index + 1];

// return;
// }

u32 index = GlobalInvocationID.x * 2;

afterSortData.data[index] = arrOfTwoElements[index];
afterSortData.data[index + 1] = arrOfTwoElements[index + 1];

// return;



odd


workgroupBarrier();


sync

even

sync


}