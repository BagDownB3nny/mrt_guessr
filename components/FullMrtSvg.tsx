import LrtSvg from "./LrtSvg";
import MrtSvg from "./MrtSvg";
import MrtBackgroundSvg from "./MrtBackgroundSvg";

const FullMrtSvg = (props: any) => {
  const { onCorrectClick, onWrongClick, currentStation, newlyCorrectStation, tries } = props;

  return (
    <div>
      <MrtBackgroundSvg />
      <MrtSvg
        onCorrectClick={onCorrectClick}
        onWrongClick={onWrongClick}
        currentStation={currentStation}
        newlyCorrectStation={newlyCorrectStation}
        tries={tries}
      />
      {/* <LrtSvg /> */}
    </div>
  );
};

export default FullMrtSvg;
