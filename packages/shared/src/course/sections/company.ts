/**
 * SECTION 6: THE COMPANY.
 *
 * The boring hour that saves the terrible month, a founder's actual week,
 * and the decision to raise money or not.
 */
import type { Unit } from "../content.ts";

export const COMPANY: Unit[] = [
  {
    id: "boring-hour",
    section: "company",
    n: 16,
    name: "The boring hour",
    line: "Five things that take an hour now and a year later.",
    guide: [
      "The boring hour: a legal entity, a separate bank account, simple books from the first euro, a written founder agreement with vesting, and the domain and accounts in the company's name. Each takes an hour now and can take a year to untangle later.",
      "Mixing personal and company money is the single most common mess. A separate account from day one, even with nothing in it, keeps the books honest and the tax simple.",
      "Contracts and intellectual property: anything a contractor, cofounder or early employee makes for the company should be assigned to the company in writing. Investors check this; so do buyers.",
      "What not to do yet: a trademark in eleven countries, a patent, an office, a board. The boring hour is the minimum, not the maximum.",
    ],
    lessons: [
      {
        id: "the-entity",
        n: 1,
        title: "The entity and the account",
        minutes: 4,
        objective: "Know why a company exists as a separate thing, and why the money must be separate from the first euro.",
        teach: [
          "A company is a separate person in law. It can own things, owe things, sign things and be sued, and none of that reaches your own savings. That separation is the reason to form one before money moves: the first customer who pays you personally has paid you, not the company, and the first supplier you sign personally has signed you. Forming the entity is a form and a fee in most countries, and an hour.",
          "The account comes with it, and it is the one that matters most. Every founder who mixed personal and company money in year one has spent a miserable week in year two working out which coffee was a business expense. A separate account with nothing in it, from day one, is the cheapest discipline in this whole course. Everything the company earns goes in; everything it spends comes out; nothing else touches it.",
          "Which kind of entity depends on the country and on whether you will raise money, and that is a question for an accountant who knows your country, for an hour of their time. What is not a question is whether to do it.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "What does it mean that a company is a separate person in law?",
            options: [
              { text: "It pays less tax.", good: false, why: "Sometimes. Not the point." },
              { text: "It can own, owe, sign and be sued, and none of that reaches the founder's own savings.", good: true, why: "The separation is the reason to form it before money moves." },
              { text: "It needs an office.", good: false, why: "An office is a cost, not a company." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these belongs in the company account?",
            buckets: ["Company account", "Personal account"],
            items: [
              { text: "A customer's first €40 payment.", bucket: 0, why: "Everything the company earns." },
              { text: "The domain renewal.", bucket: 0, why: "Everything the company spends." },
              { text: "Your rent.", bucket: 1, why: "Yours, until the company pays you a salary, which then goes to your account." },
              { text: "Lunch with a friend who happens to be a founder.", bucket: 1, why: "If you have to ask, it is personal." },
            ],
          },
          {
            kind: "fill",
            prompt: "A separate account with nothing in it, from ___, is the cheapest discipline in this course.",
            options: ["the first hire", "day one", "the first raise", "€10,000"],
            answer: 1,
            why: "The mess is made in the months before founders think it matters.",
          },
          {
            kind: "choose",
            prompt: "Which kind of entity should you form?",
            options: [
              { text: "The one most start-ups use.", good: false, why: "Depends on the country and on whether you will raise." },
              { text: "Ask an accountant who knows your country, for an hour. Whether to form one is not the question.", good: true, why: "Country-specific. The one thing that is not specific is doing it." },
              { text: "Wait until revenue justifies it.", good: false, why: "Revenue is exactly when it is too late." },
            ],
          },
        ],
        remember: "Form the entity before money moves. Separate account from day one. Ask a local accountant which kind.",
        apply: { key: "setup", prompt: "Write which of the five boring things are done: entity, account, books, founder agreement, domain and accounts in the company's name. Then the date you will do the next one.", hint: "Five words each. 'Not yet' counts." },
      },
      {
        id: "books-and-tax",
        n: 2,
        title: "Books, from the first euro",
        minutes: 4,
        objective: "Keep records simple enough to keep, and know the two tax facts every founder needs.",
        teach: [
          "Books are a list of every euro in and every euro out, with what it was for. That is all. A spreadsheet is fine for the first year; an accounting app is fine too. What is not fine is nothing, because nothing becomes a shoebox of receipts and a weekend in April you will remember for years.",
          "Two tax facts. First: the company pays tax on profit, not revenue, so every legitimate expense recorded reduces the bill — which is the practical reason to record them. Second: sales tax or VAT, where it exists, is not your money; it is collected from the customer and passed on, and the founder who spends it because it was in the account has a terrible month when it is due.",
          "The rhythm: fifteen minutes a week, in the Friday log, to record the week's money. Then the accountant's hour at year end is an hour, not a fortnight.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "What are books, at the beginning?",
            options: [
              { text: "Audited financial statements.", good: false, why: "Later, if ever." },
              { text: "A list of every euro in and out, with what it was for.", good: true, why: "A spreadsheet is fine. Nothing is not." },
              { text: "A forecast.", good: false, why: "A forecast is the future. Books are the past." },
            ],
          },
          {
            kind: "choose",
            prompt: "€1,000 arrives from a customer, of which €190 is VAT. How much is the company's?",
            options: [
              { text: "€1,000; it is in the account.", good: false, why: "The €190 is collected, not earned, and it is due." },
              { text: "€810; the €190 is the customer's tax, passing through.", good: true, why: "Spend it and the month it is due is a terrible one." },
              { text: "€190.", good: false, why: "The other way around." },
            ],
          },
          {
            kind: "fill",
            prompt: "The company pays tax on ___, not revenue.",
            options: ["profit", "cash", "sales", "salaries"],
            answer: 0,
            why: "Which is why recording legitimate expenses is worth the fifteen minutes.",
          },
          {
            kind: "sort",
            prompt: "Does this go in the books?",
            buckets: ["Record it", "Not the company's"],
            items: [
              { text: "€12 a month for the email tool.", bucket: 0, why: "A company expense. It reduces the bill." },
              { text: "A €40 payment from a café.", bucket: 0, why: "Revenue. In." },
              { text: "Your gym membership.", bucket: 1, why: "Personal." },
              { text: "The €30 you paid a designer for the logo.", bucket: 0, why: "An expense, and get the rights assigned in writing while you are at it." },
            ],
          },
        ],
        remember: "Every euro in and out, with what for. Tax is on profit. VAT is not your money. Fifteen minutes on Friday.",
        apply: { key: "setup", prompt: "Add a line: where your books live (a spreadsheet, an app, nowhere yet), and the fifteen-minute slot each week you will record the money in.", hint: "Add to what you wrote." },
      },
      {
        id: "paper-that-matters",
        n: 3,
        title: "The paper that matters",
        minutes: 4,
        objective: "Know which four documents to have in writing early, and why each one is checked later.",
        teach: [
          "Four pieces of paper, each an hour. The founder agreement: who owns what, vesting, what happens if someone leaves, who decides what — unit three, written down and signed. Intellectual property assignment: anything anyone makes for the company — code, designs, the logo, the name — belongs to the company, in writing, including from cofounders and from the friend who did the logo for €30. Contractor agreements: what they do, what they are paid, that the work is the company's. Terms for customers: what you provide, what they pay, what happens when it breaks.",
          "Why bother early: because every one of these is checked later by someone with money. An investor's lawyers will ask for the IP assignments and stop the deal if a former cofounder still owns the code. A buyer will ask for the customer terms. And the founder agreement is checked by the founders themselves, in the worst month, when a signed document is the difference between a hard conversation and a lawsuit.",
          "Templates exist for all four and are fine to start with. The hour is in reading them and making the founders sign, not in drafting.",
        ],
        exercises: [
          {
            kind: "match",
            prompt: "Match the document to what it settles.",
            pairs: [
              { term: "Founder agreement", meaning: "Who owns what, vesting, and what happens if someone leaves" },
              { term: "IP assignment", meaning: "That what anyone made for the company belongs to the company" },
              { term: "Contractor agreement", meaning: "What they do, what they are paid, and that the work is the company's" },
              { term: "Customer terms", meaning: "What you provide, what they pay, and what happens when it breaks" },
            ],
          },
          {
            kind: "choose",
            prompt: "A cofounder wrote most of the code and left after eight months with no IP assignment signed. What is the problem?",
            options: [
              { text: "None; they left.", good: false, why: "They left owning the code they wrote." },
              { text: "The company may not own its own product, and an investor's lawyers will find that and stop.", good: true, why: "An hour, eight months ago." },
              { text: "The code needs rewriting anyway.", good: false, why: "Maybe. Not the problem." },
            ],
          },
          {
            kind: "choose",
            prompt: "Who checks the founder agreement?",
            options: [
              { text: "The tax office.", good: false, why: "The tax office checks the books, not who owns what." },
              { text: "The founders themselves, in the worst month.", good: true, why: "A signed document is the difference between a hard conversation and a lawsuit." },
              { text: "Nobody; it is a formality.", good: false, why: "Until it is not." },
            ],
          },
          {
            kind: "fill",
            prompt: "The friend who did the logo for €30 should sign ___.",
            options: ["nothing; it was a favour", "an IP assignment", "a founder agreement", "an NDA"],
            answer: 1,
            why: "The logo is the company's only if it says so in writing. An hour now.",
          },
        ],
        remember: "Founder agreement, IP assignment, contractor agreement, customer terms. Templates are fine. Sign them now.",
        apply: { key: "setup", prompt: "Add a line: which of the four documents exist and are signed, and the one you will do this week.", hint: "Add to what you wrote." },
      },
      {
        id: "depth-not-yet",
        n: 4,
        title: "Depth: what not to do yet",
        depth: true,
        minutes: 5,
        objective: "Recognise the expensive, official-feeling things that are not the boring hour, and when each one actually becomes due.",
        teach: [
          "The boring hour is the minimum, and it has a trap: once a founder starts doing official things, official things feel like progress, and there is an endless supply of them. A trademark in eleven countries. A patent. An office. A board of advisers. A press release. Business cards. A payroll provider for a company of one. Each costs money and days and none of them finds a customer.",
          "When they become due. A trademark: when the name has customers attached to it and someone could plausibly copy it — usually after revenue, in the one or two countries you sell in. A patent: almost never for a software or service start-up, and only after a conversation with someone who has had one, because they cost tens of thousands and take years. An office: when the team cannot work without one, which is later than it feels. A board: when an investor requires it. Advisers: when a specific person can answer a specific question, not as a decoration for the website.",
          "The test for any official thing: does a customer notice? A customer notices that you invoice them properly and that your terms are clear. A customer does not notice your trademark, your board, or your office. Do the things customers notice first.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "The boring hour, or not yet?",
            buckets: ["The boring hour", "Not yet"],
            items: [
              { text: "A separate bank account.", bucket: 0, why: "Day one." },
              { text: "A trademark in eleven countries.", bucket: 1, why: "After revenue, in the one or two countries you sell in." },
              { text: "A signed founder agreement.", bucket: 0, why: "Before the first hard month." },
              { text: "A board of advisers.", bucket: 1, why: "When a specific person can answer a specific question." },
              { text: "A patent.", bucket: 1, why: "Almost never for software or a service, and only after advice." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why do official things feel like progress?",
            options: [
              { text: "Because they are progress.", good: false, why: "None of them finds a customer." },
              { text: "Because they are concrete, finishable, and look like what a company does — and there is an endless supply of them.", good: true, why: "The trap is that they are never done and never the work." },
              { text: "Because investors require them.", good: false, why: "Investors require a few, later." },
            ],
          },
          {
            kind: "choose",
            prompt: "The test for any official thing:",
            options: [
              { text: "Does it cost less than €500?", good: false, why: "Cheap and useless is still useless." },
              { text: "Does a customer notice?", good: true, why: "Proper invoices and clear terms, yes. A trademark, a board, an office, no." },
              { text: "Do other start-ups have it?", good: false, why: "Other start-ups have a lot of things." },
            ],
          },
          {
            kind: "fill",
            prompt: "A trademark becomes due when the name has ___ attached to it.",
            options: ["a logo", "customers", "a website", "a cofounder"],
            answer: 1,
            why: "Before customers there is nothing for a copier to take.",
          },
        ],
        remember: "The boring hour is the minimum. Everything else official: does a customer notice? If not, not yet.",
        apply: { key: "setup", prompt: "Add a line: the official-feeling thing you have been tempted to do, and when, by this lesson's rules, it actually becomes due.", hint: "Add to what you wrote." },
      },
    ],
  },
  {
    id: "founders-week",
    section: "company",
    n: 17,
    name: "A founder's week",
    line: "Three tasks, one number, Monday to Friday.",
    guide: [
      "A founder's week has three tasks, chosen on Monday, each of which should move the one number. Not ten tasks. Three, finished.",
      "Half of every early week belongs to customers — talking, selling, watching — and founders who are makers by trade drift below that unless it is scheduled.",
      "Friday reads the week back: what was planned, what happened, what the number did, and what surprised you. Ten minutes, written down.",
      "Energy is the constraint, not hours. A founder who works seventy hours a week for three months has done less than one who worked forty for a year.",
    ],
    lessons: [
      {
        id: "three-tasks",
        n: 1,
        title: "Three tasks on Monday",
        minutes: 4,
        objective: "Choose three tasks for the week that move the one number, and write them where you will see them.",
        teach: [
          "The founder's problem is not too little to do; it is too much, all of it plausible. The fix is a Monday habit: three tasks for the week, each one a thing that will be visibly done or not done by Friday, each one chosen because it moves the one number from unit fifteen. Not \"work on the website\" but \"call the six owners who trialled it and ask for a decision\".",
          "Three, because three finished is a week and ten started is not. The rest of the list still exists; it goes on a second list called later, and it is looked at on Monday and not before.",
          "Each task has a test for being on the list: if it is done, what number changes? If the answer is none, it is not a task for this week; it is an official thing, or a comfort. Founders are drawn to the comfort tasks — the logo, the deck, the tidy-up — precisely because they cannot fail. The three that can fail are the three that count.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "A task for this week, or a comfort?",
            buckets: ["Moves the number", "A comfort"],
            items: [
              { text: "Call the six owners who trialled it and ask for a decision.", bucket: 0, why: "Six calls, and the number of paying customers changes or does not." },
              { text: "Redesign the logo.", bucket: 1, why: "Cannot fail, and changes nothing." },
              { text: "Set up the trial on two new tills.", bucket: 0, why: "Two more trials, which is the top of the funnel." },
              { text: "Reorganise the notebook.", bucket: 1, why: "A tidy-up. Later." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why three tasks and not ten?",
            options: [
              { text: "Because founders are lazy.", good: false, why: "The opposite. They start ten." },
              { text: "Because three finished is a week and ten started is not.", good: true, why: "Finished is the unit." },
              { text: "Because the app only has three slots.", good: false, why: "It has three slots because of the first answer." },
            ],
          },
          {
            kind: "fill",
            prompt: "The test for a task: if it is done, what ___ changes?",
            options: ["file", "number", "feeling", "page"],
            answer: 1,
            why: "If none, it is an official thing or a comfort.",
          },
          {
            kind: "edit",
            prompt: "Make this task one that can be visibly done or not by Friday.",
            before: "Work on getting more customers.",
            better: ["Send the offer to twelve owners from the trade group list and log each reply.", "Visit four cafés on the high street on Tuesday morning with the two-week trial offer.", "Ask every trial customer for one introduction, and log the names."],
          },
        ],
        remember: "Three tasks on Monday, each with a number it moves, each visibly done or not by Friday.",
        apply: { key: "weekPlan", prompt: "Write this week's three tasks, and next to each the number it should move.", hint: "Verbs. Counts. Names." },
      },
      {
        id: "half-for-customers",
        n: 2,
        title: "Half the week for customers",
        minutes: 4,
        objective: "Schedule customer time before maker time, because it never happens the other way round.",
        teach: [
          "Early on, about half a founder's week should be spent with customers: talking to them, selling to them, setting things up for them, watching them use the thing. Not because building does not matter, but because building is what founders do when left alone, and the customer half evaporates unless it is put in the calendar first.",
          "Makers by trade — engineers, designers, writers — drift below the half without noticing, because the making is where they are comfortable and competent and the customer conversations are where they are neither. The drift is invisible from inside; the only defence is the calendar. Customer blocks first, on Monday; maker blocks around them.",
          "What counts as customer time: conversations, sales calls, visits, support, watching someone use it. What does not: reading about customers, writing about customers, designing for customers. Those are maker time in customer clothing.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Customer time, or maker time in customer clothing?",
            buckets: ["Customer time", "Maker time"],
            items: [
              { text: "Sitting behind the counter for an hour watching the owner use the thing.", bucket: 0, why: "Watching them use it." },
              { text: "Writing a customer persona document.", bucket: 1, why: "Writing about customers. Maker time." },
              { text: "A sales call.", bucket: 0, why: "Selling." },
              { text: "Designing the onboarding screens.", bucket: 1, why: "Designing for customers. Maker time." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why put customer blocks in the calendar first?",
            options: [
              { text: "Because customers are more important than the product.", good: false, why: "Both matter. The order is about drift, not importance." },
              { text: "Because building is what founders do when left alone, and the customer half evaporates unless scheduled first.", good: true, why: "The drift is invisible from inside." },
              { text: "Because mornings are better for calls.", good: false, why: "Sometimes true. Not the reason." },
            ],
          },
          {
            kind: "fill",
            prompt: "Early on, about ___ of a founder's week should be spent with customers.",
            options: ["a tenth", "a quarter", "half", "all"],
            answer: 2,
            why: "Half. Makers by trade drift below it without a calendar.",
          },
          {
            kind: "choose",
            prompt: "An engineer-founder looks back at the week: forty hours building, two hours of calls. What happened?",
            options: [
              { text: "A productive week.", good: false, why: "Productive at the comfortable half." },
              { text: "The drift: the maker time filled the week because it was scheduled and the customer time was not.", good: true, why: "Next Monday: customer blocks first." },
              { text: "The product needed the time.", good: false, why: "It always does. That is the point." },
            ],
          },
        ],
        remember: "Half the week with customers. Calendar it first, on Monday. Reading and writing about customers does not count.",
        apply: { key: "weekPlan", prompt: "Add the customer blocks for this week: which days, which hours, and with whom.", hint: "Add to what you wrote." },
      },
      {
        id: "friday-read-back",
        n: 3,
        title: "Friday reads the week back",
        minutes: 4,
        objective: "Close the week in ten minutes: planned, happened, the number, the surprise.",
        teach: [
          "Friday is ten minutes and four lines. What was planned — the three from Monday. What happened — done, not done, half. What the number did — this week's value, against last week's. What surprised you — the one thing you did not expect, from a customer or from the work.",
          "The read-back is where learning happens, and most founders skip it because it can be uncomfortable: two of three not done, the number flat, and no surprise because there were no customer conversations to be surprised by. That discomfort is the information. A founder who writes \"flat, and I spent the week on the settings page\" three Fridays running will change something; a founder who never writes it down will spend the quarter that way.",
          "The four lines go in the log and are read on Monday before the new three are chosen. That is the whole loop: plan, do, read back, plan. It is the same loop as the journey — learn, act, record, reflect — one week wide.",
        ],
        exercises: [
          {
            kind: "order",
            prompt: "Put the four Friday lines in order.",
            steps: ["What was planned", "What happened", "What the number did", "What surprised you"],
            why: "Plan, outcome, measure, learning. Ten minutes.",
          },
          {
            kind: "choose",
            prompt: "Why do founders skip the Friday read-back?",
            options: [
              { text: "It takes too long.", good: false, why: "Ten minutes." },
              { text: "It can be uncomfortable, and the discomfort is the information.", good: true, why: "Two of three not done, number flat. Written down, that changes next week." },
              { text: "It is not needed if the week went well.", good: false, why: "A good week read back tells you what to repeat." },
            ],
          },
          {
            kind: "choose",
            prompt: "Three Fridays running: \"flat, spent the week on the settings page\". What does this tell you?",
            options: [
              { text: "The settings page is hard.", good: false, why: "Possibly. Not what the log is saying." },
              { text: "The customer half has evaporated and the number is not moving; next Monday's three must be customer tasks.", good: true, why: "Written down three times, it is impossible to ignore." },
              { text: "Nothing; three weeks is too short.", good: false, why: "Three weeks of flat with no customer time is plenty." },
            ],
          },
          {
            kind: "fill",
            prompt: "The Friday lines are read on ___ before the new three are chosen.",
            options: ["Friday", "Sunday night", "Monday", "the first of the month"],
            answer: 2,
            why: "Plan, do, read back, plan. The loop closes on Monday.",
          },
        ],
        remember: "Friday, ten minutes: planned, happened, the number, the surprise. Read it on Monday.",
        apply: { key: "weekPlan", prompt: "Add last week's four Friday lines, if you had a week. If not, write what you expect this Friday's to say.", hint: "Add to what you wrote." },
      },
      {
        id: "depth-energy",
        n: 4,
        title: "Depth: energy, not hours",
        depth: true,
        minutes: 5,
        objective: "Treat the founder's energy as the scarce resource, and design the week so it lasts a year.",
        teach: [
          "The story of the founder who worked hundred-hour weeks is told about the ones who survived. Most people who work that way for three months produce three months of worse decisions and then stop, and a start-up is a search that takes a year or more. The constraint is not hours; it is the number of good decisions you can make per week, and that number falls sharply with exhaustion. A founder at forty good hours a week for a year beats one at seventy for a quarter.",
          "Practical shape: sleep is a work input and goes in the calendar with the same seriousness as customer blocks. One day a week with no company in it, because the surprising thoughts arrive when you are not looking for them. The three tasks are sized for a human week, not an ideal one. And the hardest task goes in the morning, before the day has spent you.",
          "The signs of running past the line: the Friday read-back stops happening, the customer blocks get moved, the same decision gets remade three times, and small things provoke large reactions. Each is a signal to cut the week, not push through it. Cutting a week costs a week; burning out costs the company.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Why is the hundred-hour-week story misleading?",
            options: [
              { text: "Because nobody really works that much.", good: false, why: "Some do, for a while." },
              { text: "Because it is told about the survivors; most who work that way produce worse decisions for three months and stop, and the search takes a year.", good: true, why: "Good decisions per week is the number, and it falls with exhaustion." },
              { text: "Because labour law forbids it.", good: false, why: "Founders are not covered, mostly." },
            ],
          },
          {
            kind: "sort",
            prompt: "A sign of running past the line, or a normal week?",
            buckets: ["Past the line", "Normal"],
            items: [
              { text: "The Friday read-back has not happened for three weeks.", bucket: 0, why: "The first thing to go." },
              { text: "The same pricing decision has been remade three times.", bucket: 0, why: "Exhaustion loops." },
              { text: "One of three tasks did not get done.", bucket: 1, why: "A normal week. Log it." },
              { text: "A minor bug provoked an hour of rage.", bucket: 0, why: "Small things, large reactions." },
            ],
          },
          {
            kind: "choose",
            prompt: "What does cutting a week cost, against burning out?",
            options: [
              { text: "The same; lost time either way.", good: false, why: "A week against the company." },
              { text: "Cutting a week costs a week; burning out costs the company.", good: true, why: "The asymmetry is the whole argument." },
              { text: "Cutting a week costs more, because momentum.", good: false, why: "Momentum is a story told by people who did not burn out." },
            ],
          },
          {
            kind: "fill",
            prompt: "The hardest task goes in the ___, before the day has spent you.",
            options: ["evening", "morning", "middle", "weekend"],
            answer: 1,
            why: "Decisions are best when you are, which is early.",
          },
        ],
        remember: "Good decisions per week is the number. Sleep is an input. One day off. Hardest task first. Cut the week before it cuts you.",
        apply: { key: "weekPlan", prompt: "Add a line: your day with no company in it, and the sign you will watch for that says the week should be cut.", hint: "Add to what you wrote." },
      },
    ],
  },
  {
    id: "raise-or-not",
    section: "company",
    n: 18,
    name: "Raise or bootstrap",
    line: "Money from other people is a tool with a price. Know the price before you pick it up.",
    guide: [
      "Bootstrapping means growing on revenue. Raising means selling part of the company for money now. Neither is virtuous; each fits some businesses and not others.",
      "Raise when the business is one where speed matters more than ownership and the money buys something specific: a market that will be taken by whoever is fastest, or a product that cannot be built small. Bootstrap when growth can come from customers and the founder would rather own it.",
      "What investors buy is growth, and they need it to be large: a fund returns on the one company in twenty that becomes enormous. A business that will be good, profitable and medium-sized is a bad fit for venture money, and taking it changes the business into one that must try to be enormous.",
      "Terms in one breath: a pre-seed or seed round sells 10–20% of the company for enough money to reach the next milestone; a SAFE or convertible note defers the price to the next round; a priced round sets it now. Always know what you are selling and what it must buy.",
    ],
    lessons: [
      {
        id: "two-ways",
        n: 1,
        title: "Two ways to fund a company",
        minutes: 4,
        objective: "Say what bootstrapping and raising each are, and what each one costs.",
        teach: [
          "Bootstrapping is growing on the money customers pay you. It is slow at first, it keeps the company yours, and it forces the discipline of unit eleven from the start, because a business that does not make money per customer cannot bootstrap at all. Raising is selling a piece of the company to investors for money now. It is fast, it buys time and people before revenue could, and it costs a share of everything the company ever becomes plus a set of obligations to the people who bought it.",
          "Neither is virtuous. Bootstrapping is not more honest; raising is not more ambitious. They are tools that fit different businesses. A business that can grow on revenue and whose founder would rather own it should bootstrap. A business in a market that will be taken by whoever moves fastest, or whose product cannot be built small, may need to raise, and the price of not raising is losing the market.",
          "There is a third road most founders forget: revenue first, raise later, if at all. A company with paying customers and a growth rate raises on far better terms than one with a deck, and often finds it no longer needs to.",
        ],
        exercises: [
          {
            kind: "match",
            prompt: "Match the way to what it costs.",
            pairs: [
              { term: "Bootstrapping", meaning: "Slow at first, and only works if a customer pays for themselves" },
              { term: "Raising", meaning: "A share of everything the company ever becomes, plus obligations to investors" },
              { term: "Revenue first, raise later", meaning: "Better terms, and often the discovery that you no longer need to" },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these is a reason to raise?",
            buckets: ["A reason to raise", "Not a reason"],
            items: [
              { text: "The market will be taken by whoever moves fastest, and the money buys speed.", bucket: 0, why: "Speed matters more than ownership here." },
              { text: "The product cannot be built small; a factory or a network is needed first.", bucket: 0, why: "Cannot be bootstrapped." },
              { text: "Raising is what serious start-ups do.", bucket: 1, why: "Not a reason. Many serious businesses never raise." },
              { text: "It would feel like progress.", bucket: 1, why: "It is a sale, not progress." },
            ],
          },
          {
            kind: "choose",
            prompt: "Which is more honest, bootstrapping or raising?",
            options: [
              { text: "Bootstrapping.", good: false, why: "Neither is virtuous. Tools." },
              { text: "Raising, because it is more ambitious.", good: false, why: "Ambition is not a funding method." },
              { text: "Neither; each fits some businesses and not others.", good: true, why: "The question is fit, not virtue." },
            ],
          },
          {
            kind: "fill",
            prompt: "A company with paying customers and a growth rate raises on ___ terms than one with a deck.",
            options: ["worse", "the same", "far better", "no"],
            answer: 2,
            why: "Revenue first. The third road.",
          },
        ],
        remember: "Bootstrap: slow, yours, needs unit economics. Raise: fast, costs a share and obligations. Revenue first is usually the best of both.",
        apply: { key: "raiseDecision", prompt: "Write which road fits your business today, and the one reason it could be the wrong choice.", hint: "Two lines. Honest about the second." },
      },
      {
        id: "what-investors-buy",
        n: 2,
        title: "What investors buy",
        minutes: 5,
        objective: "Understand how a venture fund makes money, and so which businesses fit it and which do not.",
        teach: [
          "A venture fund invests in twenty or thirty companies knowing that most will fail, a few will return their money, and one or two will become large enough to pay for all the rest and the fund's profit besides. The arithmetic only works if that one company becomes very large — many times the fund's whole size. So what an investor is buying, in every company, is the chance of being that one. Not a good business. An enormous one.",
          "This is why a business that will be good, profitable and medium-sized — a company doing €3 million a year with happy customers and a founder who owns it — is a bad fit for venture money. It is a wonderful business and a failed investment. Taking venture money changes the business into one that must try to be enormous, because that is what was sold, and the founder who wanted the good medium-sized company has sold the right to build it.",
          "Ask, before raising: is this a business that could be a hundred times bigger than it is, and do I want to spend the next decade trying? If both are yes, venture money is a tool that fits. If either is no, the money is available and wrong.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "How does a venture fund make money?",
            options: [
              { text: "From a small profit on most of its companies.", good: false, why: "Most fail. The profit comes from one or two." },
              { text: "From one or two companies in twenty becoming large enough to pay for all the rest.", good: true, why: "Which is why every investment must have the chance of being that one." },
              { text: "From management fees.", good: false, why: "Fees keep the lights on. Returns come from the one." },
            ],
          },
          {
            kind: "choose",
            prompt: "A company will do €3 million a year, profitably, with happy customers, forever. As a venture investment it is:",
            options: [
              { text: "A success; profit is the point.", good: false, why: "A wonderful business and a failed investment." },
              { text: "A failure, because it will not return the fund.", good: true, why: "The arithmetic needs the one enormous company." },
              { text: "Neutral.", good: false, why: "There is no neutral in a fund's arithmetic." },
            ],
          },
          {
            kind: "sort",
            prompt: "Is this a fit for venture money?",
            buckets: ["Could fit", "Wrong tool"],
            items: [
              { text: "A product every small business in Europe could use, in a market with no leader yet.", bucket: 0, why: "Could be a hundred times bigger. Whether the founder wants a decade of it is the other question." },
              { text: "A loyalty tool for the cafés in one city, with a founder who wants to own it.", bucket: 1, why: "Good, bounded, and the founder wants it. Bootstrap." },
              { text: "A consultancy.", bucket: 1, why: "Grows with headcount, not a hundredfold." },
            ],
          },
          {
            kind: "fill",
            prompt: "Taking venture money changes the business into one that must try to be ___.",
            options: ["profitable", "enormous", "acquired", "public"],
            answer: 1,
            why: "That is what was sold. The founder who wanted the good medium company has sold the right to build it.",
          },
        ],
        remember: "Investors buy the chance of the one enormous company. A good medium business is a wonderful business and a failed investment.",
        apply: { key: "raiseDecision", prompt: "Add two answers: could this be a hundred times bigger, and do you want the decade it would take?", hint: "Add to what you wrote." },
      },
      {
        id: "terms-in-one-breath",
        n: 3,
        title: "The terms, in one breath",
        minutes: 5,
        objective: "Know the handful of terms every founder must understand before signing, and what each one means for ownership.",
        teach: [
          "The words. A round is one sale of shares; pre-seed and seed are the first, small ones. Valuation is what the whole company is priced at; pre-money before the new cash, post-money after. Dilution is the share you give up: raise €500,000 at a €2.5 million post-money and you have sold 20%. A SAFE (simple agreement for future equity) or a convertible note takes money now and sets the price at the next round, usually with a discount or a cap on that price; a priced round sets it now. Vesting, from unit three, applies to founders whether or not they raise.",
          "The two numbers that matter most are how much of the company you have sold and what the money must buy. A first round typically sells 10–20%; more than that at the start leaves too little for later rounds and for the founders after four of them. And every round must be enough to reach a specific next milestone — a number, a date — with a margin, because a company that runs out halfway raises again from weakness.",
          "Things to have someone explain before signing: liquidation preference, which decides who is paid first if the company is sold small; pro rata rights; board seats; and anything with the word \"participating\" in it. Standard documents exist and are fine; the hour with a lawyer is for the non-standard lines.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "You raise €500,000 at a €2.5 million post-money valuation. What share did you sell?",
            options: [
              { text: "5%.", good: false, why: "500 ÷ 2,500, not 500 ÷ 10,000." },
              { text: "20%.", good: true, why: "The new money over the post-money value." },
              { text: "25%.", good: false, why: "That would be over the pre-money. Post-money includes the new cash." },
            ],
          },
          {
            kind: "match",
            prompt: "Match the term to its meaning.",
            pairs: [
              { term: "Dilution", meaning: "The share of the company given up in a round" },
              { term: "SAFE", meaning: "Money now, price set at the next round" },
              { term: "Priced round", meaning: "The share price is set now" },
              { term: "Liquidation preference", meaning: "Who is paid first if the company is sold small" },
            ],
          },
          {
            kind: "choose",
            prompt: "What must every round be enough for?",
            options: [
              { text: "Eighteen months of salaries.", good: false, why: "A common rule, but the real test is the milestone." },
              { text: "Reaching a specific next milestone, with a margin.", good: true, why: "A company that runs out halfway raises again from weakness." },
              { text: "Whatever investors will give.", good: false, why: "Too much sells too much of the company; too little runs out." },
            ],
          },
          {
            kind: "fill",
            prompt: "A first round typically sells ___ of the company.",
            options: ["1–5%", "10–20%", "40–50%", "all"],
            answer: 1,
            why: "More at the start leaves too little for later rounds and for the founders after four of them.",
          },
        ],
        remember: "Know what share you are selling and what the money must buy. Have someone explain any line with 'preference' or 'participating' in it.",
        apply: { key: "raiseDecision", prompt: "Add a line: if you raised, how much you would need to reach which milestone by which date, and what share that would be at a plausible valuation.", hint: "Add to what you wrote. Rough is fine." },
      },
      {
        id: "depth-decision",
        n: 4,
        title: "Depth: making the decision with your eyes open",
        depth: true,
        minutes: 6,
        objective: "Put the whole course together into one decision: what this business is, what it needs, and which road fits.",
        teach: [
          "This is the last lesson, and it is the course read back. A start-up is a company designed to grow fast, in a search for a repeatable business. You found a real person with a real problem, and you know what you have observed against what you assume. You put the smallest thing in front of them and read the result honestly. You have a price, you know whether a customer pays for themselves, and you know the date. You found the first customers by hand and you know which channel and which number. The company exists, on paper, and the week has a shape.",
          "Now the decision. Look at the idea page. If the number is growing on revenue, customers pay for themselves, and the market is one you would be glad to own a good piece of: bootstrap, and revisit in six months. If the number is growing, the market is one where speed decides, the business could be a hundred times bigger, and you want the decade: raise, the amount that reaches the next milestone, selling no more than a fifth. If the number is not growing: neither. Go back to the section where the evidence is thinnest — usually the customer, sometimes the product — and do that work. Money does not fix a business that has not found its customer; it only makes the search more expensive.",
          "Write the decision down with the reason it could be wrong, and the date you will read it again. That is the habit the whole course has been teaching: say what you think, say what would change your mind, and check. It is what a good founder does with everything, and it is what makes a start-up something other than a bet.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Which road, from the evidence?",
            buckets: ["Bootstrap or raise", "Neither yet: back to the evidence"],
            items: [
              { text: "Forty paying customers, 8% weekly growth, LTV three times CAC, a bounded market the founder wants to own.", bucket: 0, why: "Bootstrap. Revisit in six months." },
              { text: "Growing weekly, a market where speed decides, could be a hundred times bigger, and the founder wants the decade.", bucket: 0, why: "Raise, to the next milestone, no more than a fifth." },
              { text: "A deck, a prototype, four conversations, and no paying customer.", bucket: 1, why: "Money makes the search more expensive. Back to the customer." },
              { text: "Sign-ups rising, retention falling, and no one has been asked why.", bucket: 1, why: "A leaky bucket. Back to the product and the customer." },
            ],
          },
          {
            kind: "choose",
            prompt: "The number is not growing. Which is the right response?",
            options: [
              { text: "Raise, to buy time to fix it.", good: false, why: "Money does not fix a business that has not found its customer." },
              { text: "Go back to the section where the evidence is thinnest and do that work.", good: true, why: "Usually the customer. Sometimes the product." },
              { text: "Bootstrap harder.", good: false, why: "Bootstrapping on no growth is standing still." },
            ],
          },
          {
            kind: "order",
            prompt: "Put the course's habit in order.",
            steps: ["Say what you think", "Say what would change your mind", "Check", "Write it down with the date you will read it again"],
            why: "The same loop as every mission and every Friday. It is what makes a start-up something other than a bet.",
          },
          {
            kind: "choose",
            prompt: "What does this course claim about your business?",
            options: [
              { text: "That it will work if you follow the steps.", good: false, why: "Nothing here says that, and nothing honest could." },
              { text: "Nothing about whether it will work; only that you can find out honestly and decide with your eyes open.", good: true, why: "The evidence is yours. The decision is yours." },
              { text: "That it is validated.", good: false, why: "There is no such state. There is what you observed and what you still assume." },
            ],
          },
        ],
        remember: "Growing on revenue: bootstrap. Growing where speed decides, and you want the decade: raise. Not growing: back to the evidence.",
        apply: { key: "raiseDecision", prompt: "Write the decision: bootstrap, raise, or back to which section. Then the reason it could be wrong, and the date you will read this line again.", hint: "This is the last apply step. Make it one you would show a cofounder." },
      },
    ],
  },
];
