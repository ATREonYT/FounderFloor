"use client";

/**
 * THE NEW SITE BRINGS ITS OWN HEADER AND FOOTER.
 *
 * The root layout wraps every page in the hall's chrome — a nav about
 * floors and a footer about a trade show that never tears down. The new
 * site is a different story with its own bar, so while it is on screen
 * the old chrome stands down.
 *
 * It uses the convention already in this codebase: the floor page sets
 * body[data-on-floor] for exactly this reason and globals.css hides the
 * header and footer off it. This is the same mechanism with its own
 * attribute, cleaned up on the way out so a click back to the hall gets
 * its nav returned.
 */
import { useEffect } from "react";

export default function OwnChrome() {
  useEffect(() => {
    document.body.dataset.onStudio = "1";
    // Only now may anything hide itself to animate in: until this runs,
    // every section is plainly visible. See the reveal rules in studio.css.
    const root = document.querySelector(".studio");
    root?.setAttribute("data-anim", "1");
    return () => {
      delete document.body.dataset.onStudio;
      root?.removeAttribute("data-anim");
    };
  }, []);
  return null;
}
