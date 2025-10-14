import React from "react";
import { createRoot } from "react-dom/client";
import { widgetMetadata } from "./widget";
import "./index.css";

function App() {
  console.log("Your AI Council widget mounted!");
  
  return (
    <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 text-black shadow-sm">
      <h2 className="text-xl font-semibold">{widgetMetadata.title}</h2>
      <p className="mt-2 text-base">Hello from Your AI Council!</p>
      <p className="mt-4 text-sm text-black/70">Your council is ready to assist.</p>
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <p className="text-sm text-green-800">✅ Widget loaded successfully!</p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("your-ai-council-root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}

export { widgetMetadata };

