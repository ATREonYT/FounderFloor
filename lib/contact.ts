/**
 * The public contact address, in one place.
 *
 * It appears in the terms, the privacy policy, the legal notice, the
 * cancellation and report forms, and the email-capture fallback — so it
 * lives here rather than being retyped in ten files. Override per
 * environment with NEXT_PUBLIC_CONTACT_EMAIL; the default is the address
 * on the site's own domain, which also keeps outbound mail and replies on
 * the same domain (a sender and a reply-to that disagree is a spam signal).
 */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "ak@founderfloor.net";

/** Ready-made mailto href, so callers don't rebuild the string. */
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
