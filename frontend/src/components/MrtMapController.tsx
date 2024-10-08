import { useCallback, useEffect, useRef } from "react";
import {
  TransformWrapper,
  TransformComponent,
  MiniMap,
} from "react-zoom-pan-pinch";
import SVG from "react-inlinesvg";
import styles from "../css/MrtMap.module.css";
import Controls from "./Controls";

const getStationName = (id: String) => {
  return id.substring(0, id.length - 7).replace(/_/g, " ");
};

const MrtMapController = (props: any) => {
  let {
    onCorrectClick,
    onWrongClick,
    currentStation,
    newlyCorrectStation,
    tries,
  } = props;

  const currentStationRef = useRef(currentStation);
  const currentTries = useRef(tries);

  useEffect(() => {
    currentStationRef.current = currentStation;
  }, [currentStation]);

  useEffect(() => {
    currentTries.current = tries;
  }, [tries]);

  const handleClick = (e: any) => {
    const station = getStationName(e);
    if (station === currentStationRef.current) {
      console.log(currentTries.current);
      onCorrectClick(station, currentTries.current);
    } else {
      onWrongClick();
    }
  };

  useEffect(() => {
    if (tries <= 0) {
      const correctStationButtonId = `${currentStation.replaceAll(
        " ",
        "_"
      )}_Button`;
      const correctButtonElement = document.getElementById(
        correctStationButtonId
      );
      if (correctButtonElement) {
        if (document.getElementById("showButtonCircle")) {
          return;
        }
        const rect = correctButtonElement.getBoundingClientRect();
        const circleElement = document.createElement("div");
        circleElement.id = "showButtonCircle";
        circleElement.className = styles.circle;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        circleElement.style.left = `${centerX - 100}px`; // Subtract half the width (10px) to center
        circleElement.style.top = `${centerY - 100}px`; // Subtract half the height (10px) to center

        circleElement.addEventListener("animationend", () => {
          circleElement.remove();
        });
        document.body.appendChild(circleElement);
      }
    }
  }, [tries]);

  useEffect(() => {
    const id = `${newlyCorrectStation.replaceAll(" ", "_")}`;
    const correctTextElement = document.getElementById(`${id}_Text`);
    if (correctTextElement) {
      correctTextElement.style.display = "block";
    }
  }, [newlyCorrectStation]);

  const addStyleToStationsAndText = () => {
    const buttonElements = document.querySelectorAll('[id$="_Button"]');
    buttonElements.forEach((el) => {
      el.classList.add(styles.station);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        handleClick(el.id);
      });
    });

    const textElements = document.querySelectorAll('[id$="_Text"]');
    textElements.forEach((el) => {
      el.classList.add(styles.stationText);
    });
  };

  return (
    <div className={styles.mapContainer}>
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={100}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ width: "100%", height: "100%" }}
        >
          <SVG
            src="/full-mrt-map.svg"
            width="100%"
            height="100%"
            title="React"
            onLoad={addStyleToStationsAndText}
          />
        </TransformComponent>
        <div
          style={{
            position: "absolute",
            zIndex: 0,
            top: "0px",
            right: "0px",
          }}
        >
          <MiniMap width={400}>
            <SVG
              src="/full-mrt-map.svg"
              width="100%"
              height="100%"
              title="React"
            />
          </MiniMap>
          <Controls />
        </div>
      </TransformWrapper>
    </div>
  );
};

export default MrtMapController;
