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

const FullMrtSvg = () => {
  return (
    <div>
      <MrtBackgroundSvg />
      <MrtSvg />
      {/* <LrtSvg /> */}
    </div>
  );
};

export default FullMrtSvg;
