import { createRoot } from "react-dom/client";
import { App } from "./routes/__root.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(<App />);
