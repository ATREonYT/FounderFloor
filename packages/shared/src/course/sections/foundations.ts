/**
 * SECTION 1: WHAT A START-UP IS.
 *
 * Three units. The word, the idea, the founders. Everything after this
 * assumes the learner can say what a start-up is and why most of them
 * die, because that is what tells them where to spend their time.
 */
import type { Unit } from "../content.ts";

export const FOUNDATIONS: Unit[] = [
  {
    id: "what-it-is",
    section: "foundations",
    n: 1,
    missions: ["say-it"],
    name: "What a start-up is",
    line: "A specific kind of company, chosen for one thing. Most people who use the word do not know which.",
    guide: [
      "A start-up is a company designed to grow fast. Not a new company, not a tech company, not a small one. A café can be a fine business and not a start-up; a two-person software company can be a start-up on day one. The word describes the intent, and the intent decides everything else.",
      "A start-up is also a search, not a plan. Steve Blank's line: a temporary organisation searching for a repeatable business model. You do not yet know who pays, for what, or how you find them. The work is finding out, and the method is going outside and asking.",
      "About 42% of start-ups die because nobody needed the thing. Running out of money is usually the last thing that happened, not the first. Which is why this course spends two whole sections on the customer before it spends one lesson on building.",
    ],
    lessons: [
      {
        id: "growth-is-the-word",
        n: 1,
        title: "Growth is the word",
        minutes: 4,
        objective: "Tell a start-up from a business, and say why it matters which one you are building.",
        teach: [
          "The word start-up gets used for any new company. It means something narrower. A start-up is a company designed to grow fast — that is Paul Graham's definition, and it is the useful one because it has consequences.",
          "A café, a consultancy, a plumbing firm: fine businesses, real money, real work. Not start-ups, because they are built to reach a size and stay there. Nothing wrong with that. Many people would be happier building one.",
          "The consequence: if you are building a start-up, every choice — the idea, the price, the team, the money — gets made for growth. If you are not, those same choices get made for something else, like a good life or a steady income. Knowing which you want is the first decision, and it is fine to change your mind.",
        ],
        example: [
          { label: "A business", text: "A bakery that opens at six, sells out by two, and pays two salaries. It could open a second one in five years." },
          { label: "A start-up", text: "A way for bakeries to sell tomorrow's bread tonight. Ten bakeries this month, a hundred next quarter, every bakery in the country if it works." },
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Which of these is a start-up, in the sense this course uses the word?",
            options: [
              { text: "A new restaurant with a great chef and a good location.", good: false, why: "New and good, but built to reach one size and stay there. A business." },
              { text: "A two-person company making software that lets any restaurant take bookings without a phone call.", good: true, why: "Designed to grow: every restaurant is a potential customer and nothing about the product caps it at ten." },
              { text: "A freelance designer who has just registered a company name.", good: false, why: "One person selling their hours. Real work, not designed for growth." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these is a sign of a start-up, and which is just a sign of a new company?",
            buckets: ["A start-up", "Any new company"],
            items: [
              { text: "The founders expect to serve a thousand times more customers than they do now.", bucket: 0, why: "Growth is the intent. That is the definition." },
              { text: "The company was registered three months ago.", bucket: 1, why: "Age says nothing about what it is designed to do." },
              { text: "The product works the same for the thousandth customer as for the first.", bucket: 0, why: "That is what lets it grow without hiring one person per customer." },
              { text: "The founders work from a kitchen table.", bucket: 1, why: "Where you sit is not what you are." },
            ],
          },
          {
            kind: "fill",
            prompt: "A start-up is a company designed to ___.",
            options: ["raise money", "grow fast", "use technology", "be sold"],
            answer: 1,
            why: "Money, technology and exits are things start-ups often do. Growth is what they are for.",
          },
          {
            kind: "choose",
            prompt: "You want to build something that gives you a good income and evenings free. What does this lesson say?",
            options: [
              { text: "Build a start-up anyway; the growth will come.", good: false, why: "A start-up is chosen for growth, and growth is not a side effect. Wanting evenings free is a reason to build something else." },
              { text: "Build a business, on purpose, and be glad you knew the difference.", good: true, why: "Knowing which one you want is the first decision, and either answer is a good one." },
              { text: "You cannot build a company without wanting growth.", good: false, why: "Most companies in the world are not start-ups. They are built every day by people who wanted something else." },
            ],
          },
        ],
        remember: "A start-up is a company designed to grow fast. Decide whether that is what you want.",
        apply: { key: "idea", prompt: "Say your idea in one sentence — and add three words at the end: is it a business, a start-up, or not sure yet?", hint: "What it does, who it is for, and which of the two you are building." },
      },
      {
        id: "a-search-not-a-plan",
        n: 2,
        title: "A search, not a plan",
        minutes: 4,
        objective: "Explain why a start-up cannot be planned the way a business can, and what it does instead.",
        teach: [
          "A business plan assumes you know who the customer is, what they will pay, and how you reach them. A start-up does not know those things yet. Steve Blank put it plainly: a start-up is a temporary organisation searching for a repeatable business model. Searching. Not executing.",
          "A business model is the answer to four questions. Who pays? For what? How much? How do they find out about you? A start-up begins with guesses at all four and ends, if it works, with answers that hold for the thousandth customer as well as the first. Repeatable is the word that matters.",
          "The method for the search is short: the answers are outside the building. You cannot find out what people will pay by thinking harder at your desk. You go and ask, watch, offer, and write down what happened. The rest of this course is mostly how to do that well.",
        ],
        example: [
          { label: "Executing a plan", text: "Open the shop, run the ads, hit the forecast." },
          { label: "Searching for a model", text: "Talk to fifteen café owners. Find out three of them keep a paper list of regulars. Offer one of them a prepaid pass. Watch what happens. Change the guess." },
        ],
        exercises: [
          {
            kind: "order",
            prompt: "Put the four questions a business model answers in the order this course asks them.",
            steps: ["Who pays?", "For what?", "How much?", "How do they find out about you?"],
            why: "Who comes first because until you know who, nothing else can be answered. Price and channel come after the person and the thing.",
          },
          {
            kind: "sort",
            prompt: "Which of these is searching, and which is executing a plan?",
            buckets: ["Searching", "Executing"],
            items: [
              { text: "Spending Tuesday in three cafés asking owners what they did last quiet week.", bucket: 0, why: "Going outside to find an answer you do not have." },
              { text: "Finishing the app because the spec says it needs six screens.", bucket: 1, why: "Building against a plan, before the plan has been tested." },
              { text: "Changing the price after four people winced at it.", bucket: 0, why: "A guess corrected by contact with customers." },
              { text: "Running the launch campaign on the date in the roadmap.", bucket: 1, why: "A schedule being followed, whatever the world has said since." },
            ],
          },
          {
            kind: "fill",
            prompt: "A start-up is a temporary organisation searching for a ___ business model.",
            options: ["profitable", "repeatable", "simple", "funded"],
            answer: 1,
            why: "Repeatable is the whole point: a model that works for one customer by luck is not a model. Profit comes from repeating it.",
          },
          {
            kind: "choose",
            prompt: "Where are the answers to \"who pays and how much\"?",
            options: [
              { text: "In a spreadsheet, once you have modelled the market properly.", good: false, why: "A spreadsheet holds your guesses in neat rows. It cannot tell you which are wrong." },
              { text: "Outside, with the people you think will pay.", good: true, why: "The only source. Everything else is inference." },
              { text: "In what competitors charge.", good: false, why: "Useful context, and a guess about their customers, not yours." },
            ],
          },
        ],
        remember: "A start-up searches for a business model. The answers are outside the building.",
        apply: { key: "assumed", prompt: "Write your current guesses at the four questions: who pays, for what, how much, how they find you. Label them guesses.", hint: "One line each. They are supposed to be wrong at this point." },
      },
      {
        id: "why-they-die",
        n: 3,
        title: "Why they die",
        minutes: 5,
        objective: "Name the commonest cause of start-up death and say what it means for where you spend your time.",
        teach: [
          "CB Insights has read hundreds of start-up post-mortems and counted the causes. The top line has not moved in a decade: about 42% failed because there was no market need. They built something nobody needed enough to pay for.",
          "Running out of money is on the list too, near the top. But it is almost always the last thing that happened, not the first. The money ran out because customers did not come; customers did not come because the need was not there. Cash is the symptom.",
          "Then: the wrong team, being outcompeted, pricing and cost problems, a poor product, no business model, bad marketing, ignoring customers, bad timing. Read that list once more and notice how many of them are about not having found out something you could have found out by asking.",
          "So the order of this course is the order of the risk. Two sections on the customer before one lesson on building. Not because building is hard — building is the fun part — but because building the wrong thing is how most of the 42% spent their year.",
        ],
        example: [
          { label: "The post-mortem", text: "\"We spent nine months building the platform. When we launched, the users we had imagined did not exist. We had never actually met one.\"" },
        ],
        exercises: [
          {
            kind: "fill",
            prompt: "The commonest reason start-ups fail is ___.",
            options: ["running out of money", "no market need", "the wrong team", "bad timing"],
            answer: 1,
            why: "About 42% in CB Insights' count. Running out of money is what it looks like at the end; no need is what it was at the start.",
          },
          {
            kind: "choose",
            prompt: "A founder says: \"We failed because we ran out of cash.\" What is the most likely deeper cause?",
            options: [
              { text: "They should have raised more.", good: false, why: "More cash would have bought more months of the same problem." },
              { text: "Not enough people needed the thing enough to pay, so money went out and did not come back.", good: true, why: "Cash is the symptom. Need is the disease." },
              { text: "Their accountant was bad.", good: false, why: "Books tell you when you will die. They do not decide it." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these causes of death could have been caught by asking customers earlier?",
            buckets: ["Could be caught by asking", "Harder to catch by asking"],
            items: [
              { text: "No market need.", bucket: 0, why: "The whole of section two is how to catch this." },
              { text: "Pricing and cost problems.", bucket: 0, why: "A price said out loud to ten people tells you a lot for free." },
              { text: "Ignoring customers.", bucket: 0, why: "By definition." },
              { text: "A co-founder who leaves after a year.", bucket: 1, why: "Customers cannot tell you this. Vesting can soften it; unit three covers it." },
            ],
          },
          {
            kind: "choose",
            prompt: "Given the numbers, where should a founder with an idea and no customers spend next month?",
            options: [
              { text: "Building the product, so there is something to show.", good: false, why: "Something to show is useful. Nine months of it before meeting a customer is the 42%." },
              { text: "Finding out whether the need is real, by talking to people who might have it.", good: true, why: "The biggest risk first. It is also the cheapest to test." },
              { text: "Raising money, so the runway is long enough to figure it out.", good: false, why: "Longer runway to reach the same wall. Find the need, then the money is worth something." },
            ],
          },
        ],
        remember: "Most die of no need. Test need before you build, because it is the biggest risk and the cheapest to check.",
        apply: { key: "riskiest", prompt: "What is the one belief that, if wrong, ends your idea? Usually it is a version of \"people need this enough to pay\".", hint: "One sentence. This is what you test first." },
      },
      {
        id: "depth-what-growth-means",
        n: 4,
        title: "Depth: what \"fast\" means, in numbers",
        depth: true,
        minutes: 5,
        objective: "Put numbers on \"designed to grow fast\", and explain why start-ups tend to be technology companies.",
        teach: [
          "Growth needs a number or it is a mood. Y Combinator's benchmark during its programme: 5–7% a week is good, 10% is exceptional, 1% means you have not found out what to do yet. Weekly, because a start-up needs to learn every week, and a weekly number is a weekly lesson.",
          "Compounding is why small weekly numbers matter. 5% a week is about 12 times in a year. 7% a week is about 33 times. A company growing 1% a week is growing at roughly the pace of a good shop, which is fine for a shop and fatal for a start-up's plan.",
          "Why do start-ups so often use technology? Not because technology is the point. Because ideas for companies that can grow that fast are rare, and the best place to find one is wherever the world has just changed — and technology is where the world changes fastest. A new tool, a new platform, a new habit: each one opens ideas that were impossible two years ago.",
          "Which is also why \"why now\" is a real question and not a pitch-deck slide. If nothing has changed, someone tried this already and the answer is in their post-mortem.",
        ],
        exercises: [
          {
            kind: "fill",
            prompt: "During its programme, YC calls a weekly growth rate of ___ good.",
            options: ["1–2%", "5–7%", "20–30%", "50%"],
            answer: 1,
            why: "5–7% a week. Ten is exceptional. One means the search has not found the model yet.",
          },
          {
            kind: "choose",
            prompt: "5% a week for a year is roughly how many times bigger?",
            options: [
              { text: "About 2.5 times.", good: false, why: "That is 5% a year, or thereabouts, not a week." },
              { text: "About 12 times.", good: true, why: "1.05 to the power of 52. Compounding is the whole reason weekly rates matter." },
              { text: "About 260 times.", good: false, why: "That would be adding 5% of the starting number 52 times and then some. Growth compounds on the new number, not the first." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why do so many start-ups end up being technology companies?",
            options: [
              { text: "Because investors only fund technology.", good: false, why: "Investors fund growth. Technology is where the growth ideas keep appearing." },
              { text: "Because ideas that can grow fast are rare, and they appear where the world has just changed, which is mostly technology.", good: true, why: "Paul Graham's argument, and it explains why 'why now' is the first question about an idea." },
              { text: "Because software has no costs.", good: false, why: "It has plenty. Its costs just do not grow one-for-one with customers, which helps, but is not the reason." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these is a real \"why now\", and which is a wish?",
            buckets: ["A real why now", "A wish"],
            items: [
              { text: "Every café in the country got a card reader in the last three years, so a prepaid pass no longer needs cash.", bucket: 0, why: "A dated change in the world that makes the idea possible." },
              { text: "People are more interested in supporting local businesses now.", bucket: 1, why: "A mood without a date or a mechanism. It was also said ten years ago." },
              { text: "A regulation changed last year and every clinic now has to publish its waiting times.", bucket: 0, why: "Specific, dated, and it creates a need that did not exist." },
              { text: "The market is huge and nobody has done this properly.", bucket: 1, why: "If nobody has done it, the first question is why. The answer is often in a post-mortem." },
            ],
          },
        ],
        remember: "Fast means 5–7% a week. Ideas that can do that come from where the world just changed, so \"why now\" is a real question.",
        apply: { key: "whyNow", prompt: "What changed, and when, that makes your idea possible now and not two years ago?", hint: "A tool, a rule, a habit, a price. Dated if you can." },
      },
    ],
  },
  {
    id: "good-idea",
    section: "foundations",
    n: 2,
    missions: ["one-group"],
    name: "What makes an idea good",
    line: "Not clever. Wanted, by people you can reach, for a reason that only just became true.",
    guide: [
      "The best ideas have three things: the founders want it themselves, they can build it, and few others see it as worth doing. Ideas come from noticing problems, not from trying to have ideas.",
      "A good idea has a why-now: something that recently changed. It has a wedge: a small, specific first thing to do well before the big thing. And it has an edge: a reason it is you and not somebody with more money.",
      "Big flat markets are worse than small growing ones, because in a small growing market you can be the obvious choice before anyone else arrives.",
    ],
    lessons: [
      {
        id: "where-ideas-come-from",
        n: 1,
        title: "Where good ideas come from",
        minutes: 4,
        objective: "Tell a problem-shaped idea from a solution-shaped one, and say why the first kind is better.",
        teach: [
          "The way to get a start-up idea is not to try to think of one. It is to notice problems, especially your own, and to notice which of them you would pay to make go away. Paul Graham's three tests: something the founders themselves want, that they can build, and that few others realise is worth doing.",
          "Ideas that start from a solution — a technology looking for a use, an app because apps are cool — tend to fail the first test. Nobody wants them; they are wanted by the founder for being clever. Ideas that start from a problem you have met, in your own life or your own job, tend to pass it, because you are the customer and you know the problem is real.",
          "The third test sounds odd. Why would you want an idea few others see as worth doing? Because if everyone saw it, it would already exist. Good ideas often look small, boring or slightly embarrassing at the start. That is what kept the others away.",
        ],
        example: [
          { label: "Solution-shaped", text: "An AI assistant for small businesses." },
          { label: "Problem-shaped", text: "Every Tuesday I watch my mum retype the same eight invoices into two different programs. She has done it for six years." },
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Problem-shaped or solution-shaped?",
            buckets: ["Starts from a problem", "Starts from a solution"],
            items: [
              { text: "I ran a café for four years and lost track of who my regulars were every winter.", bucket: 0, why: "A real person, a real recurring pain, met first-hand." },
              { text: "Blockchain for supply chains.", bucket: 1, why: "A technology in search of someone who wants it." },
              { text: "Parents at my kid's school swap babysitting on a paper rota that gets lost monthly.", bucket: 0, why: "Noticed, specific, and the founder is in the group." },
              { text: "A social network for pet owners.", bucket: 1, why: "A format that exists, pointed at a group. What problem does the group have?" },
            ],
          },
          {
            kind: "choose",
            prompt: "Which of the three tests does \"a marketplace for everything\" fail hardest?",
            options: [
              { text: "The founders want it themselves.", good: false, why: "Maybe they do, in the abstract." },
              { text: "The founders can build it.", good: false, why: "Some could." },
              { text: "Few others realise it is worth doing.", good: true, why: "Everyone realises it. Several have done it. The question is what they know that the others did not." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why is an idea that looks a bit boring often a good sign?",
            options: [
              { text: "Boring ideas are easier to build.", good: false, why: "Not necessarily. And that is not the reason." },
              { text: "Because looking boring is what kept everyone else from doing it, so the problem is still unsolved.", good: true, why: "The third test. An idea everyone finds exciting has competition; one that looks small has room." },
              { text: "Investors prefer boring ideas.", good: false, why: "Some do. That is a consequence, not the cause." },
            ],
          },
          {
            kind: "edit",
            prompt: "Turn this solution-shaped sentence into a problem-shaped one about a real person.",
            before: "An app that uses AI to help freelancers be more productive.",
            better: ["It names a specific kind of freelancer, not 'freelancers'.", "It says a thing that actually happens to them, and when.", "There is no product in it yet."],
          },
        ],
        remember: "Notice problems, especially your own. The best ideas are wanted, buildable, and look small to everyone else.",
        apply: { key: "problem", prompt: "Write the problem your idea solves with no product in the sentence. Who has it, what happens, how often.", hint: "If you have the problem yourself, say so." },
      },
      {
        id: "the-wedge",
        n: 2,
        title: "The wedge",
        minutes: 4,
        objective: "Choose a small, specific first thing to do well, and explain why starting small beats starting big.",
        teach: [
          "A wedge is the thin end of the idea: the smallest specific thing you do first, for the narrowest group, that you can do better than anyone. Amazon sold books before it sold everything. Facebook was for one university. The big thing came later, and it came because the wedge worked.",
          "A wedge does two jobs. It gives you a group of people small enough to actually reach and talk to, and it gives you a thing narrow enough to do well with two people and no money. \"Everyone\" and \"everything\" are not a wedge; they are the absence of one.",
          "The test of a wedge: could you name the first ten customers? Not describe them — name them, or say exactly where you would go on Tuesday to meet them. If you cannot, the wedge is still too wide.",
        ],
        example: [
          { label: "No wedge", text: "A loyalty platform for retail." },
          { label: "A wedge", text: "Prepaid passes for independent cafés in one town, starting with the six on the high street." },
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Which of these is the best wedge for \"help restaurants take bookings\"?",
            options: [
              { text: "All restaurants in Europe.", good: false, why: "Not a wedge. Nobody can name the first ten." },
              { text: "The twelve restaurants within walking distance that still take bookings by phone.", good: true, why: "You could visit all twelve this week. Narrow enough to do well, real enough to learn from." },
              { text: "Restaurants that use Instagram.", good: false, why: "A big, loose group defined by a tool, not a need. Where would you go on Tuesday?" },
            ],
          },
          {
            kind: "fill",
            prompt: "The test of a wedge is whether you can ___ the first ten customers.",
            options: ["describe", "name", "afford", "email"],
            answer: 1,
            why: "Describing is easy and proves nothing. Naming means they exist and you can reach them.",
          },
          {
            kind: "sort",
            prompt: "Is this a wedge, or the absence of one?",
            buckets: ["A wedge", "Not a wedge"],
            items: [
              { text: "Maths games for the year-three class my sister teaches, then her school.", bucket: 0, why: "One class, one teacher you know. Then one school. The road widens later." },
              { text: "Education for children everywhere.", bucket: 1, why: "A mission statement. Where is the first classroom?" },
              { text: "Invoicing for the forty plumbers in the trade group I belong to.", bucket: 0, why: "A group you are in, small enough to count." },
              { text: "Small business tools.", bucket: 1, why: "Neither a group nor a thing." },
            ],
          },
          {
            kind: "choose",
            prompt: "A friend says your wedge is too small to be a real company. What is the honest answer?",
            options: [
              { text: "They are right; widen it now so it looks bigger.", good: false, why: "Widening it now removes the two things a wedge gives you: reachable people and a thing you can do well." },
              { text: "The wedge is where you start, not where you end. Books, then everything.", good: true, why: "A wedge that works is what earns the right to widen." },
              { text: "Size does not matter.", good: false, why: "It matters a lot later. Right now it matters that the first ten exist." },
            ],
          },
        ],
        remember: "Start with the thin end: one small group you can name, one thing you can do well. Widen after it works.",
        apply: { key: "customerGroup", prompt: "Write your wedge: the narrowest group of people you will start with, small enough to name the first ten.", hint: "A place, a trade, a school, a street. Not an industry." },
      },
      {
        id: "the-edge",
        n: 3,
        title: "Your edge, and the market",
        minutes: 5,
        objective: "Say why it is you and not somebody with more money, and tell a good small market from a bad big one.",
        teach: [
          "An edge is the reason you, specifically, can do this. You have the problem. You have done this job for ten years. You are in the group. You can build the thing yourself. You have a way in that a stranger with a bigger budget does not. It does not need to be dramatic; it needs to be true for about a minute of questioning.",
          "Ideas without an edge are ideas anyone could do, which means someone with more money will. Ideas with one tend to look, from outside, like they are not worth doing — because from outside, without your edge, they are not.",
          "On markets: the instinct is to want a big one. The better question is whether it is growing. A small market growing fast lets you become the obvious choice before the big players notice; a big flat market already has an obvious choice, and it is not you. Estimate roughly — how many of your group exist, and is that number rising — and do not spend a week on it. You will learn more from ten conversations than from any report.",
        ],
        example: [
          { label: "An edge", text: "I ran a café for four years; I know every owner on this street by name and they will take my call." },
          { label: "No edge", text: "I read that the café market is worth billions." },
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Which of these is an edge?",
            buckets: ["An edge", "Not an edge"],
            items: [
              { text: "I have the problem myself, every week.", bucket: 0, why: "You are the customer. You know what is true." },
              { text: "I am passionate about this space.", bucket: 1, why: "So is everyone who starts anything. It does not help you against a rival who is also passionate and has more money." },
              { text: "Forty of the people in my group already know and trust me.", bucket: 0, why: "A way in that money cannot buy quickly." },
              { text: "Nobody has done this yet.", bucket: 1, why: "Either they have and you have not looked, or there is a reason. Neither is an edge." },
            ],
          },
          {
            kind: "choose",
            prompt: "Which market would you rather be starting in?",
            options: [
              { text: "A huge market that has been the same size for twenty years, with three well-known companies in it.", good: false, why: "Big and flat. The obvious choice already exists and it is not you." },
              { text: "A small market that has doubled in two years and has no obvious leader yet.", good: true, why: "Small and growing. You can be the name people say before anyone bigger notices." },
              { text: "Whichever one has the bigger number in the report.", good: false, why: "The number in the report is about today. Growth is about tomorrow, and tomorrow is where you will be." },
            ],
          },
          {
            kind: "fill",
            prompt: "An edge should hold up for about ___ of questioning.",
            options: ["a minute", "an hour", "a due diligence process", "a pitch"],
            answer: 0,
            why: "A minute. It does not need to be dramatic; it needs to be true when someone asks 'why you?' and then 'but why?'",
          },
          {
            kind: "choose",
            prompt: "How long should you spend estimating your market size at this stage?",
            options: [
              { text: "A week, with a proper model.", good: false, why: "A week of modelling guesses. Ten conversations would tell you more." },
              { text: "Roughly, in an hour: how many of your group exist and whether the number is rising.", good: true, why: "Enough to know whether it is small-and-growing or big-and-flat. Then go and talk to people." },
              { text: "Not at all; markets do not matter early.", good: false, why: "They matter. They just do not reward precision yet." },
            ],
          },
        ],
        remember: "Have an edge that survives a minute. Prefer a small market that is growing to a big one that is not.",
        apply: { key: "edge", prompt: "Write your edge: the one reason it is you and not somebody with more money.", hint: "Then, on a second line, roughly how many of your group exist and whether that number is growing." },
      },
      {
        id: "depth-tarpits",
        n: 4,
        title: "Depth: tarpit ideas, and how to check one",
        depth: true,
        minutes: 5,
        objective: "Recognise the ideas that look good, attract many founders, and fail for a structural reason, and say how to check whether yours is one.",
        teach: [
          "Some ideas are tarpits: they look obviously good, they attract founder after founder, and each one fails for the same structural reason the last one did. Y Combinator has a list. Social apps for finding friends. Apps that tell you where your friends are going tonight. Marketplaces where both sides have to arrive at once. Recipe apps. Splitting the bill.",
          "The tell is that the idea is easy to think of and hard to make work. Everyone has had it. If nobody has made it work, it is not because nobody tried; it is because the problem is either not painful enough to change behaviour for, or the solution needs everybody to join before it is useful to anybody.",
          "How to check. Search for the idea; find the three companies that tried it; read what happened. If they died, find out why in their own words — founders write post-mortems. If the reason is one you cannot answer with your edge or your why-now, you have found a tarpit. That hour is the best hour of research you will do.",
          "It does not mean the space is closed. It means your why-now has to be real: something has to have changed since the last three tried. If it has, say what, in one sentence, before you spend a month.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "What is the tell of a tarpit idea?",
            options: [
              { text: "It is hard to think of and easy to build.", good: false, why: "The reverse. Tarpits are easy to think of." },
              { text: "It is easy to think of, many have tried, and each failed for the same structural reason.", good: true, why: "Obvious, popular, and repeatedly dead for the same cause." },
              { text: "It has no competitors.", good: false, why: "Tarpits usually have a graveyard of them." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these reasons for a past failure could a new founder answer, and which is structural?",
            buckets: ["Could be answered now", "Structural"],
            items: [
              { text: "\"Nobody had a card reader in 2014, so payment was cash and chaos.\"", bucket: 0, why: "The world changed. A real why-now." },
              { text: "\"Neither side of the marketplace would join until the other did.\"", bucket: 1, why: "The two-sided cold start. It has not changed and it will not for you." },
              { text: "\"Splitting the bill is not painful enough for anyone to change how they pay.\"", bucket: 1, why: "The pain was too small. It still is." },
              { text: "\"The tools to build it cost too much for a small team.\"", bucket: 0, why: "If the tools are now cheap, that is a change." },
            ],
          },
          {
            kind: "order",
            prompt: "Put the tarpit check in order.",
            steps: ["Search for the idea and find three companies that tried it.", "Read what happened to them, in the founders' own words.", "Name the reason they failed.", "Ask whether your edge or your why-now answers that reason."],
            why: "Find them, read them, name the cause, then test yourself against it. An hour, and it is the best research you will do.",
          },
          {
            kind: "choose",
            prompt: "You find three dead companies that tried your idea. What does that mean?",
            options: [
              { text: "The idea is bad; drop it.", good: false, why: "Not necessarily. Ask why they died and whether that has changed." },
              { text: "Nothing; you will do it better.", good: false, why: "Everyone who tried thought that. Name what is different." },
              { text: "Find the cause of death and ask whether something has changed since. If nothing has, it is a tarpit; if something has, say what in one sentence.", good: true, why: "The check. The answer is a sentence, not a feeling." },
            ],
          },
        ],
        remember: "If it is easy to think of and nobody has made it work, find out why. If nothing has changed since, it is a tarpit.",
        apply: { key: "openQuestions", prompt: "Name three companies that tried something like your idea, and what happened to each. If you cannot find any, write that too.", hint: "One line each. This is the hour that saves the month." },
      },
    ],
  },
  {
    id: "founders",
    section: "foundations",
    n: 3,
    name: "Founders",
    line: "Who builds it, and whether they will still be there in a year.",
    guide: [
      "Founder-market fit: what you know, have done or have access to that puts you closer to this problem than a stranger. It is the edge, seen from the person's side.",
      "Co-founders: YC's advice runs against the common advice. Choose someone you would want as a friend; similar people get along, and getting along matters more than complementary skills. Ask whether they would start a good company with or without you.",
      "Equity: split it equally or close to it. Vest over four years with a one-year cliff, even alone. Being the one who had the idea is not worth a bigger share; the idea is the least of the work.",
      "Alone is allowed. It is harder, and the building is designed for it.",
    ],
    lessons: [
      {
        id: "founder-fit",
        n: 1,
        title: "Founder-market fit",
        minutes: 4,
        objective: "Say what puts you closer to this problem than a stranger, and be honest when the answer is nothing yet.",
        teach: [
          "Founder-market fit is the edge from the founder's side. What do you know, have done, or have access to that makes you the right person for this problem? You have lived it. You worked in it. You are in the group. You can build it yourself. You know the twenty people who would be the first customers.",
          "It matters because a start-up is a search, and searching goes faster when you already know the territory. A founder who has never met the customer starts every conversation from zero. One who was the customer starts from ten conversations in.",
          "It is fine to have little of it yet. The honest move is to say so and to go and get some: spend a month inside the problem, take the job, join the group, become the customer. Fit can be built. Pretending to have it cannot.",
        ],
        example: [
          { label: "Fit", text: "Ran a café for four years. Knows every owner on the street. Kept the regulars in a notebook himself." },
          { label: "Not yet", text: "Thinks cafés are a nice market. Has not run one or talked to anyone who has." },
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Which of these is founder-market fit?",
            buckets: ["Fit", "Not fit, yet"],
            items: [
              { text: "I was a nurse for eight years and this is the form we all hated.", bucket: 0, why: "Lived it. Knows the problem from inside." },
              { text: "I am a strong developer and this seems like a big market.", bucket: 1, why: "Can build; does not know the customer. Buildable is one of three tests, not all of them." },
              { text: "My parents run the kind of shop this is for, and I did the books for them.", bucket: 0, why: "Access, and first-hand knowledge of the problem." },
              { text: "I read a lot about this industry.", bucket: 1, why: "Reading is not the same as having met the problem." },
            ],
          },
          {
            kind: "choose",
            prompt: "You have an idea for a problem you have never personally had. What is the honest next step?",
            options: [
              { text: "Build it anyway; you can learn as you go.", good: false, why: "You will learn, slowly, at the cost of the product." },
              { text: "Spend a month inside the problem first: take the job, join the group, become the customer.", good: true, why: "Fit can be built. A month inside is worth more than a year of guessing from outside." },
              { text: "Find a co-founder who has the problem and let them handle it.", good: false, why: "Better than nothing, and a good co-founder is a good idea. But a founder who does not understand the customer is a founder who cannot make decisions about them." },
            ],
          },
          {
            kind: "fill",
            prompt: "A founder who was the customer starts every conversation from ___.",
            options: ["zero", "ten conversations in", "a position of authority", "the product"],
            answer: 1,
            why: "They already know what is true. They are checking, not discovering.",
          },
          {
            kind: "choose",
            prompt: "Why does founder-market fit matter more for a start-up than for, say, a shop?",
            options: [
              { text: "Because investors ask about it.", good: false, why: "They do. That is downstream of why it matters." },
              { text: "Because a start-up is a search, and searching is faster when you already know the territory.", good: true, why: "The whole early stage is finding things out. Knowing the customer is a head start on all of it." },
              { text: "It does not; it matters equally for both.", good: false, why: "A shop executes a known model. A start-up has to find one." },
            ],
          },
        ],
        remember: "Know what puts you closer to this problem than a stranger. If nothing yet, go and get it: a month inside beats a year outside.",
        apply: { key: "founderFit", prompt: "Write what you know, have done, or have access to that a stranger does not. If the honest answer is little, write what you will do this month to change that.", hint: "Two or three lines. Honesty here saves months." },
      },
      {
        id: "cofounders",
        n: 2,
        title: "Co-founders, and being alone",
        minutes: 5,
        objective: "Choose a co-founder for the right reasons, or choose to be alone with your eyes open.",
        teach: [
          "The common advice is to find a co-founder with complementary skills: you do product, they do sales. Y Combinator, having watched thousands of founding teams, says something different. The teams that work are the ones who like each other. Similar people get along; getting along, over years of bad weeks, matters more than a neat division of labour.",
          "Their two questions. Would I want to be friends with this person? If not, no amount of skill fixes the years ahead. And: would this person start a good company with or without me? You want someone who would, and who chose you.",
          "Alone is allowed. YC prefers two, because two is more resilient and faster, and because one person's bad month is the company's bad month. But plenty of real companies were started by one person, and this building was built for that person. If you are alone, know the cost — nobody to argue with, nobody to carry a week — and build habits that stand in for a partner: a weekly review, someone you report to, a coach.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "According to YC, what matters most in a co-founder?",
            options: [
              { text: "Skills that complement yours.", good: false, why: "The common advice, and not what the data says. Skills can be hired; liking each other cannot." },
              { text: "Whether you would want to be friends with them.", good: true, why: "The teams that last are the ones who get on. Years of bad weeks test that, not the org chart." },
              { text: "Whether they have raised money before.", good: false, why: "Nice to have. Not the thing." },
            ],
          },
          {
            kind: "sort",
            prompt: "Good reason or bad reason to take a co-founder?",
            buckets: ["Good reason", "Bad reason"],
            items: [
              { text: "I would happily spend a weekend with them, and they would start something good without me.", bucket: 0, why: "Both of YC's questions, answered yes." },
              { text: "I need someone technical and they can code.", bucket: 1, why: "A hire, not a partner. Ask the friendship question first." },
              { text: "Everyone says you need two founders.", bucket: 1, why: "Everyone is not going to be in the room in year two." },
              { text: "We have worked together before, through a hard project, and still want to.", bucket: 0, why: "The best evidence there is." },
            ],
          },
          {
            kind: "fill",
            prompt: "YC's second question about a possible co-founder: would this person start a good company ___?",
            options: ["with a big budget", "with or without me", "in this industry", "after raising money"],
            answer: 1,
            why: "You want someone who would, and who chose you. That is a partner; the alternative is a passenger.",
          },
          {
            kind: "choose",
            prompt: "You are building alone. What does this lesson say to do about it?",
            options: [
              { text: "Find any co-founder quickly so you are not alone.", good: false, why: "The wrong co-founder is worse than none. Take the friendship question seriously or stay alone." },
              { text: "Know the cost, and build habits that stand in for a partner: a weekly review, someone you report to, a coach.", good: true, why: "Alone is allowed. Alone without structure is how weeks disappear." },
              { text: "Nothing; solo founders are just as likely to succeed.", good: false, why: "They are less likely, and pretending otherwise is not a plan. The habits are." },
            ],
          },
        ],
        remember: "Choose a co-founder you would want as a friend, who would build something good without you. Alone is allowed, with habits that stand in for a partner.",
        apply: { key: "cofounders", prompt: "Alone, or with whom? If with someone, answer YC's two questions about them honestly. If alone, name the habit that stands in for a partner.", hint: "Two or three lines." },
      },
      {
        id: "equity-and-vesting",
        n: 3,
        title: "Equity and vesting",
        minutes: 5,
        objective: "Split equity fairly and set up vesting, and explain why the idea is not worth a bigger share.",
        teach: [
          "Equity is ownership: what share of the company each founder holds. YC's advice is to split it equally, or close to it. The instinct to give the person who had the idea more is wrong for a simple reason: the idea is the least of the work. Execution over years is what the shares are for, and dramatically unequal splits leave one founder wondering, in year two, why they are doing the same work for half the reward.",
          "Vesting means the shares are earned over time rather than owned on day one. The standard is four years with a one-year cliff: nothing until the first anniversary, then a quarter, then the rest month by month. If a founder leaves after eight months, they leave with nothing, and the company is not carrying a stranger who owns a third of it. Do this even if you are alone; investors will ask for it anyway, and the version you set up calmly is better than the one you set up under pressure.",
          "None of this is legal advice. The words are the standard ones and the shape is the standard shape; the document that makes it real is written by a lawyer or a service in your country. Check the official source.",
        ],
        exercises: [
          {
            kind: "fill",
            prompt: "The standard founder vesting is ___ with a one-year cliff.",
            options: ["one year", "two years", "four years", "ten years"],
            answer: 2,
            why: "Four years. Nothing at eight months, a quarter at twelve, then monthly.",
          },
          {
            kind: "choose",
            prompt: "Two founders. One had the idea; both will work on it full time. YC's advice on the split?",
            options: [
              { text: "70/30 to the one with the idea.", good: false, why: "The idea is the least of the work. Year two will ask why the same work earns half." },
              { text: "Equal, or close to it.", good: true, why: "Execution over years is what the shares reward, and both are executing." },
              { text: "Decide later, once you see who works harder.", good: false, why: "Later is when it is hardest to have this conversation. Have it now, and vest it." },
            ],
          },
          {
            kind: "choose",
            prompt: "A co-founder leaves after eight months. With standard vesting, what do they leave with?",
            options: [
              { text: "Eight twelfths of their shares.", good: false, why: "That is what vesting without a cliff would do. The cliff is the point." },
              { text: "Nothing, because the one-year cliff has not been reached.", good: true, why: "The cliff exists exactly for this case: a company should not carry a stranger who owns a third of it." },
              { text: "All of their shares; they were a founder.", good: false, why: "Without vesting, yes. That is why you vest." },
            ],
          },
          {
            kind: "sort",
            prompt: "True or false, according to this lesson?",
            buckets: ["True", "False"],
            items: [
              { text: "Vesting only matters if you have co-founders.", bucket: 1, why: "Set it up alone too. Investors will ask, and calm is better than pressure." },
              { text: "The lesson's words are the standard ones, but the document needs a lawyer or a service in your country.", bucket: 0, why: "Check the official source. This is the shape, not the paper." },
              { text: "Unequal splits are fine as long as everyone agrees at the start.", bucket: 1, why: "Everyone agrees at the start. The trouble is year two." },
            ],
          },
        ],
        remember: "Split equally or close to it. Four years, one-year cliff, even alone. The idea is the least of the work.",
        apply: { key: "cofounders", prompt: "Add a line: how equity is or would be split, and whether vesting is set up. If not, when.", hint: "Add to what you wrote in the last lesson." },
      },
      {
        id: "depth-founder-conflict",
        n: 4,
        title: "Depth: what actually breaks founding teams",
        depth: true,
        minutes: 5,
        objective: "Name the three things that break founding teams, and set up the one conversation that prevents most of it.",
        teach: [
          "Not the right team is on the CB Insights list at 23%. It rarely means the founders were not clever. It means they did not agree about something and found out too late. Three things come up over and over: how much each person is putting in, what each person wants out, and who decides when they disagree.",
          "The fix is a conversation before it matters, written down. How many hours a week, and for how long before this has to pay you? What does success look like — a lifestyle business at year three, or a raise and a swing? When we cannot agree, who has the final say, and on what? Founders who have this conversation early still fight; they just fight about the right things.",
          "One more: the co-founder who is half in. Keeping a job while the other founder goes full time is a slow poison, because the shares are equal and the risk is not. Either both are in, or the split and the vesting reflect that one is not, and everyone knows.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "\"Not the right team\" most often means:",
            options: [
              { text: "The founders were not skilled enough.", good: false, why: "Sometimes. Rarely the cause of the break-up." },
              { text: "The founders disagreed about commitment, goals or decisions and found out late.", good: true, why: "The three things. Found out late is the killer." },
              { text: "The founders were too similar.", good: false, why: "YC's data says similar teams do better." },
            ],
          },
          {
            kind: "order",
            prompt: "Put the founder conversation's three questions in the order this lesson gives them.",
            steps: ["How much is each of us putting in, and for how long before it has to pay?", "What does success look like for each of us?", "Who decides when we disagree, and about what?"],
            why: "Commitment, goal, decision. The first sets the stakes, the second the direction, the third the way through the fights that will come anyway.",
          },
          {
            kind: "choose",
            prompt: "One founder is full time; the other keeps a job \"until it takes off\". Equal shares. What does this lesson say?",
            options: [
              { text: "Fine; the part-timer will catch up.", good: false, why: "Equal shares, unequal risk, and a slow poison." },
              { text: "Either both are in, or the split and the vesting say plainly that one is not.", good: true, why: "The arrangement can be fair. It cannot be equal and unequal at once." },
              { text: "The full-timer should quit too so it is fair.", good: false, why: "That reverses it. The point is that the paper matches the reality, whichever reality it is." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these is a founder conversation to have now, and which can wait?",
            buckets: ["Now", "Can wait"],
            items: [
              { text: "What each of us wants this to be in three years.", bucket: 0, why: "Goal. If they differ, better to know before year two." },
              { text: "Which colour the logo should be.", bucket: 1, why: "Nobody has broken up over it. Probably." },
              { text: "Who has the final say on product, and who on money.", bucket: 0, why: "Decision. The fights will come; this is how you get through them." },
              { text: "Office or remote in year three.", bucket: 1, why: "Year three can decide that." },
            ],
          },
        ],
        remember: "Teams break on commitment, goals and decisions, found out late. Have the conversation now and write it down.",
        apply: { key: "cofounders", prompt: "Add the answers to the three questions: hours and horizon, what success looks like, who decides what. Alone? Answer the second one for yourself.", hint: "Add to what you wrote. Short answers are fine." },
      },
    ],
  },
];
