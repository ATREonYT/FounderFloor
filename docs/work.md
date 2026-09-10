# Every line is a room

The building tells the founder to do things in three places: the lists in the six rooms on the map, the steps of a task on the plan, and the three things the week's reading says to do. Every one of those lines now opens a room (`/did?id=…`, or `/step` for a task's step) with, in this order:

1. The line, with its tick and what "done" means.
2. **How to do it**, in words a child follows, written for someone who has never built a company or an app. Where the building does the work, the door is on the page: the Workshop draws the app and writes the brief, a builder tool (Lovable, Base44, Bolt, v0) makes the working version from the brief, the coaches write the messages and do the sums.
3. The desk's question, and a place to write what happened.

What is written is kept against the line (`work` in the founder store, keyed by the line's id), goes into the notebook, and from then on is read by the desk on every task and step (`taskContext … lists`), by the desk and the coaches at the counter (with the notebook's leave), and by the Workshop's brief (`workLines`), so the app it draws and the brief it writes are shaped by what the founder actually did. Ticking stays separate from writing: tick what is true.

The rule every prompt carries (`PLAIN` in `packages/shared/src/prompts/index.ts`): assume the founder has never built anything and does not know the words; explain each term the first time; never ask them to write code, a spec, a wireframe, a schema or a deck; say the one smallest next thing and where in the building to do it. The plan writer, the task writer and the step desk all carry it, and the offline versions of each were rewritten to match: building tasks now go through the Workshop and a builder, never through code.

The thirty lines on the map's lists live in `packages/shared/src/build-path.ts` with their `how`, `ask` and `door`. `packages/shared/src/work.ts` turns any id into a room's item (a listed line, or a free line such as one from the week's reading, given its text), writes the opener and the practice-mode replies, and renders the block prompts carry.
