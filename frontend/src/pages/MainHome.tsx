import React, { useEffect, useState } from "react";
import Home from "./Home";
import Subhome from "./Subhome";

export default function Mainhome() {
  const [buttonProps, setButtonProps] = useState([]);

  const scrollToNextPage = () => {
    console.log("Scrolling");
    window.scrollTo({
      top: window.innerHeight, // Scroll to the next page (100vh down)
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
    </div>
  );
}