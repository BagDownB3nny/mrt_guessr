import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Mainhome from "./pages/MainHome";
import DailyChallenge from "./pages/DailyChallenge";
import Quickplay from "./pages/Quickplay";
import Tutorial from "./pages/Tutorial";
import Speedrun from "./pages/Speedrun";
import SingaporeTour from "./pages/SingaporeTour";
import TutorialGate from "./components/TutorialGate";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <TutorialGate />
        <Outlet />
      </>
    ),
    children: [
      {
        index: true,
        element: <Mainhome />,
      },
      {
        path: "tutorial",
        element: <Tutorial />,
      },
      {
        path: "quickgame",
        element: <Quickplay />,
      },
      {
        path: "singaporetour",
        element: <SingaporeTour />,
      },
      {
        path: "speedrun",
        element: <Speedrun />,
      },
      {
        path: "daily",
        element: <DailyChallenge />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
