/**
 * SECTION 2: THE CUSTOMER.
 *
 * Talking to people, the problem, and evidence. The longest section
 * relative to its length in most courses, because this is where the
 * 42% is decided. Two units point at the journey missions that record
 * the real-world work.
 */
import type { Unit } from "../content.ts";

export const CUSTOMER: Unit[] = [
  {
    id: "problem",
    section: "customer",
    n: 4,
    name: "The problem",
    line: "Not what you want to build. What is hard, for whom, and what they do about it today.",
    missions: ["the-problem"],
    guide: [
      "A problem has a person, a moment, and a cost. \"Café owners lose regulars on quiet days and do not notice until the month is over\" has all three. \"Customer retention\" has none.",
      "The workaround is what they do today instead of your thing. If there is no workaround, either the problem is not painful or it is not theirs. The workaround also tells you what they are willing to pay: whatever the workaround costs them in money and time.",
      "Frequency times intensity. A problem people meet every day and mildly hate, or rarely and badly, can both work. One they meet rarely and mildly cannot.",
      "Early adopters are the people who have the problem worst and have already tried to solve it. Sell to them first; they will forgive an unfinished thing because it beats their spreadsheet.",
    ],
    lessons: [
      {
        id: "person-moment-cost",
        n: 1,
        title: "A person, a moment, a cost",
        minutes: 4,
        objective: "Write a problem statement with a real person, a specific moment, and a cost in it.",
        teach: [
          "A problem statement that works has three parts. A person: not a segment, a kind of person you could point at. A moment: when the problem actually happens. A cost: what it takes from them, in money, time, or something they care about.",
          "\"Customer retention is a challenge for hospitality businesses\" has none of the three. It is true, and useless. \"Independent café owners lose regulars over the winter and only notice when the quarter's numbers come in, by which point three of them have found somewhere else\" has all three, and you can already imagine asking someone about it.",
          "The cost matters most, because it tells you what the problem is worth. A problem that costs somebody forty minutes a week is worth roughly forty minutes a week to them. A problem that costs them a customer is worth a customer.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Which problem statement has a person, a moment and a cost?",
            options: [
              { text: "Small businesses struggle with customer loyalty.", good: false, why: "No person you could point at, no moment, no cost." },
              { text: "Owners of independent cafés lose regulars over the winter and only notice when the quarter's numbers arrive, by which time some have gone for good.", good: true, why: "A kind of person, a season and a moment of noticing, and a cost in lost customers." },
              { text: "Cafés need better software.", good: false, why: "A solution wearing a problem's coat." },
            ],
          },
          {
            kind: "match",
            prompt: "Match each piece of the problem statement to the question it answers.",
            pairs: [
              { term: "The person", meaning: "Who, specifically, could you point at?" },
              { term: "The moment", meaning: "When does it actually happen?" },
              { term: "The cost", meaning: "What does it take from them, in money, time or something they care about?" },
            ],
          },
          {
            kind: "edit",
            prompt: "Add a person, a moment and a cost to this.",
            before: "Parents find it hard to keep track of school events.",
            better: ["A specific kind of parent, not 'parents'.", "A moment when it goes wrong: a missed form, a missed day.", "What it cost them: a phone call, a fine, an upset child."],
          },
          {
            kind: "fill",
            prompt: "The cost matters most because it tells you what the problem is ___.",
            options: ["called", "worth", "caused by", "solved by"],
            answer: 1,
            why: "A problem is worth roughly what it costs the person who has it. That is your first clue about price.",
          },
        ],
        remember: "A person, a moment, a cost. If the sentence has all three, you can ask someone about it.",
        apply: { key: "problem", prompt: "Rewrite your problem statement with all three: a kind of person you could point at, the moment it happens, and what it costs them.", hint: "It replaces the earlier version. Keep the old one in the history." },
      },
      {
        id: "the-workaround",
        n: 2,
        title: "The workaround",
        minutes: 4,
        objective: "Find out what people do about the problem today, and read what that tells you about pain and price.",
        teach: [
          "A real problem already has a workaround. A spreadsheet. A cousin who helps. A notebook. A competitor's product they grumble about. Doing nothing and living with it — which is also a workaround, and the most common one.",
          "The workaround tells you two things. First, whether the problem is real for them: if someone has built a spreadsheet to manage it, it is real. If nobody has done anything about it, it may be real to you and not to them. Second, roughly what they will pay: a workaround has a cost in time and money, and your thing has to beat that cost by enough to be worth the bother of switching.",
          "\"Doing nothing\" is the most informative answer, and the most dangerous. It can mean the problem is not painful. It can also mean nobody has offered a way out. The difference is in how they talk about it: with a shrug, or with a sigh.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Which of these workarounds says the problem is real and painful?",
            buckets: ["Real and painful", "Probably not painful"],
            items: [
              { text: "She built a spreadsheet, updates it every Sunday, and hates it.", bucket: 0, why: "Effort spent every week. The pain is real." },
              { text: "He says he has never really thought about it.", bucket: 1, why: "No workaround, no sigh. It may be your problem, not his." },
              { text: "They pay a part-timer two hours a week to do it by hand.", bucket: 0, why: "Money spent. Also your first clue about price." },
              { text: "They tried an app once, gave up, and shrugged.", bucket: 1, why: "Tried and shrugged. The pain was smaller than the bother." },
            ],
          },
          {
            kind: "choose",
            prompt: "A shop pays a part-timer two hours a week, at twelve euros an hour, to do the thing your product would do. What does that tell you about price?",
            options: [
              { text: "Nothing; price is a separate question.", good: false, why: "It is the first real number you have about what this problem is worth to them." },
              { text: "They already spend about a hundred euros a month on this problem, so a price under that is not a stretch — if yours beats the part-timer by enough to switch.", good: true, why: "The workaround's cost is the ceiling and the comparison." },
              { text: "You should charge a hundred euros a month.", good: false, why: "Maybe. The workaround gives you the ceiling, not the answer. Switching has a cost too." },
            ],
          },
          {
            kind: "choose",
            prompt: "Two people say they do nothing about the problem. One shrugs; one sighs. What is the difference?",
            options: [
              { text: "None; doing nothing is doing nothing.", good: false, why: "The shrug and the sigh are the whole difference." },
              { text: "The shrug says it is not painful to them. The sigh says nobody has offered a way out yet.", good: true, why: "Same words, opposite data. Ask the sigher what they have tried." },
              { text: "The sigher is being polite.", good: false, why: "Possibly. Ask about the last time it happened and find out." },
            ],
          },
          {
            kind: "fill",
            prompt: "Your thing has to beat the workaround's cost by enough to be worth the ___ of switching.",
            options: ["risk", "bother", "price", "time"],
            answer: 1,
            why: "Switching is itself a cost. A small improvement on a working spreadsheet loses to the spreadsheet.",
          },
        ],
        remember: "Find the workaround. It tells you whether the pain is real and roughly what it is worth.",
        apply: { key: "workaround", prompt: "Write what the people you have talked to do about the problem today, and what it costs them in time or money.", hint: "Their words where you have them. If nobody does anything, write whether they shrugged or sighed." },
      },
      {
        id: "early-adopters",
        n: 3,
        title: "Early adopters",
        minutes: 4,
        objective: "Identify the people who will pay for an unfinished thing, and say why they are the only ones who will.",
        teach: [
          "Most people will not buy a new thing from a company nobody has heard of. That is fine; you are not selling to most people yet. You are selling to early adopters: the people who have the problem worst, know they have it, and have already tried to fix it. They will forgive an unfinished product because it beats their spreadsheet.",
          "You can recognise them by the workaround. Anyone who has built something, paid someone, or switched tools twice is an early adopter. Anyone who shrugs is not, and no amount of polish will change that this year.",
          "The trap is designing for the majority too early. The majority wants a finished, safe, recommended product; you cannot give them that yet, and trying to makes the product bland for the people who would actually buy it. Build for the sigher with the spreadsheet. The majority arrives later, following the early adopters.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Early adopter, or not yet?",
            buckets: ["Early adopter", "Not yet"],
            items: [
              { text: "Runs three cafés, keeps a shared spreadsheet, has tried two apps and switched back.", bucket: 0, why: "Has the problem worst, has tried, still looking." },
              { text: "Runs one café, says things are fine, would want to see reviews first.", bucket: 1, why: "The majority. Arrives later, following the others." },
              { text: "Pays a niece to text regulars every month.", bucket: 0, why: "Paying to solve it. Will pay you if you beat the niece." },
              { text: "Thinks the idea is interesting but has no particular problem with regulars.", bucket: 1, why: "Interested is not the same as having the problem." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why will an early adopter accept an unfinished product?",
            options: [
              { text: "Because they like new things.", good: false, why: "Some do. That is not why they pay." },
              { text: "Because it beats the workaround they are suffering with now.", good: true, why: "An unfinished thing that is better than a hated spreadsheet is a good deal to them." },
              { text: "Because it is cheap.", good: false, why: "Early adopters often pay more, not less. They are buying relief." },
            ],
          },
          {
            kind: "choose",
            prompt: "What goes wrong when you design for the majority too early?",
            options: [
              { text: "You run out of money faster.", good: false, why: "Possibly, but the deeper problem is who you end up building for." },
              { text: "The product becomes bland for the people who would actually buy it now, and the majority still will not buy until others have.", good: true, why: "You lose the early adopters and do not gain the majority. The worst of both." },
              { text: "Nothing; a bigger market is always better.", good: false, why: "It is better later. Now it is empty." },
            ],
          },
          {
            kind: "fill",
            prompt: "You can recognise an early adopter by their ___.",
            options: ["age", "workaround", "budget", "enthusiasm"],
            answer: 1,
            why: "Anyone who has built, paid or switched to deal with the problem. Enthusiasm is a compliment; a workaround is evidence.",
          },
        ],
        remember: "Sell first to the people who have it worst and have already tried to fix it. The majority follows them.",
        apply: { key: "customerGroup", prompt: "Narrow your group to its early adopters: the ones with the worst version of the problem and a workaround. Describe them in one line.", hint: "This replaces the wedge line if it is narrower. Keep the old one in the history." },
      },
      {
        id: "depth-frequency-intensity",
        n: 4,
        title: "Depth: frequency, intensity, and jobs",
        depth: true,
        minutes: 5,
        objective: "Judge a problem by how often and how badly it happens, and see the job the customer is hiring your product to do.",
        teach: [
          "Two dials on any problem. Frequency: how often it happens. Intensity: how much it hurts when it does. Every day and mildly annoying can work — that is most software. Twice a year and terrible can work — that is tax. Twice a year and mildly annoying cannot: nobody changes their habits for that, however elegant the fix.",
          "Ask both dials directly, about the past. \"How often did this happen last month?\" \"The last time it happened, what did it cost you?\" You are placing the problem on a chart, and the chart tells you whether a business can live there.",
          "One more lens, from Clayton Christensen: people hire products to do a job. Nobody wants a drill; they want a hole, and behind the hole, a shelf, and behind the shelf, a tidy room. The job is the reason under the reason. Ask \"what were you trying to get done?\" and \"what would have happened if you hadn't?\" and you will hear it. The job is more stable than the feature list, and it is what you are actually selling.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Can a business live here? Place each problem.",
            buckets: ["A business can live here", "Probably not"],
            items: [
              { text: "Every weekday, twenty minutes of retyping. Mildly annoying.", bucket: 0, why: "High frequency, low intensity. Most software lives here." },
              { text: "Once a year, a fine of two thousand euros for a missed filing.", bucket: 0, why: "Low frequency, high intensity. Tax software lives here." },
              { text: "A couple of times a year, a slightly awkward moment splitting a bill.", bucket: 1, why: "Low and low. Nobody changes their habits for this. A famous tarpit." },
              { text: "Every winter, three regulars quietly stop coming.", bucket: 0, why: "Seasonal, and it costs real customers. Intensity carries it." },
            ],
          },
          {
            kind: "match",
            prompt: "Match the question to the dial it measures.",
            pairs: [
              { term: "\"How often did this happen last month?\"", meaning: "Frequency" },
              { term: "\"The last time it happened, what did it cost you?\"", meaning: "Intensity" },
              { term: "\"What were you trying to get done, and what if you hadn't?\"", meaning: "The job" },
            ],
          },
          {
            kind: "choose",
            prompt: "\"Nobody wants a drill; they want a hole.\" What is the point?",
            options: [
              { text: "Sell holes, not drills.", good: false, why: "Cute, but the point is about understanding, not the product." },
              { text: "The job under the request is what the customer is actually buying, and it is more stable than any feature they ask for.", good: true, why: "Ask what they were trying to get done. That is what you sell, whatever you build." },
              { text: "Customers do not know what they want.", good: false, why: "They know what they want. They describe it as a drill." },
            ],
          },
          {
            kind: "choose",
            prompt: "A problem is rare and mild. Someone suggests a beautifully designed app for it. This lesson says:",
            options: [
              { text: "Design can make people care.", good: false, why: "Design can make people notice. It cannot make a shrug into a sigh." },
              { text: "Nobody changes a habit for a rare, mild problem, however elegant the fix.", good: true, why: "Both dials low. The chart says no." },
              { text: "Make it free and they will use it.", good: false, why: "Free things for rare mild problems get downloaded and forgotten." },
            ],
          },
        ],
        remember: "How often, how badly, and what job it is really doing. Rare and mild is where ideas go to die.",
        apply: { key: "problem", prompt: "Add two lines under your problem: how often it happens (from what people told you) and what it cost the last time. Then the job: what were they trying to get done?", hint: "Numbers where you have them." },
      },
    ],
  },
  {
    id: "talking",
    section: "customer",
    n: 5,
    name: "Talking to people",
    line: "How to ask so that even someone who loves you cannot lie to you.",
    missions: ["good-questions", "find-them", "record-one"],
    guide: [
      "Three rules from Rob Fitzpatrick's The Mom Test. Talk about their life, not your idea. Ask about specifics in the past, not opinions about the future. Talk less; listen more.",
      "Three kinds of bad data: compliments (\"that's a great idea\"), fluff (generics, hypotheticals, \"I would definitely\"), and ideas (feature requests you now feel obliged to build). Collect facts and commitments instead.",
      "A good meeting ends in a commitment — time, reputation or money — or an advancement to a concrete next step. \"Sounds great, keep me posted\" is a failure that felt like a success.",
      "Five real conversations beat fifty survey responses. You are looking for the shape of a problem, not a percentage.",
    ],
    lessons: [
      {
        id: "their-life-not-your-idea",
        n: 1,
        title: "Their life, not your idea",
        minutes: 4,
        objective: "Ask about a person's life and past behaviour instead of describing your idea and asking what they think.",
        teach: [
          "People are kind. Describe your idea and ask if they would use it, and most will say yes to be nice — especially your mum, which is where the book gets its name. You learn nothing, and you feel great, which is worse than learning nothing.",
          "So you do not describe the idea. You ask about their life. When did this last happen to you? What did you do? What was annoying about that? How much did it cost you, in money or time? Questions about things that already happened cannot be answered politely; they can only be answered truthfully or not at all.",
          "The second rule follows from the first: specifics in the past, not opinions about the future. \"Would you pay for this?\" is a question about an imaginary future in which they are generous. \"What did you pay last time?\" is a fact.",
        ],
        example: [
          { label: "Contaminated", text: "I'm building an app that brings café regulars back on quiet days. Would you use something like that?" },
          { label: "Clean", text: "Tell me about your last quiet week. What did you do about it, if anything?" },
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Which questions are about their life and past, and which are about your idea and the future?",
            buckets: ["Their life, the past", "Your idea, the future"],
            items: [
              { text: "When did you last lose a regular customer, and how did you notice?", bucket: 0, why: "A thing that happened. It has a true answer." },
              { text: "Would you pay ten euros a month for this?", bucket: 1, why: "An imaginary future in which they are generous." },
              { text: "Walk me through what you did the last time a week was quiet.", bucket: 0, why: "Past, specific, and it can surprise you." },
              { text: "Do you think cafés need a loyalty app?", bucket: 1, why: "An opinion about a category, worth exactly nothing." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why is \"that's a great idea, I'd definitely use it\" worthless as evidence?",
            options: [
              { text: "Because they might be lying.", good: false, why: "They are not lying. They are being kind, which is different and just as useless." },
              { text: "Because it is a polite opinion about an imaginary future, and it costs them nothing to say.", good: true, why: "No fact, no commitment, no cost. The three things evidence needs." },
              { text: "Because one person's view does not matter.", good: false, why: "One person's real behaviour matters a lot. One person's compliment does not." },
            ],
          },
          {
            kind: "edit",
            prompt: "Rewrite this question so it is about their life and the past.",
            before: "Would you use an app that reminds you to reorder bread before you run out?",
            better: ["There is no product in it.", "It asks about something that already happened, and when.", "The person could answer it in a way that disappoints you."],
          },
          {
            kind: "fill",
            prompt: "Ask about specifics in the ___, not opinions about the future.",
            options: ["market", "past", "abstract", "industry"],
            answer: 1,
            why: "What they did is a fact. What they would do is a mood.",
          },
        ],
        remember: "Talk about their life, not your idea. Ask what happened, not what they would do.",
        apply: { key: "questions", prompt: "Write three questions you will actually ask, each about something that already happened to the person.", hint: "\"When did you last…\", \"What did you do about…\", \"What did that cost you…\"" },
      },
      {
        id: "bad-data",
        n: 2,
        title: "Compliments, fluff and ideas",
        minutes: 5,
        objective: "Spot the three kinds of bad data in a conversation and steer back to facts.",
        teach: [
          "Three things people say that feel like progress and are not. Compliments: \"I love it\", \"great idea\". Nice to hear; tells you nothing. Fluff: generics (\"I always\", \"everyone\"), hypotheticals (\"I would\"), and future promises (\"I'll definitely try it\"). And ideas: \"you should add…\", which you now feel obliged to build.",
          "Each has a steer. A compliment: deflect it and ask about the past. \"Thanks — when did this last actually happen to you?\" Fluff: anchor it to a specific instance. \"You said you always forget — tell me about the last time.\" An idea: dig for the problem behind it. \"Why would you want that? What would it let you do?\" The idea is a symptom; the problem underneath is the data.",
          "You will hear all three in every conversation. The skill is not avoiding them; it is noticing them in the moment and steering, gently, back to something that happened.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Compliment, fluff, or idea? Sort the bad data.",
            buckets: ["Compliment or fluff", "An idea"],
            items: [
              { text: "\"Honestly, I love this. Everyone I know would use it.\"", bucket: 0, why: "A compliment wrapped in a generic. Ask when it last happened to them." },
              { text: "\"You should add a loyalty stamp thing too.\"", bucket: 1, why: "A feature request. Dig for the problem: why would they want that?" },
              { text: "\"I'd definitely sign up when it launches.\"", bucket: 0, why: "A future promise that costs nothing. Ask what they pay for today." },
              { text: "\"It needs to work on the till, not on a phone.\"", bucket: 1, why: "An idea, and a useful one — but ask what happens at the till that makes them say it." },
            ],
          },
          {
            kind: "match",
            prompt: "Match each kind of bad data to its steer.",
            pairs: [
              { term: "A compliment", meaning: "Deflect it, and ask when this last actually happened to them." },
              { term: "Fluff (\"I always\", \"I would\")", meaning: "Anchor it: tell me about the last time." },
              { term: "An idea (\"you should add…\")", meaning: "Dig: why would you want that? What would it let you do?" },
            ],
          },
          {
            kind: "choose",
            prompt: "A café owner says: \"You should make it send a text to regulars automatically.\" What is the best next question?",
            options: [
              { text: "\"Great idea, I'll add it.\"", good: false, why: "You have just committed to building something because one person said a sentence." },
              { text: "\"What would that let you do that you can't do now? When did you last want to reach a regular and couldn't?\"", good: true, why: "The problem under the idea. That is the data." },
              { text: "\"Would you pay extra for that?\"", good: false, why: "A hypothetical about a feature that does not exist, asked of someone being helpful." },
            ],
          },
          {
            kind: "choose",
            prompt: "Which of these is the most useful thing a person can say in an interview?",
            options: [
              { text: "\"I love it.\"", good: false, why: "A compliment." },
              { text: "\"I'd use it every day.\"", good: false, why: "Fluff about the future." },
              { text: "\"Last Tuesday I spent forty minutes on this and I still got it wrong.\"", good: true, why: "A specific, past, costed fact. That is what you came for." },
            ],
          },
        ],
        remember: "Compliments, fluff and ideas feel like progress. Steer each one back to something that happened.",
        apply: { key: "questions", prompt: "Add two follow-up questions you will use to steer: one for a compliment, one for a feature idea.", hint: "Add to your list." },
      },
      {
        id: "commitment",
        n: 3,
        title: "Commitment and advancement",
        minutes: 5,
        objective: "Tell a meeting that went well from one that only felt good, and ask for a commitment before it ends.",
        teach: [
          "The most dangerous meeting is the one that felt great. Everyone nodded, the coffee was good, and it ended with \"keep me posted\". Nothing happened. Fitzpatrick's rule: a meeting is a success only if it ends in a commitment or an advancement.",
          "A commitment is the person giving up something that matters to them. Time: a longer follow-up, a trial, a workshop. Reputation: an introduction to their boss or their colleagues, a public recommendation. Money: a deposit, a pre-order, a signed letter of intent. Each one is evidence, because it costs them.",
          "An advancement is the meeting moving to a concrete next step with a date. Not \"let's stay in touch\" but \"I'll bring the numbers on Thursday\". If you cannot get either, ask for one directly before you leave: \"Would you be willing to try this for a week and tell me what breaks?\" The answer, whichever way, is data.",
        ],
        example: [
          { label: "Felt good", text: "\"This is exactly what we need. Send me something when it's ready.\"" },
          { label: "Went well", text: "\"Come in Thursday and set it up on our till. If it works for a week I'll introduce you to the other two owners on the street.\"" },
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Commitment, or a polite ending?",
            buckets: ["A commitment", "A polite ending"],
            items: [
              { text: "\"I'll introduce you to my business partner tomorrow.\"", bucket: 0, why: "Reputation. They are putting their name to you." },
              { text: "\"Sounds great, keep me posted.\"", bucket: 1, why: "The most dangerous sentence in the book." },
              { text: "\"I'll pay for the first month now if you can set it up this week.\"", bucket: 0, why: "Money, and a date." },
              { text: "\"Let's definitely stay in touch about this.\"", bucket: 1, why: "Nothing given, nothing scheduled." },
            ],
          },
          {
            kind: "match",
            prompt: "Match each commitment to what the person is giving up.",
            pairs: [
              { term: "Agrees to a two-hour workshop next week", meaning: "Time" },
              { term: "Introduces you to their boss", meaning: "Reputation" },
              { term: "Pays a deposit", meaning: "Money" },
            ],
          },
          {
            kind: "choose",
            prompt: "The meeting is ending well and nobody has committed to anything. What do you do?",
            options: [
              { text: "Leave on a high note and follow up by email.", good: false, why: "The email will be answered with 'keep me posted', if at all." },
              { text: "Ask for one specific thing before you leave: a trial, an introduction, a date.", good: true, why: "The answer is data either way. A no now saves three weeks of hopeful emails." },
              { text: "Offer a discount to get them to say yes.", good: false, why: "Buying a yes with a discount tells you people like discounts." },
            ],
          },
          {
            kind: "fill",
            prompt: "A meeting is a success only if it ends in a commitment or an ___.",
            options: ["introduction", "advancement", "invoice", "email"],
            answer: 1,
            why: "An advancement: a concrete next step with a date. Introductions and invoices are kinds of commitment.",
          },
        ],
        remember: "\"Keep me posted\" is a failure that felt like success. Ask for time, reputation or money before you leave.",
        apply: { key: "questions", prompt: "Write the one ask you will make at the end of your next conversation: a trial, an introduction, or a date.", hint: "One sentence, in the words you will actually say." },
      },
      {
        id: "depth-how-many-and-who",
        n: 4,
        title: "Depth: how many, who, and what a survey cannot do",
        depth: true,
        minutes: 5,
        objective: "Decide how many conversations you need, choose who to have them with, and say why surveys come later.",
        teach: [
          "How many? Fewer than you think, more than you have had. Five real conversations will show you the shape of a problem; by ten you will hear the same things twice; by fifteen you should be surprised rarely. When the surprises stop, you have enough for now. The number is not a target; the surprise rate is.",
          "Who? Not friends, unless they are also the customer. Not the most enthusiastic person you know. The people who have the problem this month, especially the ones who have already tried to solve it — with a spreadsheet, a cousin, a competitor. They are the early adopters, and they are the only people who will pay for an unfinished thing.",
          "Why not a survey? A survey asks a hundred people the question you already know to ask. A conversation finds out what the question is. Surveys are for later, when you know what to count. Early, they produce percentages of answers to the wrong question, and the percentages look like evidence.",
          "One habit: write notes the same day, in their words, not yours. \"She keeps a paper list\" is a note. \"She needs my app\" is a conclusion wearing a note's clothes. The journey's mission six is where those notes go.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "How do you know you have had enough conversations for now?",
            options: [
              { text: "When you reach a round number, like twenty.", good: false, why: "The number is not the signal." },
              { text: "When you stop being surprised.", good: true, why: "When the tenth person says what the fourth said, the shape is clear. Go and test something." },
              { text: "When someone finally says yes to the idea.", good: false, why: "Someone will say yes to be nice on conversation one. That is not the point of the conversations." },
            ],
          },
          {
            kind: "sort",
            prompt: "Who should you talk to first?",
            buckets: ["Talk to them first", "Later, or not for this"],
            items: [
              { text: "A café owner who built her own spreadsheet of regulars and hates it.", bucket: 0, why: "Has the problem, has tried to solve it. An early adopter." },
              { text: "Your most enthusiastic friend, who thinks all your ideas are great.", bucket: 1, why: "Compliments on tap. Not data." },
              { text: "A café owner who says quiet days are 'just how it is'.", bucket: 0, why: "Talk to them too. Their indifference is real information about how painful the problem is." },
              { text: "A venture investor who likes the space.", bucket: 1, why: "Not a customer. Useful later for a different question." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why do surveys come after conversations, not before?",
            options: [
              { text: "Surveys are more expensive.", good: false, why: "They are cheaper. That is not the reason." },
              { text: "A survey asks the question you already know to ask; a conversation finds out what the question is.", good: true, why: "Early, you do not know what to count. Percentages of the wrong question look like evidence and are not." },
              { text: "People lie on surveys.", good: false, why: "They lie in conversations too. The difference is you can steer a conversation." },
            ],
          },
          {
            kind: "sort",
            prompt: "A note, or a conclusion dressed as one?",
            buckets: ["A note", "A conclusion"],
            items: [
              { text: "\"Keeps regulars in a paper notebook. Said quiet weeks are 'just how it is'.\"", bucket: 0, why: "Their words, the thing that happened." },
              { text: "\"She clearly needs a loyalty system.\"", bucket: 1, why: "Your idea, wearing her sentence." },
              { text: "\"Did not ask what the app looked like.\"", bucket: 0, why: "A thing that did not happen is still a note, if you were there." },
              { text: "\"Very interested, strong lead.\"", bucket: 1, why: "A feeling. What did she actually say or do?" },
            ],
          },
        ],
        remember: "Enough is when the surprises stop. Talk to people who have the problem and have tried to fix it. Surveys come later.",
        apply: { key: "route", prompt: "Name five people, or five places, where you will find people who have the problem and have already tried to solve it.", hint: "Closest first. One line each." },
      },
    ],
  },
  {
    id: "evidence",
    section: "customer",
    n: 6,
    name: "Evidence",
    line: "What you know, what you assume, and what you would have to see to stop.",
    missions: ["what-changes"],
    guide: [
      "An observation is something that happened that you could point to. An assumption is something that sounds true. Founders' problem statements are mostly assumptions, which is normal; mixing the two up is not.",
      "The riskiest assumption is the belief that, if wrong, ends the idea. Test it first, because it is where the 42% is. It is usually a version of 'people need this enough to pay'.",
      "A kill criterion is the result that would make you stop, written before you have results. Afterwards, everything looks like the result you wanted.",
      "One conversation proves nothing. Five that agree are a pattern. None of it is validation; validation is a word for what customers do with money and time.",
    ],
    lessons: [
      {
        id: "observation-vs-assumption",
        n: 1,
        title: "What you know and what you assume",
        minutes: 4,
        objective: "Separate observations from assumptions in your own notes, every time.",
        teach: [
          "An observation is a thing that happened that you could point to. A person said it, you watched it, a number exists. An assumption is a thing that sounds true. Both are fine to have. Confusing them is how a founder spends six months on a belief thinking it was a fact.",
          "The tell is in the words. \"Two of the five keep a paper list\" is an observation. \"Most café owners struggle with this\" is an assumption, because \"most\" is a guess unless you counted. \"People would pay about ten euros\" is an assumption until somebody has.",
          "Make it a habit: after every conversation, two columns. What did I actually see or hear? What do I now believe? The second column is your to-do list for the next conversation.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Observation or assumption?",
            buckets: ["Observation", "Assumption"],
            items: [
              { text: "Three of the seven owners I spoke to keep regulars in a notebook.", bucket: 0, why: "Counted, from conversations you had." },
              { text: "Café owners are too busy to use an app.", bucket: 1, why: "Sounds true. Has anyone said it, or watched one try?" },
              { text: "Nobody I spoke to asked what the product looked like.", bucket: 0, why: "A thing that did not happen, and you were there." },
              { text: "This would work even better for restaurants.", bucket: 1, why: "A belief about a group you have not talked to." },
            ],
          },
          {
            kind: "choose",
            prompt: "Which word in \"most café owners lose regulars in winter\" makes it an assumption?",
            options: [
              { text: "\"café\"", good: false, why: "A noun. Fine." },
              { text: "\"most\"", good: true, why: "A count you have not made. Say 'three of the seven I asked' and it becomes an observation." },
              { text: "\"winter\"", good: false, why: "A season. Fine, if that is what they said." },
            ],
          },
          {
            kind: "choose",
            prompt: "What is the assumptions column for?",
            options: [
              { text: "Things to delete; only facts matter.", good: false, why: "Assumptions are fine to have. They are what you test next." },
              { text: "Your to-do list for the next conversation.", good: true, why: "Each assumption is a question you have not asked yet." },
              { text: "Things to put in the pitch deck.", good: false, why: "Only if labelled. Investors can tell." },
            ],
          },
          {
            kind: "fill",
            prompt: "An observation is something you could ___.",
            options: ["believe", "point to", "argue", "predict"],
            answer: 1,
            why: "A person said it, you watched it, a number exists. If you cannot point to it, it is an assumption.",
          },
        ],
        remember: "Two columns after every conversation: what I saw, what I now believe. The second is next week's questions.",
        apply: { key: "known", prompt: "Write three things you have actually seen or heard about the problem, one per line. Then, under 'what you assume', three things you believe but have not checked.", hint: "If a line has 'most' or 'would' in it, it belongs in the second list." },
      },
      {
        id: "the-riskiest-assumption",
        n: 2,
        title: "The riskiest assumption",
        minutes: 4,
        objective: "Find the one belief that, if wrong, ends the idea, and put it first in line to be tested.",
        teach: [
          "Of all the things you assume, one matters most: the one that, if wrong, means the idea does not work at all. That is the riskiest assumption, and it goes first, because testing it costs a week and building on it costs a year.",
          "For most ideas it is some version of \"these people need this enough to pay for it\". Sometimes it is \"they can be reached\" or \"this can be built for what they will pay\" or \"they will change how they work to use it\". Find yours by asking: if this one turned out false, would anything else matter?",
          "Founders test the easy assumptions first because the easy ones are pleasant to test. \"Will the logo work in blue?\" is a question with a safe answer. \"Will anyone pay?\" is a question with a dangerous one. Ask the dangerous one first. It is the same amount of dangerous in a year, and far more expensive.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "For \"prepaid passes for cafés\", which is the riskiest assumption?",
            options: [
              { text: "That the app can be built in three months.", good: false, why: "If wrong, it takes five. The idea survives." },
              { text: "That café regulars will pay upfront for coffee they have not drunk yet.", good: true, why: "If wrong, there is no product, whatever you build." },
              { text: "That the colour scheme will appeal to café owners.", good: false, why: "If wrong, change the colours." },
            ],
          },
          {
            kind: "fill",
            prompt: "The test for the riskiest assumption: if this one turned out false, would ___?",
            options: ["investors mind", "anything else matter", "it be embarrassing", "the team stay"],
            answer: 1,
            why: "If nothing else would matter, that is the one. Test it first.",
          },
          {
            kind: "sort",
            prompt: "Which of these would end the idea if false, and which would just make it harder?",
            buckets: ["Would end it", "Would make it harder"],
            items: [
              { text: "Owners are willing to change how they take payment.", bucket: 0, why: "If they will not change, there is no way in." },
              { text: "The first version needs to work offline.", bucket: 1, why: "Harder, not fatal." },
              { text: "Regulars exist in enough numbers per café to matter.", bucket: 0, why: "If each café has two regulars, the maths never works." },
              { text: "A competitor launches something similar next year.", bucket: 1, why: "A problem for later, and not one that makes the need go away." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why do founders tend to test the easy assumptions first?",
            options: [
              { text: "Because they are more important.", good: false, why: "They are less important. That is why they are easy." },
              { text: "Because the easy ones have safe answers, and the dangerous one might say no.", good: true, why: "It might. Better to hear it in week one than in month twelve." },
              { text: "Because investors ask about them.", good: false, why: "Investors ask about the dangerous one. So should you." },
            ],
          },
        ],
        remember: "Find the belief that ends the idea if it is wrong. Test that one first; it is the same danger in a year and far more expensive.",
        apply: { key: "riskiest", prompt: "Write your riskiest assumption in one sentence, and under it, the cheapest way you could test it this month.", hint: "Usually a version of 'people need this enough to pay'." },
      },
      {
        id: "kill-criteria",
        n: 3,
        title: "Write the stop before you start",
        minutes: 4,
        objective: "Set a kill criterion — the result that would make you stop — before running any test.",
        teach: [
          "Decide what would count as a bad result before you see any results. Afterwards, every result looks like the one you wanted; the mind is good at that. A kill criterion is the sentence that stops it: \"If fewer than three of the ten say yes to a paid trial by the end of the month, I stop this version.\"",
          "It has three parts: a number, a date, and what you will do. Not \"if it doesn't go well\" — a number. Not \"eventually\" — a date. Not \"I'll think again\" — an action: stop, change the offer, change the group. Write it where you will see it again, and tell one person, so that when the date comes you cannot quietly move it.",
          "This is not pessimism. It is the opposite: a founder with a kill criterion can run a test wholeheartedly, because they have already decided what a no looks like and do not have to protect themselves from it while they work.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Which of these is a kill criterion?",
            options: [
              { text: "If it doesn't seem to be working, I'll reconsider.", good: false, why: "No number, no date, no action. It will always seem to be almost working." },
              { text: "If fewer than three of ten café owners agree to a paid two-week trial by 30 October, I stop this version and change the offer.", good: true, why: "A number, a date, an action." },
              { text: "I'll give it a year and see.", good: false, why: "A date with no number. A year of 'almost'." },
            ],
          },
          {
            kind: "order",
            prompt: "Put the three parts of a kill criterion in the order this lesson gives them.",
            steps: ["A number", "A date", "What you will do"],
            why: "How much, by when, then what. Missing any one of them and the criterion can be quietly moved.",
          },
          {
            kind: "choose",
            prompt: "Why tell one other person your kill criterion?",
            options: [
              { text: "For accountability theatre.", good: false, why: "Not theatre. A witness." },
              { text: "So that when the date arrives, you cannot quietly move it.", good: true, why: "You will want to. A witness makes the wanting visible." },
              { text: "So they can talk you out of it.", good: false, why: "They might. That is a different conversation, and a fair one, but it is not why you tell them." },
            ],
          },
          {
            kind: "sort",
            prompt: "True or false?",
            buckets: ["True", "False"],
            items: [
              { text: "A kill criterion means you expect to fail.", bucket: 1, why: "It means you have decided what failure looks like, so you can work without protecting yourself from it." },
              { text: "Afterwards, results tend to look like the result you wanted.", bucket: 0, why: "The mind is good at this. The criterion is the defence." },
              { text: "A kill criterion should never be changed.", bucket: 1, why: "It can be changed, out loud, with a reason, before the date. Not quietly on the day." },
            ],
          },
        ],
        remember: "A number, a date, an action, written before the results and told to one person.",
        apply: { key: "killCriterion", prompt: "Write your kill criterion for the riskiest assumption: a number, a date, and what you will do.", hint: "Then tell one person. Write their name here too." },
      },
      {
        id: "depth-what-evidence-proves",
        n: 4,
        title: "Depth: what a conversation proves, and what \"validated\" means",
        depth: true,
        minutes: 5,
        objective: "Weigh evidence honestly — one conversation, five, a pattern — and never call an idea validated because it sounds persuasive.",
        teach: [
          "One conversation proves nothing. It can disprove something — one person who says \"I tried that and stopped because…\" is worth a lot — but one yes is one polite person. Five conversations that agree are a pattern, and a pattern is worth acting on: not by building, by testing.",
          "\"Validated\" is a word people use to mean \"I feel good about this now\". It should mean something narrower: customers did something that cost them, and enough of them did it that you would expect the next ten to do the same. Money and time, from strangers, repeatedly. Everything short of that is encouraging, and encouraging is not validated.",
          "The honest ladder. A compliment: nothing. A story about the past: a fact. Five facts that agree: a pattern. A commitment: evidence. Five commitments from strangers: the beginning of validation. A stranger paying, and paying again next month: validation of that one thing, for that kind of stranger. Know which rung you are on, and say it plainly, including to yourself.",
        ],
        exercises: [
          {
            kind: "order",
            prompt: "Put the ladder of evidence in order, weakest first.",
            steps: ["A compliment", "A story about something that happened", "Five stories that agree", "A commitment of time, reputation or money", "Strangers paying, and paying again"],
            why: "Each rung costs the customer more than the last. What they give up is what makes it evidence.",
          },
          {
            kind: "choose",
            prompt: "After one enthusiastic conversation, what can you honestly say?",
            options: [
              { text: "The idea is validated.", good: false, why: "One polite person. The word means something narrower." },
              { text: "One person responded well; nothing is known yet about whether anyone will pay.", good: true, why: "Exactly what happened, and no more." },
              { text: "It is time to build.", good: false, why: "It is time to have four more conversations and then test something small." },
            ],
          },
          {
            kind: "choose",
            prompt: "Which of these is closest to actual validation?",
            options: [
              { text: "Fifty people liked the launch post.", good: false, why: "Fifty compliments." },
              { text: "Ten friends said they would buy it.", good: false, why: "Ten future promises from people who love you." },
              { text: "Six strangers paid for a month, and four paid for a second.", good: true, why: "Money, from strangers, repeated. For that thing, for that kind of stranger." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these disproves something, and which proves nothing either way?",
            buckets: ["Disproves something", "Proves nothing"],
            items: [
              { text: "\"I tried exactly this last year and stopped because the till didn't support it.\"", bucket: 0, why: "One person can disprove. That is a real obstacle, dated." },
              { text: "\"Love it, I'd totally use it.\"", bucket: 1, why: "A compliment about the future." },
              { text: "\"We have three regulars. Total.\"", bucket: 0, why: "If that is typical, the maths never works. Go and count at four more." },
              { text: "\"My friend runs a café, she'd be into this.\"", bucket: 1, why: "A guess about a third person." },
            ],
          },
        ],
        remember: "One yes is a polite person. Five facts are a pattern. Strangers paying twice is validation, of that one thing. Say which rung you are on.",
        apply: { key: "decision", prompt: "Which rung of the ladder are you on, honestly? Write it, and what would move you up one.", hint: "Two lines." },
      },
    ],
  },
];
