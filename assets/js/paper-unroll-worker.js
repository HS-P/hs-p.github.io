const PAPER_DURATION = 900;
const X_SEGMENTS = 44;
const Y_SEGMENTS = 220;
const SOFTWARE_RENDERER = /SwiftShader|llvmpipe|softpipe|lavapipe|software rasterizer|Microsoft Basic Render/i;

let canvas;
let gl;
let program;
let vertexShader;
let fragmentShader;
let vertexBuffer;
let indexBuffer;
let vertexArray;
let indexCount = 0;
let progressLocation;
let animationFrame = 0;
let initialized = false;
let disposed = false;
let animationStarted = false;

const vertexSource = `#version 300 es
  precision highp float;
  layout(location=0) in vec2 aUv;
  uniform mat4 uMvp;
  uniform float uProgress;
  uniform float uAspect;
  uniform vec2 uFit;
  uniform vec2 uFitOffset;
  out vec2 vUv;
  out vec3 vNormal;
  out float vCurl;
  out float vDepth;

  const float PI = 3.141592653589793;

  vec3 paperPosition(vec2 uv) {
    float t = uProgress;
    // Start lower and tighten in place with a jerk-free inward curl.
    float prepClock = clamp(t / 0.28, 0.0, 1.0);
    float prep = prepClock * prepClock * prepClock
      * (prepClock * (prepClock * 6.0 - 15.0) + 10.0);

    // Release quickly after the curl. The short brake only softens contact.
    float run = clamp((t - 0.28) / 0.58, 0.0, 1.0);
    float drive = run * run * (2.2 - 1.2 * run);
    float brake = smoothstep(0.88, 1.0, run);
    float travel = mix(drive, 1.0, brake);
    float stick = smoothstep(0.80, 1.0, t);

    float laidProgress = mix(0.150, 0.153, prep)
      + (1.003 - 0.153) * travel;
    float diagonalBias = uAspect > 1.2 ? 0.10 : 0.05;
    float sweepSpan = 1.0 + diagonalBias;
    float laid = sweepSpan * laidProgress;

    // Tightening the radius produces depth without lifting or lateral motion.
    float radiusBase = mix(0.094, 0.079, prep);
    radiusBase = mix(radiusBase, 0.052, smoothstep(0.0, 0.84, travel));
    float radius = mix(radiusBase, 0.0032, stick);
    float flatEnd = max(0.0, laid - radius);
    // One continuous oblique curl coordinate: the left edge lands first and
    // the same rolled ridge then travels toward the lower-right corner.
    float q = uv.y + diagonalBias * uv.x;

    float y;
    float z;
    if (q <= flatEnd) {
      y = -uv.y;
      z = 0.0;
    } else {
      float theta = (q - flatEnd) / radius;
      // Exponential winding keeps the flat-to-curl tangent continuous and
      // draws the tail inward without a hard angular clamp.
      float thetaLimit = mix(PI * 1.65, PI * 1.82, prep);
      float shownTheta = thetaLimit * (1.0 - exp(-theta / thetaLimit));
      float curledQ = flatEnd + radius * sin(shownTheta);
      y = -uv.y - (curledQ - q);
      z = radius * (1.0 - cos(shownTheta));
    }

    // The sheet arrives from slightly above and in front of the desk before
    // settling into the same final plane as the DOM paper.
    float placement = smoothstep(0.04, 0.48, t);
    float placementLift = 1.0 - placement;
    y += 0.026 * placementLift;
    z += 0.020 * placementLift;

    float width = uAspect > 1.2 ? 0.69 : 0.82;
    float x = (uv.x - 0.5) * width;
    return vec3(x, 0.51 + y, z);
  }

  void main() {
    vec3 p = paperPosition(aUv);
    float eps = 0.0015;
    float du = aUv.x < 1.0 - eps ? eps : -eps;
    float dv = aUv.y < 1.0 - eps ? eps : -eps;
    vec3 tangentU = (paperPosition(aUv + vec2(du, 0.0)) - p) / du;
    vec3 tangentV = (paperPosition(aUv + vec2(0.0, dv)) - p) / dv;
    vNormal = normalize(cross(tangentV, tangentU));
    if (vNormal.z < 0.0) vNormal = -vNormal;
    vUv = aUv;
    vCurl = smoothstep(0.002, 0.055, p.z);
    vDepth = p.z;
    vec4 clipPosition = uMvp * vec4(p, 1.0);
    clipPosition.xy = clipPosition.xy * uFit + uFitOffset * clipPosition.w;
    gl_Position = clipPosition;
  }
`;

const fragmentSource = `#version 300 es
  precision highp float;
  in vec2 vUv;
  in vec3 vNormal;
  in float vCurl;
  in float vDepth;
  out vec4 outColor;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 n = normalize(vNormal);
    vec3 lightDir = normalize(vec3(-0.28, 0.42, 0.86));
    float diffuse = max(dot(n, lightDir), 0.0);
    float backFill = 0.5 + 0.5 * abs(n.z);
    float edge = pow(1.0 - abs(n.z), 2.0);
    float grain = hash21(floor(vUv * vec2(760.0, 1060.0))) - 0.5;
    float fiber = sin((vUv.y * 1380.0 + vUv.x * 41.0) * 6.2831) * 0.5;
    float light = 0.80 + 0.19 * diffuse + 0.025 * backFill - 0.035 * edge;
    vec3 paper = vec3(1.0, 0.999, 0.995);
    paper *= light + grain * 0.018 + fiber * 0.004;
    paper += vec3(0.010, 0.011, 0.009) * (1.0 - smoothstep(0.0, 0.06, vDepth));
    outColor = vec4(clamp(paper, 0.0, 1.0), 1.0);
  }
`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function perspective(out, fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  out.set([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0
  ]);
}

function buildMesh() {
  const vertices = new Float32Array((X_SEGMENTS + 1) * (Y_SEGMENTS + 1) * 2);
  let vertexIndex = 0;
  for (let y = 0; y <= Y_SEGMENTS; y += 1) {
    for (let x = 0; x <= X_SEGMENTS; x += 1) {
      vertices[vertexIndex++] = x / X_SEGMENTS;
      vertices[vertexIndex++] = y / Y_SEGMENTS;
    }
  }

  const indices = new Uint32Array(X_SEGMENTS * Y_SEGMENTS * 6);
  let index = 0;
  for (let y = 0; y < Y_SEGMENTS; y += 1) {
    for (let x = 0; x < X_SEGMENTS; x += 1) {
      const a = y * (X_SEGMENTS + 1) + x;
      const b = a + 1;
      const c = a + X_SEGMENTS + 1;
      const d = c + 1;
      indices[index++] = a;
      indices[index++] = c;
      indices[index++] = b;
      indices[index++] = b;
      indices[index++] = c;
      indices[index++] = d;
    }
  }

  vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  indexCount = indices.length;
}

function rendererName() {
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (!debugInfo) return "";
  return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
}

function initialize(data) {
  canvas = data.canvas;
  gl = canvas.getContext("webgl2", {
    antialias: true,
    alpha: true,
    depth: true,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: true,
    preserveDrawingBuffer: false
  });
  if (!gl) throw new Error("WebGL2 unavailable");

  const renderer = rendererName();
  if (!renderer || SOFTWARE_RENDERER.test(renderer)) throw new Error("Hardware renderer unavailable");
  if (typeof requestAnimationFrame !== "function") throw new Error("Worker animation frames unavailable");

  vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Program linking failed");
  }

  buildMesh();
  progressLocation = gl.getUniformLocation(program, "uProgress");
  const aspectLocation = gl.getUniformLocation(program, "uAspect");
  const mvpLocation = gl.getUniformLocation(program, "uMvp");
  const fitLocation = gl.getUniformLocation(program, "uFit");
  const fitOffsetLocation = gl.getUniformLocation(program, "uFitOffset");

  canvas.width = data.backingWidth;
  canvas.height = data.backingHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.useProgram(program);
  gl.bindVertexArray(vertexArray);

  const viewportAspect = data.viewportAspect;
  const mvp = new Float32Array(16);
  perspective(mvp, 0.76, viewportAspect, 0.1, 8);
  mvp[12] = 0;
  mvp[13] = -0.025;
  mvp[14] = 1.61;
  mvp[15] = 1.80;

  const f = 1 / Math.tan(0.76 / 2);
  const worldWidth = viewportAspect > 1.2 ? 0.69 : 0.82;
  const baseHalfX = (f / viewportAspect) * (worldWidth / 2) / 1.8;
  const baseHalfY = f * 0.5 / 1.8;
  const baseCenterY = (f * 0.01 - 0.025) / 1.8;
  const targetHalfX = data.targetWidth / data.canvasWidth;
  const targetHalfY = data.targetHeight / data.canvasHeight;
  const targetCenterX = 2 * ((data.targetOffsetX + data.targetWidth / 2) / data.canvasWidth) - 1;
  const targetCenterY = 1 - 2 * ((data.targetOffsetY + data.targetHeight / 2) / data.canvasHeight);
  const fitX = targetHalfX / baseHalfX;
  const fitY = targetHalfY / baseHalfY;
  const fitOffsetY = targetCenterY - fitY * baseCenterY;

  gl.uniform1f(aspectLocation, viewportAspect);
  gl.uniformMatrix4fv(mvpLocation, false, mvp);
  gl.uniform2f(fitLocation, fitX, fitY);
  gl.uniform2f(fitOffsetLocation, targetCenterX, fitOffsetY);

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    fail("context-lost");
  });

  initialized = true;
  draw(0);
  gl.finish();
  postMessage({
    type: "ready",
    renderer,
    backingWidth: canvas.width,
    backingHeight: canvas.height
  });
}

function draw(progress) {
  if (!initialized || disposed) return;
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniform1f(progressLocation, progress);
  gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
  gl.flush();
}

function animate(now, startedAt) {
  if (disposed) return;
  const progress = Math.min(1, Math.max(0, (now - startedAt) / PAPER_DURATION));
  draw(progress);
  if (progress >= 1) {
    postMessage({ type: "complete" });
    return;
  }
  animationFrame = requestAnimationFrame((next) => animate(next, startedAt));
}

function startAnimation() {
  if (!initialized || disposed || animationStarted) return;
  animationStarted = true;
  draw(0);
  animationFrame = requestAnimationFrame((startedAt) => {
    animationFrame = requestAnimationFrame((now) => animate(now, startedAt));
  });
}

function dispose() {
  if (disposed) return;
  disposed = true;
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (gl) {
    if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
    if (indexBuffer) gl.deleteBuffer(indexBuffer);
    if (vertexArray) gl.deleteVertexArray(vertexArray);
    if (program) gl.deleteProgram(program);
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
  }
}

function fail(reason) {
  if (disposed) return;
  postMessage({ type: "error", reason });
  dispose();
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "init") {
    try {
      initialize(data);
    } catch (error) {
      fail(error instanceof Error ? error.message : "initialization-failed");
    }
    return;
  }
  if (data.type === "play") startAnimation();
  if (data.type === "dispose") dispose();
});
