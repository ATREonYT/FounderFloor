/**
 * THE PROOF, EDGE TO EDGE.
 *
 * Under the box where you type, a rail of products that were drawn from
 * one sentence each — flat, cropped, running off both sides of the
 * screen. It answers the only question a stranger has at that moment,
 * which is "what do I actually get", and it answers it with the thing
 * itself rather than with a sentence about the thing.
 *
 * They are real documents in real frames, drawn on the server when the
 * page was requested. Deliberately NOT in phone bezels: a bezel says
 * "here is a picture of an app", and a flat crop says "here is the app".
 * The corner ticks are printers' registration marks — the hall's world
 * is a built one, and this is a sheet off the press.
 */
export interface Shot {
  idea: string;
  name: string;
  html: string;
}

export default function Showcase({ shots }: { shots: Shot[] }) {
  if (!shots.length) return null;
  return (
    <section className="showcase" aria-label="Products drawn from one sentence">
      <div className="showcase-rail">
        {shots.map((s) => (
          <figure className="shot" key={s.name}>
            <div className="shot-glass">
              <iframe
                title={`${s.name}, drawn from one sentence`}
                srcDoc={s.html}
                sandbox="allow-scripts"
                loading="lazy"
                tabIndex={-1}
              />
            </div>
            <figcaption>{s.idea}</figcaption>
          </figure>
        ))}
      </div>
      <p className="showcase-note">
        Each of those was drawn from the sentence under it, by this page, when you opened it.
      </p>
    </section>
  );
}
