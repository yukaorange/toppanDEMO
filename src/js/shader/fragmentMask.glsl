uniform float time;
uniform float uXAspect;
uniform float uYAspect;
uniform sampler2D uTexture;
uniform sampler2D uMaskTexture;

varying vec2 vUv;

void main() {
  vec2 vUv = vUv;
  vUv = vUv - vec2(0.5);
  vUv.x *= min(uXAspect, 1.);
  vUv.y *= min(uYAspect, 1.);
  vUv += 0.5;

  vec4 mask = texture2D(uMaskTexture, vUv);
  vec4 texture = texture2D(uTexture, vUv);

  vec3 color = texture.rgb;
  float alpha = mask.a;

  gl_FragColor = vec4(color,alpha);
}