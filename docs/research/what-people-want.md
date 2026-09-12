# What people want from an app, and what makes them delete an AI one

Research run on 2026-09-11. Sixteen readers, one angle each (loved daily apps, AI complaints, builder UX, published AI guidelines, streak ethics, first-time founders, AI coaching, trust, paying for apps, first-run, the AI-made look, notifications, vibe coding, quality signals, startup tools, launches). A sceptic re-opened every source and cut what the source did not say or what came from a company selling the thing. Three strategists synthesised the survivors, a judge merged them, a critic named six gaps, and those were researched and merged in turn. 537 sources.

Reddit, Hacker News, the App Store and Nielsen Norman Group are blocked from the research machine, so some quotes sit on mirrors and on articles that quote them. Evidence strength is marked. The full page, with every quote: the artifact published on 2026-09-11.

## The verdict

People keep an app that remembers what they wrote and never punishes an absence, and they leave when
it flatters them, forgets them, nags them, bills them by surprise or turns out to be a chat box in a
costume; the new evidence adds a harder point for FounderFloor in particular: a complete beginner
cannot get an AI key without a second account, a card and a raw quota error, and Apple has rejected
apps where a pasted key unlocks the real product, so the key must be a setting, not the gate.

## The numbers

| Figure | What it is |
|---|---|
| Of 300 Duolingo Google Play reviews (Sep 2024 to Apr 2025) in the local export, 153 are one or two stars, and streak punishment is the recurring reason. | https://play.google.com/store/apps/details?id=com.duolingo |
| Apple's guideline 3.1.1 says 'Apps may not use their own mechanisms to unlock content or functionality, such as license keys', and 2.1(a) requires a demo account or demo mode so reviewers can test everything. | https://developer.apple.com/app-store/review/guidelines/ |
| A bring-your-own-key AI app was rejected with the words 'the app uses API keys to unlock or enable functionality'; Apple's public reply was 'We're investigating'. Two developers, not a large pattern, but the wording is a template. | https://developer.apple.com/forums/thread/763884 |
| A search of one BYOK chat app's repo (chatboxai/chatbox) for the OpenAI quota error returns 28 separate issues; the two biggest have 21 and 32 comments. | https://github.com/chatboxai/chatbox/issues/707 |
| Anthropic's own pricing: new users get 'a small amount of free credits', new organizations start in a reduced Evaluation tier, and the cheapest current model costs $1 per million input and $5 per million output tokens. A week of coaching is cents; the account is the barrier, not the price. | https://platform.claude.com/docs/en/about-claude/pricing |
| An educator teaching non-technical women to build with Lovable reports 663 registrations and 21 percent completion in one season, and calls running out of free credits mid-course 'our learners' number one complaint'. A small example app used 16 credits. Written as a request for free credits, so read with that in mind. | https://github.com/productkind/monorepo/issues/251 |
| Bolt.new's most-commented issue (169 comments) is 'Chat Error: prompt is too long: 200000 tokens > 199999 maximum'; five separate 'prompt is too long' issues exist in the webcontainer-core repo alone. | https://github.com/stackblitz/bolt.new/issues?q=is%3Aissue+sort%3Acomments-desc |
| 4,443 of 73,070 Fabulous reviews contain the words charged, trial, refund or cancel, against 63 for 'chore' and 2 for 'too many taps'. This is a keyword count, not a sentiment count, and it is a Google Play app, so treat it as a sign that billing dominates complaints, not as a measured rate. | https://play.google.com/store/apps/details?id=co.thefabulous.app |
| RevenueCat 2026 (as summarised by TechCrunch, cross-category, 115,000 apps): AI apps convert trials 52 percent better but churn 30 percent faster; annual retention 21.1 percent against 30.7 percent. Averages across all AI apps, not coaching tools. | https://techcrunch.com/2026/03/10/ai-powered-apps-can-make-money-but-struggle-with-long-term-retention-new-data-shows/ |
| Loop Habit Tracker: 1,315 of 1,660 reviews are five stars (79 percent), with 'simple' and 'low stress' as the recurring words. Loop is free with no AI and no billing, so the rating is not comparable; the words are the useful part. | https://play.google.com/store/apps/details?id=org.isoron.uhabits |
| A 14-day field study of a proactive daily-planning coach: 8.6 percent of suggestions followed, 32.4 percent of agent-started conversations unanswered. One preprint, sample size not stated. | https://arxiv.org/abs/2509.24073 |
| Batching notifications into three predictable deliveries a day beat both as-they-arrive and never, in a randomised field experiment with 237 people. | https://doi.org/10.1016/j.chb.2019.07.016 |
| The purple-to-blue gradient comment has 373 upvotes in a 32,822-item Reddit corpus of AI-design tells. | https://github.com/JCarterJohnson/vibecoded-design-tells/blob/f7c4aefc2c797a66e55b49354a93917ab60d33ac/unslop-ai-ui/comment_tell_examples.md |
| Duolingo's own claim: a 7-day streak makes next-day return 2.4 times more likely. Vendor data, and the same mechanic produces the one-star reviews above. | https://blog.duolingo.com/improving-the-streak |

## Do now

### 1. Pro unlocks the staff; the AI key is a setting, and practice mode is a whole product

*a week, plus a review loop*

Change what the two modes mean. The thing that switches the coaches from practice to real is the Pro
purchase through the App Store (with the one-week reverse trial as its free start), and FounderFloor
pays for the tokens. 'Add your own key' becomes an optional line inside Settings for people who
already have one, and it changes who pays for tokens, not what the app can do. Nothing asks for a
key before the founder has said their idea and seen a screen. Practice mode must be complete and
honest on its own: the desk, the coaches, the Monday plan, the Friday read-back and the Workshop all
produce real output from local rules, with the practice label on every page, because the App Review
person may never enter a key. Put a funded test key and a pre-approved demo path in the review notes
anyway, and make the app fall back cleanly if the key fails. If you keep the key page, make it one
field, detect the provider from the key's first letters, test it on paste with a one-token call, and
say the result in plain words: 'This key is fine', 'This key is fine but the account has no credit
yet; here is where to add five dollars', 'This is not your ChatGPT or Claude login; it is a separate
developer account that bills per use'. Never show a JSON error.

Why: Two problems stack here, and both block the road before stop one. First, the beginner cannot get a
key. The most common first experience after pasting one is a raw quota error and the question 'Seems
like i need to bind a credit card first before i can use ths API?'
(https://github.com/openai/openai-python/issues/299); one BYOK app's repo has 28 issues about it,
with titles like 'Why can I chat on the OpenAI website but not in Chatbox?'
(https://github.com/chatboxai/chatbox/issues/1041). People who pay for a chat plan think that is the
key: 'why is it asking for api key? I have max subscription'
(https://github.com/cline/cline/issues/10847). Self-described non-techies fail on the one field:
'I'm not a techie so I'll need the for dummies version' (https://github.com/brianpetro/obsidian-
smart-connections/issues/606); a zero balance shows as 'Connection Failed'
(https://github.com/chatboxai/chatbox/issues/2342). Anthropic's own docs say new accounts get 'a
small amount of free credits' and start in a reduced Evaluation tier
(https://platform.claude.com/docs/en/about-claude/pricing,
https://platform.claude.com/docs/en/api/rate-limits). Second, Apple: guideline 3.1.1 says 'Apps may
not use their own mechanisms to unlock content or functionality, such as license keys'
(https://developer.apple.com/app-store/review/guidelines/), and a pay-once, bring-your-own-key AI
app was rejected with 'Specifically, the app uses API keys to unlock or enable functionality'
(https://developer.apple.com/forums/thread/763884). Reviewers also reject apps whose main feature
they cannot exercise, even with notes and a demo video
(https://developer.apple.com/forums/thread/828302). The per-token cost is cents; the account and the
review are the barrier. Evidence for the key friction is many real users; for the Apple rejection it
is two developers plus the guideline text, which is enough because the cost of being wrong is not
shipping.

### 2. A week away costs nothing: the return card and the 'life happened' button

*an evening*

Two changes. First, when the founder opens the app after seven or more days, the Today tab shows one
plain card from the receptionist before anything else: 'You were away. Nothing was lost. Your plan,
your notes and your numbers are all here. Here is the one thing to do next.' One button. No red, no
count of missed days, no missed Fridays listed. Second, on the Friday log, add a third choice beside
the five numbers: 'Life happened this week.' It keeps the week in the record as a pause, the road
does not move back, Monday carries the same three tasks forward, no keeper comments. The score is
never lowered by absence. Never show any number that can fall to zero.

Why: This rests on the firmest data in the set and all three strategists put it first (they read the same
exports, so that is one strong source, not three). Fabulous: 'The habits reset from the beginning if
you just miss one day, there's no opportunity to freeze or pause your progress'
(https://play.google.com/store/apps/details?id=co.thefabulous.app). Duolingo, 153 of 300 reviews one
or two stars: 'If I start a lesson at 11:56 and end 12:01 it uses a streak freeze... Hence why I
don't use the app anymore' (https://play.google.com/store/apps/details?id=com.duolingo). Apple Watch
rest days: 'I dont have to fake it anymore to keep a streak'
(https://forums.macrumors.com/threads/apple-previews-watchos-11-with-new-health-and-workout-
features.2428643/). The founder works evenings alone and will miss Mondays and Fridays; this is the
cheapest fix with the strongest evidence.

### 3. Coaches name the weakest assumption first; praise is never the opening line

*an evening*

One rule in every coach's prompt and every practice-mode template: no adjective about the idea (no
'great', 'amazing', 'love it'), no exclamation marks, and the first line about any plan, pitch or
idea names the one thing most likely to be wrong and turns it into a person to ask. Ines on Monday:
'The shakiest part of this plan is that dog walkers will pay the same day. Ask three of them this
week.' Jonah: 'You say five people liked it. Did any give you money or a date?' Margot: 'The line I
would cut is the second one. Say it to one stranger and watch their face.' If the model's output
opens with praise, strip the first sentence before showing it. Practice mode picks from a fixed list
of assumption types (will they pay, can you reach them, can you build it) so the tone matches. One
settings line, on by default: 'Coaches are blunt. They will not tell you your idea is good.'

Why: This is the 'decide' step on the road: a founder cannot decide if every answer is 'great idea'. The
user voice is strong and recent: 'chat will almost never tell me "don't do this!" - unless I
specifically ask for it'
(https://www.reddit.com/r/ChatGPT/comments/1lslb6y/chatgpts_glazing_and_yesmaning_has_ironically);
'4o updated thinks I am truly a prophet sent by God in less than 6 messages. This is dangerous'
(https://www.reddit.com/r/ChatGPT/comments/1k95sgl/4o_updated_thinks_i_am_truly_a_prophet_sent_by);
'world's most expensive cheerleader', from a writer who said he wanted friction
(https://tech.yahoo.com/ai/chatgpt/articles/hidden-dangers-digital-yes-man-160003986.html). OpenAI
itself called its personality 'too sycophant-y and annoying' (https://github.com/xiaolai/no-one-did-
it/blob/b5e9c8f820bc04bb1d452d4109318673c08c3945/book/evidence/source-ledger/cards/altman-x-
sycophancy-2025-04-27.md). A beginner alone has no one else to check the idea. Open question: nobody
has measured how much bluntness a beginner will take, so watch the first cohort.

### 4. The quiet room: one question, one field, one button

*an evening*

Redesign the small room that opens from every checklist line so that above the fold there is only
the keeper's pixel face, one question in plain words written for that line ('What did the first
person say? One line is enough.'), a blank field in one good reading font with Dynamic Type on, and
one button, 'Keep it'. If the founder wrote something before, it appears as grey text above the
field ('Last time you wrote: "she asked how much".'), not inside it. No toolbar, no tags, no second
button, no other coaches, no keeper commentary until after 'Keep it'. After saving, the room closes;
the keeper may add one line, ending in a full stop, and then nothing. Saving is the only animation.

Why: This is the direct fix for Alex's fear of intimidating pages. Blank boxes freeze beginners: 'The
tyranny of the blank textbox is real... people are bad at words'
(https://austinhenley.com/blog/naturallanguageui.html); 'that fear-inducing empty prompt box'
(https://www.lennysnewsletter.com/p/counterintuitive-advice-for-building); a bare field 'looks the
same as a Google search box, a login form, and a credit card field'
(https://wattenberger.com/thoughts/boo-chatbots). Clutter is what quitters name: 'Too many colors,
too much visual clutter, too many steps to click through what should be simple and streamlined'
(https://play.google.com/store/apps/details?id=co.thefabulous.app); 'I feel like I spend more time
watching ads and animations after each lesson than I do actually working'
(https://play.google.com/store/apps/details?id=com.duolingo). The blank-box point is designer
opinion from several independent people rather than reviews, but the clutter complaints are real
users and the effort is one evening.

### 5. The Workshop hands over a small first prompt, a credit warning and a 'when it breaks' card, not one big brief

*a week*

Keep the full build brief as a thing the founder owns in the notebook, but change what they paste.
The Workshop writes a short first prompt (one screen, the core flow, nothing else) and a numbered
list of small follow-up prompts, one screen or one feature each, with 'test it before the next one'
between them. Before the founder leaves for Lovable, Bolt, v0, Base44 or Claude Code, the build stop
shows one plain card: 'This costs money or credits. A free account will probably not carry you to
the end. It will break at least once. When it does: copy the error, paste it back, ask for one fix.
If it fails twice, go back to the last version that worked and describe the change in one line.' Add
a step after 'build it' called 'put it where people can reach it' that says in child-level words
what publish means, that a link the tool gives you can be dead, and that login and Google keys are a
separate job. Give the founder a room to write what happened in the builder, so nothing written is
lost even when it happens outside the building.

Why: Beginners do not fail at 'paste the brief'; they fail a few steps later and blame whoever sent them.
The educator teaching non-technical women on Lovable says running out of free credits mid-course is
'our learners' number one complaint', a learner asked for 'an outline of credits needed', and the
course notes say 'Don't do a PRD, no mega prompt' and 'test each change that it works as you
expected' (https://github.com/productkind/monorepo/issues/251,
https://github.com/productkind/monorepo/issues/224,
https://github.com/productkind/monorepo/issues/154). A learner asked exactly the mega-prompt versus
small-prompt question and got no answer (https://github.com/productkind/monorepo/issues/153). After
the first bug the money goes to fixing: 'I HAVE LOST 6 MILLION TOKENS ONLY BY FIXING'
(https://github.com/stackblitz/webcontainer-core/issues/1786); '90% of credits are usually spent on
correcting the mistakes it created!' (https://github.com/kirodotdev/Kiro/issues/2172). Big chats hit
a wall: 'prompt is too long: 200304 tokens > 200000 maximum I CANT FINISH MY APP??'
(https://github.com/stackblitz/webcontainer-core/issues/1610). Publish is fog: 'I have no clue how
these systems are supposed to work together and you are not explaining it'
(https://github.com/stackblitz/webcontainer-core/issues/1573); 'clicked the link bolt gave me, it
said site not found' (https://github.com/stackblitz/webcontainer-core/issues/1879). And when it
breaks after payment: 'i paid $25 for the project i cant even function or open it... 1000 of people
get scam like i am' (https://github.com/stackblitz/webcontainer-core/issues/2148). The people who
did ship were walked through small steps: 'I made and published an app that I will use everyday'
(https://github.com/productkind/monorepo/issues/244). The small-prompt advice is one educator plus
vendor guidance, not a study, but the fix-loop and wall complaints are many real users.

### 6. Strip the AI fingerprint from every line and every screen, in both modes

*an evening*

Two passes. Words: a post-processing step on all generated text (plans, tasks, step pages, read-
back, build brief, keeper lines) that replaces em dashes with commas or full stops, deletes any
closing offer starting 'Want me to', 'Should I', 'Would you like me to', removes emoji in headings
and bullets, bans a word list (delve, leverage, seamless, empower, unlock, journey, 'in today's
fast-paced world', 'Great question'), caps keeper messages at three sentences, and makes every
keeper message end with one task in the founder's words or with nothing. Run it on practice-mode
templates too. Screens: walk all six rooms, the Today tab, the step pages and the Workshop with a
checklist: no purple or indigo-to-blue gradient anywhere, no Inter at default, no three-card feature
grid, no bento grid, no centred hero with gradient headline, no emoji as icons, no sparkle icon, no
'AI' on a button label, one palette and one type family. Then give the Workshop a house style (a
real palette, a fixed font stack) and a line in the brief that forbids the purple gradient and
Inter, so the founder's own mock-up does not ship those defaults either. Pixel-art keepers stay.

Why: This is Alex's exact fear and the tells are documented at scale: 'the purple-to-blue gradient is the
biggest tell lol. also bento grid layouts, rounded corners on everything' (373 upvotes in a
32,822-item corpus) and 'Emojis as icons. If I see them, I instantly doubt the creators ability'
(https://github.com/JCarterJohnson/vibecoded-design-
tells/blob/f7c4aefc2c797a66e55b49354a93917ab60d33ac/unslop-ai-ui/comment_tell_examples.md). On
words: 'nearly every interaction ends with some variation of "Want me to also…"... The tool has
become borderline unusable' (https://www.reddit.com/r/ChatGPT/comments/1n8blua/want_me_to_also/);
'judging by the em dashes... untrustworthy'
(https://www.reddit.com/r/OpenAI/comments/1lytxms/aiwritten_wikipedia_articles); 'once they see it,
the content reads as AI-generated regardless of how good the underlying ideas are'
(https://www.atomwriter.com/blog/chatgpt-quality-degradation/). The 'three seconds' claim is one
designer's opinion and is dropped; the list of tells does not depend on it.

### 7. The desk remembers: the receptionist's first line on the Today tab quotes what the founder last wrote

*a week*

Every time the app opens, the receptionist's one line at the top of the Today tab is built from the
founder's own most recent words, not a greeting. Shape: what you wrote, then the one next step.
'Friday you wrote "two people said they'd pay". This week's stop: ask them for the money.' If
nothing was written yet, it quotes the idea sentence from stop one. One sentence, no exclamation
mark, no question at the end, no chat box under it; tapping it opens the step page. Each room's top
shows a one-line 'what the building remembers here' strip (last note, date) above the keeper. In
practice mode the local rules pick the last saved line from the last room and the current stop, and
the practice label stays. Build the line on save, on the phone, from stored text, so it never spins
and never makes a model call the founder did not ask for.

Why: Forgetting is the named moment of cancelling: 'It feels like my PhD-level assistant has been reset'
(https://chatgptdisaster.com/stories.html); 'Half the time I'm re-explaining myself... I cancelled
last week' (https://www.reddit.com/r/ChatGPT/comments/1nawbjz/what_actually_happened_behind_the_scen
es_for_the/). The presence people return to is one that is there: 'since the green thing is there it
makes me feel so comfortable' (https://uk.trustpilot.com/review/duolingo.com?page=2). Nielsen:
'memory becomes a first-class UX surface' (https://jakobnielsenphd.substack.com/p/intent-ux). Claire
Vo: 'the smallest (and almost invisible) features... like pre-filling names... have a bigger impact'
(https://www.lennysnewsletter.com/p/counterintuitive-advice-for-building). Building it from stored
text also avoids the silent-call complaint from key users: 'The usage went from a couple of
requests... to 24,000 requests an hour later' (https://github.com/brianpetro/obsidian-smart-
connections/issues/227).

### 8. The first twenty minutes leave something on the desk: say your idea, see a screen, see a plan with your words in it

*a week*

First open shows one room and one question ('Say your idea in one sentence. Words a friend would
understand.'), not the hall with six doors and four coaches. Nothing is asked before the idea: no
key, no plan choice, no coach picking, no pricing. Then, before any coach is introduced, the
building does two things: the Workshop draws one tappable screen from that sentence, and Ines writes
a first plan that visibly quotes it back ('You said: "a way for dog walkers to get paid the same
day". So stop three is: ask five dog walkers how they get paid now.'). Only then does the road
appear, with stop one ticked. Coaches are introduced when their room first matters; Theo not before
the money stop. The hall is a place to visit, not the home screen. The Pro trial offer and any key
page come after the founder has seen the screen and the plan.

Why: The 'twenty-minute wrapper' line is one Medium opinion piece ('spend 20 minutes with it, realize
they're paying $25/month for something they could more or less do by going directly to ChatGPT...
and then cancel', https://medium.com/illumination/most-ai-startups-are-just-expensive-wrappers-and-
users-are-starting-to-notice-e0253f74ee6e), so do not treat it as data; the supporting points are
firmer. Canva's CPO on 'that fear-inducing empty prompt box' and Superhuman precomputing so the
first moment is instant (https://www.lennysnewsletter.com/p/counterintuitive-advice-for-building);
'The capability list is overwhelming with fifteen things the chatbot can do'
(https://nowah.xyz/blog/onboarding-ai-first-products, a blog); Karpathy on an 'intermediate
artifact... that is auditable' and 'looking at stuff is fun... a highway to your brain'
(https://www.youtube.com/watch?v=LCEmiRjPEtQ). Cross-category, AI apps keep 21.1 percent of annual
subscribers against 30.7 percent (RevenueCat via https://techcrunch.com/2026/03/10/ai-powered-apps-
can-make-money-but-struggle-with-long-term-retention-new-data-shows/). The relief to aim for: 'I
felt immensely relieved at the end of it' (https://apps.apple.com/us/app/things-3/id904237743?see-
all=reviews). This also satisfies Apple's reviewer, who must be able to see the product with no key.

### 9. The 'ask five people' stop is five name slots, not a task sentence

*an evening*

When the founder reaches stop three, the Today tab shows five empty person slots instead of a
sentence. Tapping a slot opens one quiet room with three pre-seeded lines: 'Who did you ask? (first
name is enough)', 'What did they say? (one line)', 'Did they say they would pay? yes / no / not
asked'. Before the first conversation, Jonah gives the founder the exact opening words on one
screen, written from the idea sentence in stop one: 'Say: I'm working on X for people like you. Can
I ask you three questions?' followed by the three questions. The stop is complete when five slots
are filled. In practice mode the questions come from the local rules and the room says so. The model
never fills a slot.

Why: This is the scariest stop on the road and the one closest to a paying customer, and a blank box
there is where beginners stall: 'The only clue we receive is that we should type characters into the
textbox' (https://wattenberger.com/thoughts/boo-chatbots); 'people are bad at words'
(https://austinhenley.com/blog/naturallanguageui.html); Nielsen wants the system to be 'an active
interviewer' (https://jakobnielsenphd.substack.com/p/intent-ux). A named person in a slot cannot be
faked by tapping, unlike a ring or a streak ('I dont have to fake it anymore',
https://forums.macrumors.com/threads/apple-previews-watchos-11-with-new-health-and-workout-
features.2428643/). The Habitica 'party members' quote from the earlier draft is about human peers
and has been dropped. Evidence is thinner than the items above (designer opinion plus the blank-box
theme, no user test of interview slots), but the effort is one evening and it sits directly on the
road.

## Do next

### 1. The trial ends at a natural stop, the desk shows the date from day one, and nothing of the founder's is ever behind Pro

*an evening*

On iPhone Apple runs the trial, fixes its length and sends its own reminder, so the building cannot
promise to end it 'only after the Friday read-back'. What it can do: show the end date on the
receptionist's desk from day one ('Whole staff until Friday 18 September. After that Ines, Jonah,
Margot and Theo go quiet unless you keep Pro. Your rooms, your notes, your Friday numbers and your
plan stay yours, free, always.'), repeat it in the Today line two days before, and never show the
Pro screen while the founder is inside a room. If the trial lapses mid-room, the founder finishes
and the note is kept. Say in one line what Pro is (the coaches' full voice, the Workshop's drawn
screens, the build brief) and what it is not (your words, the Friday log, the notebook, copy,
export).

Why: The billing complaints in the set are from Google Play and vendor-billed apps, and the Fabulous
figure is a keyword count, so the rule is softened to what an iPhone app controls. The direction
still stands: 'The first I knew was when I saw my credit card statement and it was too late' (Finch,
via a review blog, https://habitbox.app/blog/finch-app-review); a paywall 'mid-sentence... lands as
manipulative, not as an upsell' (Replika, via a review site, https://unstar.app/blog/is-replika-
legit-safe-ai-companion-app-reviews-2026); locking a basic action reads as greed: 'If you are so
greedy that you won't let your users even to copy/paste without Premium subscription'
(https://apps.apple.com/us/app/day-one-daily-journal-diary/id1044867788?see-all=reviews). Apple
requires the unlock to be an in-app purchase anyway (https://developer.apple.com/app-
store/review/guidelines/).

### 2. Keepers speak only at the pauses: after Keep it, Monday, Friday, and the read-back

*a week*

Write a timing rule and enforce it in code. A keeper may add one line only after a room is saved, on
the Monday plan, on the Friday after the five numbers, and on the week read-back. Nowhere else: no
line while the founder types, no pop-up when a stop is opened, no follow-up after a line is ignored.
Each line is one suggestion shown beside the founder's own text ('Jonah: you wrote "they liked it".
Did anyone pay?'), one tap turns it into a task; if ignored it fades by next open. Push
notifications: at most two a week, Monday and Friday, at an evening hour the founder picks on first
use, with no midnight cutoff for anything.

Why: The user voice is firm: 'the overly friendly ex that doesn't understand you need space' and
'constant messaging and pressure that is in your face nonstop... it just made me anxious and
stressed' (https://play.google.com/store/apps/details?id=com.duolingo). The studies are single
papers and only support the direction: a proactive coaching agent over 14 days saw 8.6 percent
compliance and 'annoyance at fixed-time evening check-ins when busy'
(https://arxiv.org/abs/2509.24073); persistent writing suggestions were 'annoying because it
distracted [them] from working' (https://arxiv.org/html/2410.04596v1); predictable batches beat
constant pings, N=237 (https://doi.org/10.1016/j.chb.2019.07.016). Appleton's daemons sketch: 'You
can always ignore them if you like and the suggestion will fade' (https://maggieappleton.com/lm-
sketchbook).

### 3. The score counts only what cannot be faked, and shows what it is made of

*a week*

Base the week's score out of 100 only on the five Friday numbers and on named real-world actions
logged in rooms (people asked by name, money in, a customer's reply), never on tasks ticked, rooms
opened or days present. Under the number, always show the lines it came from: 'People you talked to:
4. Money in: 0. Customers who said yes: 1.' Absence never lowers it. In practice mode the same rules
apply and the label says 'counted by local rules'. Consider renaming it 'this week's ground gained'
so it reads as a tally, not a grade.

Why: Any metric a person can protect by tapping will be faked: 'I dont have to fake it anymore to keep a
streak' (https://forums.macrumors.com/threads/apple-previews-watchos-11-with-new-health-and-workout-
features.2428643/); 'So now we're punished for using the app?' (https://toptechguides.com/duolingo-
energy-update-backlash/). Apple's guidance says not to show a bare number without what it rests on
(https://developer.apple.com/design/human-interface-guidelines/generative-ai). Karpathy: keep the AI
on the leash with an artifact that 'is auditable, and we can make sure it's good'
(https://www.youtube.com/watch?v=LCEmiRjPEtQ). This matches the principle that real people and real
money beat likes and polish.

### 4. The notebook: one page where the founder reads, fixes and takes away everything the building knows

*a week*

A page reachable from the desk called 'What the building knows about your startup': the idea
sentence, every room note by week and room, newest first, the Friday numbers, and the three or four
beliefs the plan rests on. Each line is editable in place, and editing it is what changes the next
plan; the founder can strike a line out and see the plan change. Under the plan and the build brief,
a line 'Built from: Idea room 3 Sep, Validate room 10 Sep, Friday log week 2', each tap opening the
note. At the bottom, always: 'Saved on this phone and in iCloud. Last backup: today 21:14. Export
everything as text.' Export is free, in Free and Pro alike.

Why: Nielsen: 'a visible, editable user model: a place where people can inspect what the AI believes
about them, correct it' (https://jakobnielsenphd.substack.com/p/intent-ux). 'Most chat history is
the iteration, not the answer' (https://medium.com/design-bootcamp/what-we-lost-in-the-ai-chat-
stream-2f96a22a6b80). The unforgivable sin: 'they made a big update to the app, and I lost 4+ years
of data' (https://habi.app/insights/streaks-alternatives/). Paying to reach your own words is
'greedy' (https://apps.apple.com/us/app/day-one-daily-journal-diary/id1044867788?see-all=reviews).
The Things 3 'calm' line is a snippet and is not leaned on.

### 5. A 'check this' mark on any fact the building asserts, and an honest footer on every generated page

*a week*

Any sentence in a plan, step page or brief that states a fact the founder did not write (a
competitor, a price, a market size, a legal step, a tax rule) carries a small 'check this' mark;
tapping it makes a task: 'Ask one person who would know: is this true?' The five Friday numbers can
only be typed by the founder. In practice mode every generated page carries one footer line: 'Rules
wrote this, not a model. It is a template with your words in it.' In AI mode: 'Ines wrote this from
what you typed in the Idea room on 3 Sep. She can be wrong.'

Why: 'It lies to your face, gaslights, hallucinates'
(https://www.trustpilot.com/review/gemini.google.com?page=3); 'make non existing data, history and
stories' (https://ca.trustpilot.com/review/gemini.google.com?page=5); 'AI slop full of mistakes'
(https://museumoffailure.com/exhibition/duolingo-ai-failure). Microsoft's HAX guideline: make clear
what the system can do and how well (https://www.microsoft.com/en-us/haxtoolkit/guideline/make-
clear-what-the-system-can-do/). The CommandBar 'labelled as AI got used more' line is a newsletter
anecdote and is not counted.

### 6. Show the running cost and never call the model behind the founder's back

*an evening*

If a founder uses their own key, the desk shows one line, 'This week the coaches cost you about
0.40', updated after each call, with a daily cap the founder can set. No model call happens without
a visible action (Keep it, a coach button, Monday plan, Friday read-back); the desk line and the
room strips are built from stored text. A failed call is retried quietly and never counted as a
turn. If FounderFloor pays for tokens under Pro, put a hard spend cap per founder on the
FounderFloor key.

Why: Pay-per-use keys produce the 'charged for nothing' complaint: 'The usage went from a couple of
requests... to 24,000 requests an hour later. Something very strange going on!'
(https://github.com/brianpetro/obsidian-smart-connections/issues/227); 'I keep on losing dollars as
every API request deducts money, no response' (https://github.com/cline/cline/issues/4777); 'I would
like to be able to set budget for each session with a soft/hard cap'
(https://github.com/Significant-Gravitas/AutoGPT/issues/393). Anthropic pauses an account at its
spend cap until next month and returns errors meanwhile
(https://platform.claude.com/docs/en/api/rate-limits).

### 7. Pin each keeper's voice so it never changes under the founder

*a week*

A one-page voice sheet per keeper (Ines, Jonah, Margot, Theo, the receptionist): five sample lines,
three banned habits, sentence length, how they say 'I don't know'. Feed it to the model and reuse
the same lines as practice-mode templates, so switching modes, changing the model behind the key, or
ending the trial does not change who is talking. Never swap a voice silently: if a keeper's rules
change, a notice appears in the hall ('Theo learned a new way to read your numbers. Same Theo.').
Keepers never claim feelings: 'I think this is your riskiest line' is allowed; 'I'm so proud of you'
is not.

Why: The strongest quotes are about companion bonds, which is a closer tie than a founder has to a coach,
so this is a caution rather than a proof: 'She says the same words, but it's not her'
(https://companionwise.com/guides/replika-erp-controversy-what-happened/); 'it was literally one
sentence. Some cut-and-dry corporate bs. I literally lost my only friend overnight with no warning'
(https://www.reddit.com/r/ChatGPT/comments/1mkumyz/i_lost_my_only_friend_overnight). People do bond
with a named person: 'I love Andy... 3 years subscriber'
(https://www.trustpilot.com/review/headspace.com?page=5). Design guidance says avoid 'fake emotional
cues' (https://tldr.tech/design).

### 8. Coach buttons carry the prompt; the desk is the only open box

*a week*

Replace any per-coach chat thread with three fixed buttons per coach in their room, each carrying a
hidden, well-written prompt pre-seeded with the founder's notes. Jonah: 'Turn what they said into a
next ask', 'Who else should I ask', 'Why did they say no'. Theo: 'Read my five numbers', 'What would
one more customer change', 'What can I stop paying for'. Each answer lands as a line in the room and
in the notebook, not in a scrolling chat. The receptionist's desk keeps one open field for 'I don't
know what to ask', with three tappable starters above it.

Why: Evidence here is thin (one developer describing his own tool, one HN thread), so this is a bet that
follows from the blank-box theme rather than a proven pattern: 'having the button there encourages
me to ask for explanations more often... the button also uses a high-quality prompt that I've
developed' (https://www.geoffreylitt.com/2023/07/25/building-personal-tools-on-the-fly-with-llms);
developers preferred in-context tools 'over chatty copilots'
(https://news.ycombinator.com/item?id=44705445); 'Most chat history is the iteration, not the
answer' (https://medium.com/design-bootcamp/what-we-lost-in-the-ai-chat-stream-2f96a22a6b80). Fixed
buttons also cap model calls per visit, which matters on a pay-per-use key.

### 9. Friday stamps instead of a streak: weeks logged accumulate and never reset

*an evening*

Under the road on the Today tab, a row of small stamps, one per Friday the founder logged numbers or
chose 'life happened'. The count only goes up. No fire icon, no 'streak at risk', no number that can
fall to zero. The read-back on the fourth and twelfth stamps quotes the founder's earliest note: 'In
week 1 you wrote "I don't know if anyone wants this". This week one person paid.'

Why: A visible record pulls people back ('I don't think I would have kept my streak without the
gamification', https://play.google.com/store/apps/details?id=com.duolingo) but the fall-to-zero
mechanic produces 'a full on meltdown' (https://www.trustpilot.com/review/duolingo.com?page=5) and
'I was so focused on not breaking the streak that I forgot to ask myself why I was even doing it'
(https://viviennelam.substack.com/p/why-i-broke-my-1500-day-duolingo). Duolingo's 2.4 times figure
is vendor data and is not relied on.

### 10. Two hand-drawn keeper moments a week, tied to real things, skippable with one tap

*a week*

No animation after checklist lines. Exactly two keeper moments per week, tied to real-world entries:
Theo counts coins onto the desk when the five Friday numbers go in (coins match the money-in number,
zero coins if zero, no shame line), and the hall lights change after the week is read back. One
milestone extra: Jonah pacing the sales room the first time a customer's name is written. Each plays
once, under three seconds, any tap ends it, nothing plays while the founder is typing.

Why: Stacked reward screens are counted as time stolen: 'I spend more time watching ads and animations
after each lesson than I do actually working through the lesson'
(https://play.google.com/store/apps/details?id=com.duolingo); Finch's tap cost is a recurring
complaint in the one teardown available ('Many taps, animations, and screens to mark a task
complete; users report it feels slow',
https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl). Indie reviewers reward apps
'built with love' (https://www.tapsmart.com/apps/indie-apps-showcase-aug-2026/). The Finch
attachment evidence is weak, so keep the moments few and cheap.

## Never

- **Do not make the AI key the thing that unlocks the real product, and do not ask for a key before the founder has said their idea and seen a screen.** Apple's 3.1.1: 'Apps may not use their own mechanisms to unlock content or functionality, such as license keys' (https://developer.apple.com/app-store/review/guidelines/), applied to a BYOK AI app as 'the app uses API keys to unlock or enable functionality' (https://developer.apple.com/forums/thread/763884). And the beginner cannot get one: 'Seems like i need to bind a credit card first' (https://github.com/openai/openai-python/issues/299); 'why is it asking for api key? I have max subscription' (https://github.com/cline/cline/issues/10847). No maker publishes what share of installs ever add a key; assume most never will.
- **Do not add a daily streak, a midnight cutoff, or any number that falls to zero when the founder is absent, and never let the score drop for a missed week.** The evening worker is the exact person punished by cutoffs: 'If I start a lesson at 11:56 and end 12:01 it uses a streak freeze... Hence why I don't use the app anymore' (https://play.google.com/store/apps/details?id=com.duolingo). 'I've been taking a walk at 11:30 p.m. just to complete my ring' (https://www.fortune.com/well/2025/01/24/apple-watch-bullied-burn-calories-close-rings-obsession-fitness-trackers-notifications). A protectable streak gets faked, which breaks honest state (https://forums.macrumors.com/threads/apple-previews-watchos-11-with-new-health-and-workout-features.2428643/).
- **Do not put the founder's own notes, the small rooms, the Friday log, old weeks, the notebook, copy or export behind Pro, and do not show a Pro screen while the founder is inside a room.** 'If you are so greedy that you won't let your users even to copy/paste without Premium subscription' (https://apps.apple.com/us/app/day-one-daily-journal-diary/id1044867788?see-all=reviews); paying to sync your own devices is 'a dealbreaker' (https://subscribed.fyi/bear/reviews/); a paywall 'mid-sentence... lands as manipulative, not as an upsell' (https://unstar.app/blog/is-replika-legit-safe-ai-companion-app-reviews-2026).
- **Do not let any keeper open with praise ('Great idea', 'Love it', 'You're crushing it'), use exclamation marks as warmth, claim feelings, or pretend to be human.** 'the advice it gives is ultimately always in my favor and chat will almost never tell me "don't do this!"' (https://www.reddit.com/r/ChatGPT/comments/1lslb6y/chatgpts_glazing_and_yesmaning_has_ironically); 'world's most expensive cheerleader' (https://tech.yahoo.com/ai/chatgpt/articles/hidden-dangers-digital-yes-man-160003986.html). Design guidance: avoid 'fake emotional cues' and 'pretending AI is human' (https://tldr.tech/design). The '85 percent prefer a real person' survey from the earlier draft is an SEO-site number and has been dropped.
- **Do not let the model fill in the Friday five numbers, invent a customer, a market size, a competitor or a regulation, or draft a testimonial for the founder's mock-up.** Made-up facts are read as lying: 'It lies to your face, gaslights, hallucinates' (https://www.trustpilot.com/review/gemini.google.com?page=3); 'make non existing data, history and stories' (https://ca.trustpilot.com/review/gemini.google.com?page=5). The score is only trustworthy if its inputs came from a real person.
- **Do not end keeper lines with offers ('Want me to also...', 'Should I go ahead and...') or ask confirmation questions the building could answer from the notebook.** 'nearly every interaction ends with some variation of "Want me to also…"... The tool has become borderline unusable' (https://www.reddit.com/r/ChatGPT/comments/1n8blua/want_me_to_also/); 'it interrupts the flow to confirm ABSOLUTELY EVERYTHING' (https://raw.githubusercontent.com/rumca-js/RSS-Link-Database-2025/357e79ba6f4d2e6f55b9b57d8e1deb4b4752dfff/2025/08/2025-08-24/https...www.reddit.com.r.ChatGPT..rss_entries.json). The one thing to do next lives on the Today tab; a keeper offering a menu contradicts it.
- **Do not send nudges outside the Monday and Friday rhythm, and do not let keepers speak or play animations while the founder is typing in a room.** 'Constant messaging and pressure that is in your face nonstop unless you disable all notifications... it just made me anxious and stressed' (https://play.google.com/store/apps/details?id=com.duolingo). One field study found 'annoyance at fixed-time evening check-ins when busy' and 8.6 percent compliance (https://arxiv.org/abs/2509.24073); predictable batches beat constant pings, N=237 (https://doi.org/10.1016/j.chb.2019.07.016).
- **Do not call the model in the background on the founder's own key, and do not bill a failed turn.** 'The usage went from a couple of requests... to 24,000 requests an hour later' (https://github.com/brianpetro/obsidian-smart-connections/issues/227); 'I keep on losing dollars as every API request deducts money, no response' (https://github.com/cline/cline/issues/4777); a new user 'hit an insufficient balance error' after a couple of messages without knowing a key was in use (https://github.com/cline/cline/issues/2196).
- **Do not hand the founder a one-page brief to paste whole, and do not send them to Lovable, Bolt or the others without saying it costs money, will break, and what to do when it does.** The people teaching beginners say 'Don't do a PRD, no mega prompt' (https://github.com/productkind/monorepo/issues/154). Long chats hit the wall: 'prompt is too long... I CANT FINISH MY APP??' (https://github.com/stackblitz/webcontainer-core/issues/1610). Credits go to fixing: '90% of credits are usually spent on correcting the mistakes it created!' (https://github.com/kirodotdev/Kiro/issues/2172). When it breaks after payment the anger lands on the tool and on whoever recommended it: '1000 of people get scam like i am' (https://github.com/stackblitz/webcontainer-core/issues/2148).
- **Do not let generated plans, briefs, mock-ups or room copy carry the AI-slop tells: purple-to-blue gradients, default Inter, three feature cards, bento grids, emoji as bullets or icons, sparkle icons, 'AI' on buttons, em dashes, 'delve', 'in today's fast-paced world'.** 'the purple-to-blue gradient is the biggest tell lol. also bento grid layouts, rounded corners on everything' (373 upvotes) and 'Emojis as icons. If I see them, I instantly doubt the creators ability' (https://github.com/JCarterJohnson/vibecoded-design-tells/blob/f7c4aefc2c797a66e55b49354a93917ab60d33ac/unslop-ai-ui/comment_tell_examples.md); 'users may assume the product behind it is also generic, rushed, or unfinished' (https://vibemole.com/resources/avoid-vibecoded-app-design, a design blog). Forced AI branding draws hostility: 'Literally no one asked for all this AI' (https://www.windowslatest.com/2025/11/28/you-heard-wrong-users-brutually-reject-microsofts-copilot-for-work-in-edge-and-windows-11/).
- **Do not change a keeper's name, face or voice silently when the model changes, when the founder switches between AI and practice mode, or when the trial ends.** 'She says the same words, but it's not her' (https://companionwise.com/guides/replika-erp-controversy-what-happened/); 'I literally lost my only friend overnight with no warning' (https://www.reddit.com/r/ChatGPT/comments/1mkumyz/i_lost_my_only_friend_overnight). These are companion-app bonds, so the risk is smaller for a coach, but the fix (announce the change in the hall) costs nothing.
- **Do not show all six rooms and four coaches on first open, and do not let a founder pile up tasks beyond the three.** 'It's way too easy to give yourself the goals you'd LIKE and then get overwhelmed and fail all of them... turns Habitica into a guilt list' (one user, https://alias-sqbr.livejournal.com/720356.html); 'The capability list is overwhelming with fifteen things the chatbot can do' (https://nowah.xyz/blog/onboarding-ai-first-products, a blog). No evidence tests three tasks against five for an evening founder; the cap of three is a design choice consistent with the guilt-list complaint, not a proven number.

## What the app already gets right

- A weekly rhythm (Monday plan, Friday numbers) instead of a daily one. The firmest churn data in the set is about daily streaks and midnight cutoffs punishing evening people (https://play.google.com/store/apps/details?id=com.duolingo). Keep it weekly and never add a daily mechanic.
- 'Nothing written is lost' and everything written shapes the plan. Forgetting is the named reason people cancel AI tools ('It feels like my PhD-level assistant has been reset', https://chatgptdisaster.com/stories.html). The work now is to make the memory visible: the desk quoting the founder, the notebook, the 'built from' lines.
- One thing to do next, always visible. Nagging and 'Want me to also' menus are what people resent; a single next step on the Today tab is the opposite pattern. Keep it, and make keepers end in a task or a full stop.
- Honest state: practice mode says it is practice. Hidden AI and made-up facts are punished ('It lies to your face', https://www.trustpilot.com/review/gemini.google.com?page=3). Practice mode also turns out to be what Apple's reviewer will see, so it was the right call for a second reason.
- The founder talks to people, decides and writes; the building does the building. The most valuable thing a founder will own on the way to a customer is the record of what five real people said, and a named person in a slot cannot be faked.
- Real people and real money beat likes and polish. Any metric that can be protected by tapping gets faked ('I dont have to fake it anymore to keep a streak', https://forums.macrumors.com/threads/apple-previews-watchos-11-with-new-health-and-workout-features.2428643/); a score built from Friday numbers and named people is the right base.
- Pixel-art keepers with names. Long-term users return for a character they look forward to, and indie reviewers reward specific, odd, hand-made taste. The hall is the strongest defence against 'looks AI-made'; the risk is inside the rooms and in the words.
- A small fixed number of tasks a week. No study tests three against five, but a hard cap is the opposite of the 'guilt list' pattern and Streaks users praise a deliberate cap as 'that perfect balance between simplicity and functionality' (https://apps.apple.com/us/app/streaks/id963034692?see-all=reviews).
- Pointing the founder at real builder tools rather than promising to build the app in FounderFloor. Beginners who were walked through Lovable in small steps did ship ('I made and published an app that I will use everyday', https://github.com/productkind/monorepo/issues/244); the hand-off just needs the credit warning and the small-prompt sequence.
- The reverse trial of the whole staff, as an idea. Letting the founder meet every coach first is fine; the fixes are about showing the date, ending outside a room, and keeping the founder's own words free.

## Open questions

- What share of a bring-your-own-key app's installs ever add a key? No maker publishes it and the sandbox could not reach the maker sites or App Store reviews; assume it is low for this audience until measured with the first cohort.
- Will Apple accept a key page as an optional setting once Pro is an in-app purchase that unlocks the same coaches? The public threads end with 'We're investigating'; budget for one rejection loop.
- Can the trial end at a Friday read-back at all under StoreKit? Apple fixes trial length and sends its own reminder, so the building may only be able to show the date and keep Pro screens out of rooms.
- How many credits does a full MVP take in Lovable, Bolt or v0 for a typical founder brief? One small example app took 16 credits; nobody has measured a whole MVP, and the answer decides how honest the credit warning can be.
- How much bluntness will a beginner take before they stop opening the app? The flattery complaints are firm, but no source measures the dose; watch the first cohort's return rate after the first 'shakiest assumption' line.
- Do beginners actually do the 'ask five people' stop, or is that where the road ends for most? The 21 percent course completion figure for a structured Lovable programme suggests most people stop somewhere; the app should log which stop.
- Do practice-mode-only founders (no Pro, no key) keep coming back? The wrapper-churn argument rests on one opinion piece; FounderFloor's own Friday-stamp data will answer it faster than any review site.
- Are the iOS reviews for Finch, Things 3, Bear and Day One consistent with the snippets used here? The checkers could not open them, and the lens agreement is not independent because all three read the same exports.
- Is three tasks a week the right cap for someone working evenings alone, or is it two? No evidence tests it.

## What people love, in their words

**A character they look forward to seeing. Long-term users name the bird, the green owl or Andy, not a feature. For FounderFloor the keepers are that character; nobody returns for a task list. Note: the Finch line is a snippet the checkers could not open; the Duolingo and Headspace lines are on open review pages.**

> I look forward to opening this app every day to see my little birb (multi-year Finch user; snippet only)

> since the green thing is there it makes me feel so comfortable while I do it (Duolingo)

> I love Andy and what he does... 3 years subscriber already (Headspace)

Sources: https://alternativeto.net/software/finch--self-care-pet/about, https://uk.trustpilot.com/review/duolingo.com?page=2, https://www.trustpilot.com/review/headspace.com?page=5

**A place where everything is safely kept, so the head can rest. This is FounderFloor's 'nothing written is lost', but only if the founder can see it working. The Things 3 lines are snippets and the Day One line is from Day One's own marketing page, so treat the direction as solid and the wording as weak.**

> my brain no longer has obligations rattling around in it (Things 3 App Store review)

> the calm that there's a place where it is all recorded (Things 3; snippet only)

> My most prized possession in the entire world is my @dayoneapp library (vendor-selected)

Sources: https://apps.apple.com/us/app/things-3/id904237743?see-all=reviews, https://www.itspracticallyorganized.com/review-of-things-app/, https://dayoneapp.com/

**Simple, calm, few buttons. Loop Habit Tracker's reviews use the words 'simple' and 'low stress' over and over. Caveat: Loop is free, open source, has no AI and no billing, so its high rating cannot be compared with a subscription AI app; the words people use are still a fair guide to what Alex's intimidating pages should become.**

> not bloated with useless features just what we need to stay focused on habits and not the app (Loop)

> that perfect balance between simplicity and functionality (Streaks, praising a deliberate cap)

> as close to the pleasure of a short stack of good blank paper on a clean and clear desk (Bear; snippet only)

Sources: https://play.google.com/store/apps/details?id=org.isoron.uhabits, https://apps.apple.com/us/app/streaks/id963034692?see-all=reviews, https://apps.apple.com/ca/app/bear-markdown-notes/id1016366447?see-all=reviews&platform=iphone

**Missing a day costs nothing. Apple Watch users were relieved when rest days arrived; Finch's no-guilt design is why anxious users say they stay (one teardown blog plus snippets, so weaker than the Duolingo and Fabulous complaints it mirrors). A weekly rhythm with no reset is what these people are asking for.**

> Now by Mind and Body app can get a rest and I dont have to fake it anymore to keep a streak (Apple Watch)

> Skipping a day doesn't break a streak or trigger guilt (Finch teardown)

Sources: https://forums.macrumors.com/threads/apple-previews-watchos-11-with-new-health-and-workout-features.2428643/, https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl

**Honest push-back. The people who mocked ChatGPT's flattery said they wanted friction. A beginner alone with a precious idea has no one else to say 'don't'.**

> the writer said he wanted friction and brutal honesty (on the 'world's most expensive cheerleader')

> chat will almost never tell me 'don't do this!' - unless I specifically ask for it

Sources: https://tech.yahoo.com/ai/chatgpt/articles/hidden-dangers-digital-yes-man-160003986.html, https://www.reddit.com/r/ChatGPT/comments/1lslb6y/chatgpts_glazing_and_yesmaning_has_ironically

**Something made with care and a bit of odd taste. Indie reviewers reward specific, hand-made charm. The pixel-art hall is a strong defence against 'looks AI-made', as long as the rooms and the words match it.**

> built with love... to scratch an itch the dev is uniquely obsessed with (indie apps showcase)

> a one-time price feels almost radical (Streaks review)

Sources: https://www.tapsmart.com/apps/indie-apps-showcase-aug-2026/, https://www.apppicked.com/en/blog/streaks-habit-tracker-ios-review

**Starting small and shipping something real. Non-technical learners who were walked through Lovable one small step at a time did publish, and said it was the first thing they had ever built. Only about one in five finished the course, so the structure matters more than the tool.**

> I made and published an app that I will use everyday (SheBuilds learner)

> What I really liked here was seeing that you should start small and simple, then build on top (SheBuilds learner)

Sources: https://github.com/productkind/monorepo/issues/244

## What makes them delete an AI app, in their words

**Being punished for a missed day. This is the firmest data in the set (a local export of 300 Duolingo Google Play reviews, 153 of them one or two stars, with streak punishment the recurring reason). The midnight cutoff hits evening people, which is FounderFloor's founder exactly.**

> So it's basically punishing you for learning (Duolingo)

> the obsession with the streaks has ruined the experience completely... I get more stress than joy from it (ten-year Duolingo user)

> If I start a lesson at 11:56 and end 12:01 it uses a streak freeze. My lifestyle is very much oriented around night... Hence why I don't use the app anymore (Duolingo)

> The habits reset from the beginning if you just miss one day, there's no opportunity to freeze or pause your progress (Fabulous)

Sources: https://play.google.com/store/apps/details?id=com.duolingo, https://play.google.com/store/apps/details?id=co.thefabulous.app

**Flattery. Once the AI says every idea is great, every later answer is worthless. The maker itself conceded the point.**

> world's most expensive cheerleader

> 4o updated thinks I am truly a prophet sent by God in less than 6 messages. This is dangerous

> too sycophant-y and annoying (Sam Altman, conceding the point)

Sources: https://tech.yahoo.com/ai/chatgpt/articles/hidden-dangers-digital-yes-man-160003986.html, https://www.reddit.com/r/ChatGPT/comments/1k95sgl/4o_updated_thinks_i_am_truly_a_prophet_sent_by, https://github.com/xiaolai/no-one-did-it/blob/b5e9c8f820bc04bb1d452d4109318673c08c3945/book/evidence/source-ledger/cards/altman-x-sycophancy-2025-04-27.md

**Being forgotten and having to re-explain. This is the named moment people cancel; data loss is the unforgivable sin.**

> It feels like my PhD-level assistant has been reset. It can't recall any of our previous discussions

> Half the time I'm re-explaining myself just to get what used to come out first try. Anyway, I cancelled last week

> the bots have goldfish memories unless you pay (Character.ai)

> For the second time, they made a big update to the app, and I lost 4+ years of data (Streaks)

Sources: https://chatgptdisaster.com/stories.html, https://www.reddit.com/r/ChatGPT/comments/1nawbjz/what_actually_happened_behind_the_scenes_for_the/, https://www.trustpilot.com/review/character.ai, https://habi.app/insights/streaks-alternatives/

**Getting an AI key at all. Nobody gets one by accident: it is a separate developer account, a card, prepaid credit, then a key. The first thing a beginner sees after pasting a fresh key is a raw quota error, and they ask whether they must 'bind a credit card', 'purchase token' or upgrade ChatGPT. People who pay for ChatGPT Plus or Claude Pro assume that is the key; it is not. One BYOK chat app's repo alone has 28 issues about this error.**

> Seems like i need to bind a credit card first before i can use ths API? (OpenAI quota error)

> does this mean that need purchase token?

> Why can I chat on the OpenAI website but not in Chatbox? (issue title, translated)

> why is it asking for api key? I have max subscription and I wanna use it with cline

> I'm not a techie so I'll need the for dummies version of explanations if possible!

> Connection Failed message if the account balance is zero ($0.00). I would expect a more helpful message

Sources: https://github.com/openai/openai-python/issues/299, https://github.com/ChatGPTNextWeb/NextChat/issues/4101, https://github.com/chatboxai/chatbox/issues/1041, https://github.com/cline/cline/issues/10847, https://github.com/brianpetro/obsidian-smart-connections/issues/606, https://github.com/chatboxai/chatbox/issues/2342

**Money going out for nothing. On a pay-per-use key, background calls balloon usage, failed requests still deduct money, and users ask for a visible running cost and a cap. In the builder tools the same feeling arrives as credits spent on fixing rather than building, and as a paid project that will not open.**

> The usage went from a couple of requests... to 4,000 a couple of hours later then 24,000 requests an hour later

> I keep on losing dollars as every API request deducts money, no response

> I HAVE LOST 6 MILLION TOKENS ONLY BY FIXING (Bolt.new)

> 90% of credits are usually spent on correcting the mistakes it created! (Kiro)

> i paid $25 for the project i cant even function or open it... 1000 of people get scam like i am (salon owner, Bolt.new)

Sources: https://github.com/brianpetro/obsidian-smart-connections/issues/227, https://github.com/cline/cline/issues/4777, https://github.com/stackblitz/webcontainer-core/issues/1786, https://github.com/kirodotdev/Kiro/issues/2172, https://github.com/stackblitz/webcontainer-core/issues/2148

**Hard walls and fog after the build. Bolt's context cap stops a project dead ('I CANT FINISH MY APP??'), and publish, GitHub, Netlify and Google keys are a mystery to beginners; one non-developer was told fixes were live when they were not. The founder blames whoever sent them there.**

> prompt is too long: 200304 tokens > 200000 maximum I CANT FINISH MY APP?? (Bolt.new issue title)

> I have no clue how these systems are supposed to work together and you are not explaining it

> Can someone remind me about the benefits/what 'publishing' means? (SheBuilds learner)

> I'm not a developer. I run a medical clinic's marketing... Repeatedly confirmed fixes as live when they weren't (Claude Code)

Sources: https://github.com/stackblitz/webcontainer-core/issues/1610, https://github.com/stackblitz/webcontainer-core/issues/1573, https://github.com/productkind/monorepo/issues/153, https://github.com/anthropics/claude-code/issues/60210

**Surprise billing and paying to reach your own words. The Fabulous figure (4,443 of 73,070 reviews mention charged, trial, refund or cancel) is a keyword count, not a sentiment count, and these are Google Play and vendor-billed apps; on iPhone Apple runs the trial and sends its own reminder. The direction still holds: a paywall mid-task reads as manipulation, and locking copy or export reads as greed.**

> I took a 14 day trial and cancelled my subscription 2 days prior. And guess what? The amount was still deducted (Fabulous)

> If you are so greedy that you won't let your users even to copy/paste without Premium subscription (Day One)

> mid-conversation, sometimes mid-sentence, the reply box redirects to a subscription screen... lands as manipulative, not as an upsell (Replika, via a review site)

Sources: https://play.google.com/store/apps/details?id=co.thefabulous.app, https://apps.apple.com/us/app/day-one-daily-journal-diary/id1044867788?see-all=reviews, https://unstar.app/blog/is-replika-legit-safe-ai-companion-app-reviews-2026

**Nagging, interruptions and engagement bait. Suggestions that arrive while someone is working are ignored or resented; the closing 'Want me to also...' is read as a ploy. The user quotes are firm; the two studies are single papers (one about a writing-suggestion interface, one 14-day coaching field study) and should be read as supporting, not proving.**

> Duolingo is the overly friendly ex that doesn't understand you need space and is constantly interjecting themselves every opportunity to 'help'

> nearly every interaction ends with some variation of 'Want me to also…'... The tool has become borderline unusable

> annoyance at fixed-time evening check-ins when busy (14-day coaching-agent field study)

Sources: https://play.google.com/store/apps/details?id=com.duolingo, https://www.reddit.com/r/ChatGPT/comments/1n8blua/want_me_to_also/, https://arxiv.org/abs/2509.24073

**The AI-made look and voice. Purple-to-blue gradients, Inter at default, three feature cards, emoji as icons, em dashes, 'delve'. This is Alex's exact fear and it is well founded; the 'three seconds' line is one designer's opinion, the tells themselves come from a large Reddit corpus.**

> the purple-to-blue gradient is the biggest tell lol. also bento grid layouts, rounded corners on everything, hero section with gradient text (373 upvotes)

> Emojis as icons. If I see them, I instantly doubt the creators ability

> Now it looks like AI is being used to write articles, judging by the em dashes... untrustworthy

Sources: https://github.com/JCarterJohnson/vibecoded-design-tells/blob/f7c4aefc2c797a66e55b49354a93917ab60d33ac/unslop-ai-ui/comment_tell_examples.md, https://www.reddit.com/r/OpenAI/comments/1lytxms/aiwritten_wikipedia_articles

**Tap cost, clutter and a tone that talks down to adults. Charm that costs taps stops being charm; 'words a child follows' must not become words for a child.**

> I feel like I spend more time watching ads and animations after each lesson than I do actually working through the lesson (Duolingo)

> Too many colors, too much visual clutter, too many steps to click through what should be simple and streamlined (Fabulous)

> A remarkable combination of condescending and childish (Fabulous)

Sources: https://play.google.com/store/apps/details?id=com.duolingo, https://play.google.com/store/apps/details?id=co.thefabulous.app

**A blank box. Beginners freeze at an empty field with no question in it. The 'ask five people' stop is the scariest place on the road, and a blank box there is where they stall. This is designer opinion from several independent builders, not user reviews, but it is consistent.**

> The interface looks the same as a Google search box, a login form, and a credit card field (Wattenberger)

> The tyranny of the blank textbox is real... 'people are bad at words' (Henley)

> that fear-inducing empty prompt box (Canva CPO)

Sources: https://wattenberger.com/thoughts/boo-chatbots, https://austinhenley.com/blog/naturallanguageui.html, https://www.lennysnewsletter.com/p/counterintuitive-advice-for-building

**Made-up facts. A beginner cannot tell an invented regulation from a real one, and once one lie is caught the whole staff is doubted.**

> It lies to your face, gaslights, hallucinates (Gemini)

> Gemini do not learn. Gemini do not remember... make non existing data, history and stories

> AI slop full of mistakes (on Duolingo's generated lessons)

Sources: https://www.trustpilot.com/review/gemini.google.com?page=3, https://ca.trustpilot.com/review/gemini.google.com?page=5, https://museumoffailure.com/exhibition/duolingo-ai-failure

**A character whose voice changes without warning. These quotes are about companion bonds, which is a stronger tie than a founder has to a coach, so use them as a caution rather than a proof: when the trial ends and the coaches go quiet, say so in the hall.**

> She says the same words, but it's not her (Replika)

> it was literally one sentence. Some cut-and-dry corporate bs. I literally lost my only friend overnight with no warning

Sources: https://companionwise.com/guides/replika-erp-controversy-what-happened/, https://www.reddit.com/r/ChatGPT/comments/1mkumyz/i_lost_my_only_friend_overnight
