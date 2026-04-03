import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Game, { GameType } from "./pages/Game";
import Mainhome from "./pages/MainHome";
import DailyChallenge from "./pages/DailyChallenge";
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
        element: <Game gameType={GameType.QUICKGAME} tutorialMode />,
      },
      {
        path: "quickgame",
        element: <Game gameType={GameType.QUICKGAME} />,
      },
      {
        path: "singaporetour",
        element: <Game gameType={GameType.SINGAPORETOUR} />,
      },
      {
        path: "speedrun",
        element: <Game gameType={GameType.SPEEDRUN} />,
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
