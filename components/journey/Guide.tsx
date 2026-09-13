/**
 * THE ONE FACE IN THE JOURNEY.
 *
 * The desk — the same receptionist who stands in the app — appears beside
 * short lines: the greeting, a milestone. It is a face and a sentence, and
 * it never becomes a chat. It is the app's own sprite, drawn as SVG, so it
 * is the same person on the phone and here.
 */
import { RECEPTIONIST } from "@founderfloor/shared";
import PixelPerson from "@/components/studio/PixelPerson";

export default function Guide({ scale = 2 }: { scale?: number }) {
  return (
    <span className="guide-face" aria-hidden>
      <PixelPerson look={RECEPTIONIST.look} scale={scale} shadow={false} />
    </span>
  );
}
