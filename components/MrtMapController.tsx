import { useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import SVG from "react-inlinesvg";

const MrtMapController = (props: any) => {
  const {
    onCorrectClick,
    onWrongClick,
    currentStation,
    newlyCorrectStation,
    tries,
  } = props;

  useEffect(() => {
    const buttonElements = document.querySelectorAll('[id$="_Button"]');
    console.log(document);
    console.log(document.getElementById("Tanjong_Rhu_Button"));
    buttonElements.forEach((el) => {
      el.classList.add("station");
    });

    console.log("buttonElements", buttonElements);

    const textElements = document.querySelectorAll('[id$="_Text"]');
    textElements.forEach((el) => {
      el.classList.add("station-text");
    });
  });

  return (
    <TransformWrapper
      initialScale={1}
      initialPositionX={0}
      initialPositionY={100}
      limitToBounds={false}
      doubleClick={{ disabled: true }}
    >
      <TransformComponent
        wrapperStyle={{ width: "100%", height: "100%" }}
        contentStyle={{ width: "100%", height: "100%" }}
      >
        <SVG
          src="/images/full-mrt-map.svg"
          width="100%"
          height="100%"
          title="React"
        />
      </TransformComponent>
    </TransformWrapper>
  );
};

export default MrtMapController;
