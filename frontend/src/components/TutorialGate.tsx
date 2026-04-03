import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { hasCompletedTutorial } from "../utils/tutorial";

const ALLOWED_PATHS = new Set(["/tutorial"]);

export default function TutorialGate() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCompletedTutorial()) return;
    if (ALLOWED_PATHS.has(location.pathname)) return;
    navigate("/tutorial", { replace: true });
  }, [location.pathname, navigate]);

  return null;
}
