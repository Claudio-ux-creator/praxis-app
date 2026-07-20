import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// RENDERN
var root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    React.createElement(React.StrictMode, null, React.createElement(App))
  );
}

// EXPORTIEREN fuer UMD globalName
export default App;
