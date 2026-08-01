# Design versions

The landing page has been redesigned once. Both versions are kept so the
change can be reversed in one command if the new one doesn't land.

| version | where it lives | see it at |
| --- | --- | --- |
| **v1** — the original | `docs/design/v1/`, and a running copy at `app/design-v1/page.tsx` | `/design-v1` |
| **v2** — the exhibition programme (current) | `app/page.tsx` | `/` |

`/design-v1` is `noindex` and stays out of `sitemap.ts` and `robots.ts`, so
it exists for you and not for Google.

## Going back to v1

The archived copy is the same file that used to be `app/page.tsx`, so the
rollback is a copy and two deletions:

```bash
cp docs/design/v1/page.tsx app/page.tsx    # restore the old landing page
rm -rf app/design-v1                       # the preview route is now redundant
git commit -am "Roll the landing page back to design v1"
```

The v2 CSS in `app/globals.css` is **additive** — everything under the
`EXHIBITION LAYER` banner is new class names that v1 never used, so v1
renders correctly whether or not you strip it out. Leaving it costs about
2 kB of CSS. To remove it anyway, restore the archived stylesheet:

```bash
cp docs/design/v1/globals.css app/globals.css
```

`docs/design/v1/layout.tsx` is the header and footer as they stood before
the same pass, in case only the chrome needs reverting.

## Or go back with git

The commit before the redesign is tagged:

```bash
git show design-v1              # what the site looked like
git checkout design-v1 -- app/  # restore the whole app directory
```

## Why v2 looks the way it does

v1 was a well-executed version of the layout every AI-assisted site
converges on: a centred hero with two buttons, a row of three equal
icon-cards, a four-card feature grid, a three-card pricing table, a plus-sign
FAQ accordion, and a dark centred call to action — every section the same
width, the same padding, and the same rhythm. Nothing in it is wrong. It is
just recognisable, and being recognisable is the problem when the pitch is
that this was built with care.

v2 keeps every colour, every font and every component, and changes the
*layout grammar*. It is built as a printed trade-show programme:

- **A margin rail.** Section numbers and titles sit in a narrow left column
  against a vertical hairline; the content runs in a wide right column.
  Editorial, asymmetric — the opposite of a centred stack.
- **No card grids where a list will do.** "How it works" is a walking route
  through the hall with the steps hung off a dotted path. The site map is a
  printed index with hairline rules and dotted leaders. Neither is a box.
- **Admission stubs instead of pricing cards** — perforated tickets, with
  the notches cut out of the card properly (a mask, not a drawn circle).
- **Print furniture.** Crop marks on the framed art, dotted leader lines,
  tabular figures, a hairline stat rail instead of four white boxes.
- **Varied rhythm.** Sections are no longer all `py-16`; the page tightens
  and opens deliberately.

The rule for anything added later: if a section could be described as "three
cards in a row", it needs a second look.
