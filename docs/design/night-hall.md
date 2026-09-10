# The night hall

The app's second visual world, replacing the expo-badge material. The contract is in `DESIGN.md` at the repo root; the implementation is `packages/ui`. This folder holds the renders that show what it is: the opening, Today, the map, the guide, the Coach tab, You and the week's reading, in both appearances.

How it was made: PRODUCT.md first (the Impeccable `init`), then the redesign path of its `new-work` playbook (replace the world, keep product truth and the pixel characters), with the palette and type measured for contrast at every token, the tab bar and controls checked against the iOS reference, and UI/UX Pro Max's style, typography and UX tables read for the glass material and the onboarding rules (skippable, swipeable, a real back). The lights behind every page are drawn once in the root layout; every `Plate` is a real blur over them (expo-blur), which is why the app needs one native rebuild.

What stays from the first world: the pixel keepers, coaches, glyphs and the stand's own art; the road; every word of the copy. What went: the clipped corner, the mono labels, the awning stripes, the tiled room headers, Archivo and Plex Sans.
