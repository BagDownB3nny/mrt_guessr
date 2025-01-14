import React, { useEffect, useState } from "react";
import Home from "./Home";
import Subhome from "./Subhome";
import { Analytics } from "@vercel/analytics/react";

export default function Mainhome() {
  const [buttonProps, setButtonProps] = useState([]);

  const scrollToNextPage = () => {
    console.log("Scrolling");
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <Home
        scrollToNextPage={scrollToNextPage}
        setButtonProps={setButtonProps}
      />
      <Subhome buttonProps={buttonProps} />
      <Analytics />
    </div>
  );
}
