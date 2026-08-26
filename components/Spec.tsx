/**
 * The programme's specification type: a small mono label in caps, used for
 * plate captions, column heads, section kickers and stub markings.
 *
 * Server-safe, so both the landing page and the client components that were
 * split out of it can use the same label rather than each keeping a copy.
 */
export default function Spec({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={`micro font-mono text-xs ${className}`}>{children}</span>;
}
