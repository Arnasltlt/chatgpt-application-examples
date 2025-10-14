import { useState, useEffect } from "react";

export function useWidgetProps() {
  const [props, setProps] = useState(null);

  useEffect(() => {
    // Listen for props from parent window (ChatGPT)
    const handleMessage = (event) => {
      if (event.data && event.data.type === "widgetProps") {
        console.log("Received widget props:", event.data.props);
        setProps(event.data.props);
      }
    };

    window.addEventListener("message", handleMessage);
    
    // Request props from parent
    if (window.parent !== window) {
      window.parent.postMessage({ type: "requestWidgetProps" }, "*");
    }

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return props;
}

