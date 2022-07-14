var vertexShader = `
struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) uv: vec3<f32>,  
}

@vertex
fn main(
	@builtin(vertex_index) VertexIndex : u32
) -> VertexOutput {
  var output : VertexOutput;
  output.uv = vec2<f32>(( VertexIndex << 1 ) & 2, VertexIndex & 2);
  output.Position = vec4<f32>(output.uv * 2.0 - 1.0, 0.0, 1.0);

  return output;
}
`;

var fragmentShader = `
 struct Pixels {
  pixels : vec4<f32>
};

 struct ScreenDimension {
  resolution : vec2<f32>
};


@binding(0) @group(0) var<storage, read_write> pixelBuffer :  Pixels;
@binding(1) @group(0) var<uniform> screenDimension : ScreenDimension;

@fragment
fn main(
  @location(0) uv : vec2<f32>
) -> @location(0) vec4<f32> {
  // var vec2<u32> resolution = vec2<u32>(screenDimension.resolution)
  var resolution = vec2<f32>(screenDimension.resolution)

  var bufferCoord = vec2<u32>(floor(uv * resolution));
  var pixelIndex = bufferCoord.y * u32(resolution.x) + bufferCoord.x;

//   vec3<f32> pixelColor = pixelBuffer.pixels[pixelIndex].rgb / pushC.totalSampleCount;
  var pixelColor = pixelBuffer.pixels[pixelIndex].rgb;

  return vec4<f32>(pixelColor, 1.0);
}
`;

export { vertexShader, fragmentShader }