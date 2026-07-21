/**
 * The ticket — FounderFloor's currency mark, drawn as a proper pixel-art
 * raffle ticket: gold body, punched side notches, a perforated stub line,
 * and a star on the face. Server-safe (plain SVG, no hooks).
 */
export default function TicketIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="pixelated inline-block shrink-0 align-[-2px]"
    >
      {/* body */}
      <rect x="1" y="4" width="14" height="8" fill="#B08D2E" />
      {/* top highlight + bottom shade */}
      <rect x="1" y="4" width="14" height="1" fill="#C9A94B" />
      <rect x="1" y="11" width="14" height="1" fill="#8A6E24" />
      {/* deep-gold frame ends */}
      <rect x="1" y="4" width="1" height="8" fill="#7A611F" />
      <rect x="14" y="4" width="1" height="8" fill="#7A611F" />
      {/* punched notches (paper shows through) */}
      <rect x="0" y="7" width="2" height="2" fill="#F2EFE7" />
      <rect x="14" y="7" width="2" height="2" fill="#F2EFE7" />
      {/* perforated stub line */}
      <rect x="11" y="5" width="1" height="1" fill="#7A611F" />
      <rect x="11" y="7" width="1" height="1" fill="#7A611F" />
      <rect x="11" y="9" width="1" height="1" fill="#7A611F" />
      {/* star on the face */}
      <rect x="5" y="6" width="1" height="1" fill="#FFFDF5" />
      <rect x="4" y="7" width="3" height="1" fill="#FFFDF5" />
      <rect x="5" y="8" width="1" height="1" fill="#FFFDF5" />
      <rect x="4" y="9" width="1" height="1" fill="#F2EFE7" opacity="0.6" />
      <rect x="6" y="9" width="1" height="1" fill="#F2EFE7" opacity="0.6" />
      {/* stub tick */}
      <rect x="13" y="6" width="1" height="4" fill="#C9A94B" />
    </svg>
  );
}
