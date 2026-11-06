import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startUpdateChecks } from "./lib/appUpdate";

startUpdateChecks();

createRoot(document.getElementById("root")!).render(<App />);
