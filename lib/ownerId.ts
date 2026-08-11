/**
 * Who owns a startup, from its id.
 *
 * The server re-keys every startup it stores so the id carries its owner:
 * `claim:<profileId>` for a stand on a floor, `reg:<profileId>` for one
 * registered from the profile editor. That convention is load-bearing in
 * several places, and it was open-coded in each of them — so it lived or
 * died on everyone remembering the same two prefixes.
 *
 * Listings now also carry `ownerId` outright. This stays as the fallback
 * for a browser talking to a server that hasn't been updated yet.
 */
export function ownerIdOf(startupId: string): string {
  return startupId.replace(/^(claim|reg):/, "");
}

/** The permalink to a founder's stand. */
export function standHref(ownerId: string): string {
  return `/stand/${encodeURIComponent(ownerId)}`;
}
