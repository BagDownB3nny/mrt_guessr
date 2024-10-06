import React, { Component } from "react";

import { useControls } from "react-zoom-pan-pinch";

export default function Controls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="tools">
      <button onClick={() => zoomOut()}>-</button>
      <button onClick={() => zoomIn()}>+</button>
      <button onClick={() => resetTransform()}>x</button>
    </div>
  );
}
