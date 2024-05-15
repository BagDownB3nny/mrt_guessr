import Image from "next/image";
import { MrtSvg } from "./MrtSvg";

export default function Home() {
  return (
    <div>
      <h1>Guessr</h1>
      {/* <Image
        src="/mrt_map.svg"
        alt="Mrt Map"
        width={1000}
        height={1000}
        priority
      /> */}
      <MrtSvg />
    </div>
  );
}
