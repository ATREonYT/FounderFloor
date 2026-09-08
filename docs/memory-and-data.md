# The notebook: what the app remembers, and whether it may

**This is a working note by the builder, not legal advice.** Before launch,
have a Cyprus lawyer read it against the app as shipped. It is written
so that the lawyer's job is checking, not starting from nothing.

## What the app does

The desk keeps a **notebook** per founder: the steps they tick on a task,
how each task went (did it / partly / stuck, plus a line), the notes they
type on a task page, the first line of what the desk or a coach told
them, and the five numbers they log each week. Every line is dated.

- It is written **on the founder's device** (AsyncStorage). Nothing about
  the notebook is sent to the floor server today. When the Supabase
  tables arrive it will sync like the rest of the founder state, and this
  note must be updated then.
- It is **read only with consent**. `memoryOn` is `null` until the founder
  answers the notebook question (`MemoryAsk`). Only `true` lets
  `founderLog()` return anything; `false` also stops new lines being
  written (`addMemory` refuses). The question is shown once, on the first
  task page, and can be changed in Settings.
- When it is read, it goes **to the model with the founder's question**,
  as part of the prompt (task desk, coaches, remaking the plan). It is
  used only for that founder's own answers. There is no cross-founder
  profiling, no analytics on it, no sale, no advertising.
- The founder can **read every line** (`/memory`), **take a copy**
  (share sheet, plain text) and **burn it** (two taps). These are the
  rights of access, portability and erasure, built in rather than
  promised.

So the honest description is not "keeping a tab on everyone". It is a
diary the founder keeps, that the desk reads back to them on request.
That framing matters for the law and for the App Store.

## Is it legal? (GDPR, from Cyprus)

Cyprus is in the EU, so the GDPR applies, with the Cyprus Law 125(I)/2018
alongside it. The supervisory authority is the Office of the Commissioner
for Personal Data Protection (dataprotection.gov.cy). Summary: **yes,
lawful, if the checklist below is done.** Nothing in the design needs a
licence or a DPO at this size.

| Question | Answer for this app |
| --- | --- |
| Who is the controller? | You (the company behind FounderFloor). Anthropic, Supabase, Resend, Vercel and the VPS host are **processors**. |
| Lawful basis (Art. 6)? | The notebook runs on **consent** (6(1)(a)): asked in plain words, before anything is written, refusable with no loss of the core app, withdrawable in Settings. The rest of the app (account, stand, sync) runs on **contract** (6(1)(b)). Do not rely on legitimate interest for the notebook: it is easier to defend consent for AI memory. |
| Transparency (Arts. 12 to 14)? | The notebook question is the in-app notice. It must also be in the **privacy policy** on the site: what is collected, why, where it goes (named processors, Anthropic in the US), how long, and the rights. The site policy needs updating for the notebook and the AI. |
| Data minimisation (Art. 5(1)(c))? | Lines are capped (600 chars each, 400 lines, 40 lines and 2,600 chars per prompt). Only the first sentence of an AI reply is kept, not the whole conversation. Keep it that way. |
| Special categories (Art. 9)? | The app does not ask for any. A founder could type health or political content into a note. Do not block it (that is also processing); instead say in the policy that notes are free text, keep them on device, and honour deletion instantly. |
| Rights (Arts. 15 to 20)? | Access and portability: the notebook page and "Take a copy". Erasure: "Burn the notebook". Rectification: the founder can retype a note; "Change how it went" edits the outcome. Once sync exists, burning must also delete the server copy. |
| Retention (Art. 5(1)(e))? | Write a rule and keep to it. Suggested: the notebook lives as long as the account; deleted with the account; on the server (later) 30 days after deletion in backups at most. |
| International transfer (Chapter V)? | Anthropic processes in the US. Sign Anthropic's Data Processing Addendum, which includes the EU Standard Contractual Clauses, and name it in the policy. Same for Supabase (pick an EU region) and Resend. |
| Processor terms (Art. 28)? | A DPA with each processor. Anthropic's commercial terms say API inputs and outputs are **not used to train models** by default and are retained only briefly for abuse monitoring; check the current terms when you sign, and ask about zero-data-retention if you want the stronger claim. The notebook copy in the app already says "not used to train". |
| Security (Art. 32)? | On device: AsyncStorage, not the keychain (the token is in the keychain; the notebook is not a secret, but the phone's own encryption covers it). On the server later: encrypted at rest, access logged. HTTPS everywhere already. |
| DPO / DPIA (Arts. 35, 37)? | Not required: no large-scale monitoring, no special categories by design, no public-area surveillance. Keep a short **record of processing** (Art. 30) anyway; this document is most of it. |
| Children (Art. 8)? | The app is for founders. State 16+ in the terms and the App Store rating. |
| Breach (Arts. 33, 34)? | Have a one-page plan: who notices, who tells the Commissioner within 72 hours, how founders are told. |

## The App Store and the AI Act

- **Apple** requires a privacy nutrition label (declare "User Content"
  and "Identifiers", linked to the user, not used for tracking), an
  in-app way to **delete the account** (guideline 5.1.1(v)), and that AI
  features are labelled as such. The app's status lines already say
  "Live" or "Practice mode". Account deletion needs a server endpoint and
  a button in Settings before submission; it is not built yet.
- **EU AI Act**: FounderFloor is a *deployer* of a general-purpose model
  for a low-risk use (coaching and planning). Obligations are
  transparency (say it is an AI; done) and not using it for prohibited
  practices (none here). No conformity assessment.

## What "the AI remembers" means in the code

- `packages/shared/src/memory.ts`: the entry type, `withEntry` (dedupe,
  one note per task, cap), `founderLog` (the block prompts carry, empty
  without consent), `exportLog`, `MEMORY_NOTICE` (the words shown).
- `apps/mobile/src/lib/store.ts`: `memory`, `memoryOn`, `addMemory`,
  `forgetMemory`, `setMemoryOn`; the weekly log writes a line.
- `apps/mobile/src/lib/taskDesk.ts`: ticks, outcomes, notes and desk
  replies write lines; the task prompt and the task desk read the log.
- `apps/mobile/src/lib/receptionist.ts`: every coach reads the log; what
  they say is written down.
- `apps/mobile/src/app/welcome.tsx`: remaking the plan reads the log.
- `apps/mobile/src/app/memory.tsx`, `components/MemoryAsk.tsx`,
  `settings.tsx`: the page, the question, the switch.

## Still to do before launch

1. Update the site privacy policy for the notebook, the AI and the
   processors, and link it from the notebook question.
2. Sign the DPAs (Anthropic, Supabase, Resend, Vercel, VPS host).
3. Build account deletion (server endpoint plus Settings button), which
   also deletes the notebook once it syncs.
4. Write the retention rule down and put it in the policy.
5. Have a lawyer read this note against the shipped app.
