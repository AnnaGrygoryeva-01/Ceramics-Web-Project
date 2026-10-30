import Image from "next/image";
import bottomLeft from "./UI/left-bottom-corner.png";
import bottomRight from "./UI/bottom-right-corner.png";

export default function CornerDecorations() {
  return (
    <div aria-hidden="true">
      <Image className="corner corner--left" src={bottomLeft} alt="" />
      <Image className="corner corner--right" src={bottomRight} alt="" />
    </div>
  );
}
