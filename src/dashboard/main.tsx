import { createRoot } from "react-dom/client";
import { App } from "../shared/App";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(<App page="dashboard" />);
}
