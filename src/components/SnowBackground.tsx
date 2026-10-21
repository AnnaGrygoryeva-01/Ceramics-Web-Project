import Image from "next/image";
import snow from "./UI/christmas-sales-background-snow.png";

export default function SnowBackground() {
  return <Image className="snow" src={snow} alt="" aria-hidden="true" sizes="100vw" priority />;
}
