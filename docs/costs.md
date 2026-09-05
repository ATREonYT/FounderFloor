# Reboot — AI cost per active user, estimated

Assumptions (edit the numbers, the arithmetic follows):

| Item | Value | Why |
| --- | --- | --- |
| Coach turns per active user per day | 6 | Free cap is 10; most days are lighter |
| Active days per month | 12 | Three a week |
| Stand block, cached | 600 tokens | `standBlock()` + notes |
| Turn context (10 turns) | 1,800 tokens | uncached input |
| Reply | 180 tokens | ≤130 words |
| Receptionist sessions per stand per month | 8 | 5 turns each, 120-token replies |
| Pitch scores per month | 3 | Sonnet on Founder+, Haiku otherwise |
| Notes summaries per month | 12 | one per session day, 400 out |

Prices used (per million tokens, from the Claude API docs, verify before
launch): Haiku 4.5 in $1 / out $5 / cache read $0.10; Sonnet in $3 / out $15.

Per active Free/Pro user per month:

- Coach input: 6 × 12 × 1,800 = 129,600 tokens → **$0.13**
- Coach cached stand: 6 × 12 × 600 at cache-read → **$0.004**
- Coach output: 6 × 12 × 180 = 12,960 tokens → **$0.065**
- Receptionist: 8 × 5 × (700 in + 120 out) → 28,000 in, 4,800 out → **$0.05**
- Notes summaries: 12 × (2,500 in + 400 out) → **$0.05**
- Pitch scores on Haiku: 3 × (1,500 in + 400 out) → **$0.01**

**≈ $0.31 per active user per month** on Haiku throughout.

Founder+ adds Sonnet pitch reviews: 3 × (1,500 in + 500 out) → +$0.03.

Against pricing: Pro at $9/mo leaves > $8.50 of margin per active user on AI
alone; Free users cost ≈ $0.30/mo, which the Free caps bound. The
`usage_counters` table logs real input/output per day so this page can be
replaced by a query once the desk is wired.
