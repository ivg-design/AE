// Polyfill for Object.freeze if not available in CEP environment
if (typeof Object.freeze !== 'function') {
  Object.freeze = function(obj) {
    return obj;
  };
}

import React from "react";
import ReactDOM from "react-dom/client";
import { initBolt } from "../lib/utils/bolt";


import Main from "./main";

initBolt();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
