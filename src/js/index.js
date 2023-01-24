import * as THREE from "three";
import { Sketch } from "./webgl";
import { test } from "./test";

async function textureLoader(url) {
  const texLoader = new THREE.TextureLoader();
  const texture = await texLoader.loadAsync(url);
  return texture;
}

init();
async function init() {
  const imageArray = [...document.querySelectorAll(".gallery_image")];

  let gallery = [];
  for (let i = 0; i < imageArray.length; i++) {
    gallery[i] = await textureLoader(imageArray[i].src);
  }

  const mask = await textureLoader('../images/wb.png');

  const sketch = new Sketch({
    dom: document.querySelector("#container"),
    gallery: gallery,
    mask : mask,
  });
}
