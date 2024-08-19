import LrtSvg from "./LrtSvg";
import MrtSvg from "./MrtSvg";
import MrtBackgroundSvg from "./MrtBackgroundSvg";

const FullMrtSvg = (props: any) => {
  const { onCorrectClick, currentStation, newlyCorrectStation } = props;

  return (
    <div>
      <MrtBackgroundSvg />
      <MrtSvg
        onCorrectClick={onCorrectClick}
        currentStation={currentStation}
        newlyCorrectStation={newlyCorrectStation}
      />
      {/* <LrtSvg /> */}
    </div>
  );
};

export default FullMrtSvg;
