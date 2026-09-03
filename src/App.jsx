import React, { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import PwaApp from "./PwaApp";

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Ha az URL-ben szerepel az /app (pl. fitanyamodszer.hu/app), akkor az app nyílik meg
  if (currentPath.startsWith("/app")) {
    return <PwaApp />;
  }

  // Minden más esetben (a főoldalon: /) marad az éles Landing Page
  return <LandingPage />;
}
