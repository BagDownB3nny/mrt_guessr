import styles from "./MrtMap.css";
import LrtSvg from "./LrtSvg";
import MrtSvg from "./MrtSvg";
import MrtBackgroundSvg from "./MrtBackgroundSvg";

const {
  e,
  f,
  g,
  h,
  i,
  j,
  k,
  l,
  m,
  n,
  o,
  p,
  q,
  r,
  s,
  t,
  u,
  v,
  w,
  x,
  y,
  aa,
  ab,
  ac,
  ad,
  ae,
  af,
  ag,
  ah,
  ai,
  aj,
} = styles;

const FullMrtSvg = (props: any) => {
  const { onCorrectClick, currentStation } = props;

  return (
    <div>
      <MrtBackgroundSvg />
      <MrtSvg onCorrectClick={onCorrectClick} currentStation={currentStation} />
      {/* <LrtSvg /> */}
    </div>
  );
};

export default FullMrtSvg;
