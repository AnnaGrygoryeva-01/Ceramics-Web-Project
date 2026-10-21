import Image from "next/image";
// The file names are swapped relative to the artwork: right-corner.png is the bottom-left piece
import bottomLeft from "./UI/right-corner.png";
import bottomRight from "./UI/left-corner.png";

export default function CornerDecorations() {
  return (
    <div aria-hidden="true">
      <Image className="corner corner--left" src={bottomLeft} alt="" />
      <Image className="corner corner--right" src={bottomRight} alt="" />
    </div>
  );
}
