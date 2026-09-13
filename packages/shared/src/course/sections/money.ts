/**
 * SECTION 4: THE MONEY.
 *
 * Pricing, one customer's arithmetic, and runway. Three numbers every
 * founder should be able to say out loud, and most cannot.
 */
import type { Unit } from "../content.ts";

export const MONEY: Unit[] = [
  {
    id: "pricing",
    section: "money",
    n: 10,
    name: "Pricing",
    line: "The commonest mistake is charging too little. The second is not charging at all.",
    guide: [
      "Price on value, not cost. What is it worth to the customer, measured against their workaround? Cost tells you the floor; value tells you the price.",
      "Charge more than feels comfortable. Companies that charge more can fund distribution and product, and grow faster. A price that nobody winces at is too low.",
      "Three tiers, and say the middle one first. The cheap one makes the middle look reasonable; the expensive one makes it look like a bargain.",
      "Free is a price, and usually the wrong one: it attracts the people least likely to ever pay, and it tells you nothing.",
    ],
    lessons: [
      {
        id: "value-not-cost",
        n: 1,
        title: "Price on value, not cost",
        minutes: 4,
        objective: "Set a price from what the thing is worth to the customer, not from what it costs you.",
        teach: [
          "Two ways to price. Cost-plus: work out what it costs you, add a margin. Value-based: work out what it is worth to the customer, charge a share of that. Cost-plus feels safe and is almost always too low, because what a thing costs you has nothing to do with what it saves them.",
          "The value is in the workaround. If the customer pays a part-timer a hundred euros a month to do this by hand, the value of doing it for them is around a hundred euros a month. If it saves a café three lost regulars a winter, at a few hundred euros of coffee each, the value is a thousand euros. Your price is a fraction of that — enough that switching is clearly worth it, and not a euro less than the value supports.",
          "Cost still matters: it is the floor. Below your cost per customer you have a charity, not a company. But the floor is not the price. The price is what the value supports, and that is usually a long way above the floor.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "A café pays a part-timer €100 a month to text regulars. Your product does it for €4 a month in server costs. Cost-plus says €8. What does value-based say?",
            options: [
              { text: "€8; double the cost is a healthy margin.", good: false, why: "Cost-plus. Leaves €90 of value on the table and tells the customer the thing is worth €8." },
              { text: "Somewhere well under €100 and well over €8 — say €40 — because that is clearly worth switching for and the value supports it.", good: true, why: "A share of the value, enough to make switching obvious, nowhere near the cost floor." },
              { text: "€100; that is what they pay now.", good: false, why: "Equal to the workaround is no reason to switch. Beat it clearly." },
            ],
          },
          {
            kind: "match",
            prompt: "Match each term to what it tells you.",
            pairs: [
              { term: "Cost per customer", meaning: "The floor. Below it, a charity." },
              { term: "The workaround's cost", meaning: "Roughly what the problem is worth to them today." },
              { term: "Value-based price", meaning: "A share of what it is worth, clearly better than the workaround." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which pricing reasoning is value-based?",
            buckets: ["Value-based", "Cost-plus"],
            items: [
              { text: "\"It saves them a lost regular a month, which is about €80 of coffee, so €30 a month is an easy yes.\"", bucket: 0, why: "Reasoned from what it is worth to them." },
              { text: "\"Hosting is €4, so €10 gives us a good margin.\"", bucket: 1, why: "Reasoned from your costs. Almost certainly too low." },
              { text: "\"They pay their niece €50 a month; we should be under that and clearly better.\"", bucket: 0, why: "Anchored on the workaround." },
              { text: "\"Our competitor charges €12, so we'll charge €11.\"", bucket: 1, why: "Not cost-plus, but not value either. A guess about their customers." },
            ],
          },
          {
            kind: "fill",
            prompt: "Cost tells you the ___; value tells you the price.",
            options: ["margin", "floor", "market", "ceiling"],
            answer: 1,
            why: "The floor. The price lives well above it, wherever the value puts it.",
          },
        ],
        remember: "Price is a share of what it is worth to them, measured against their workaround. Cost is only the floor.",
        apply: { key: "price", prompt: "Write the value: what does your product save or earn the customer, per month, against their workaround? Then a price that is a clear share of it.", hint: "Replaces the earlier price line if you had one." },
      },
      {
        id: "charge-more",
        n: 2,
        title: "Charge more",
        minutes: 4,
        objective: "Explain why charging more is usually right, and recognise the price that is too low.",
        teach: [
          "Kevin Hale's pricing lecture at Y Combinator names the commonest mistake first: charging too little. Founders under-price out of fear — that nobody will pay, that they are not worth it yet — and the fear costs them twice. Once in revenue. Once in the kind of customer a low price attracts.",
          "Marc Andreessen's version: companies that charge more can afford distribution and product, and so they grow faster. A higher price funds the person who finds the next customer and the work that keeps the current one. A low price funds neither and calls it being competitive.",
          "The sign a price is too low is that nobody winces. If you say the number and every face is relaxed, raise it until some are not. The right price is one where some people say no, and the ones who say yes are the ones who value it most — which, not by coincidence, are the customers you want.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "According to Hale, the commonest pricing mistake is:",
            options: [
              { text: "Charging too much.", good: false, why: "Rare. Founders are afraid of this and so they rarely do it." },
              { text: "Charging too little.", good: true, why: "Out of fear, and it costs twice: revenue and the kind of customer it attracts." },
              { text: "Too many tiers.", good: false, why: "A real mistake, and further down the list." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why do companies that charge more tend to grow faster?",
            options: [
              { text: "Because expensive things seem better.", good: false, why: "Sometimes. That is not the mechanism." },
              { text: "Because the higher price funds finding the next customer and improving the product for the current one.", good: true, why: "Distribution and product both cost money. A low price funds neither." },
              { text: "Because investors prefer it.", good: false, why: "They do, because of the reason above." },
            ],
          },
          {
            kind: "fill",
            prompt: "The sign a price is too low is that nobody ___.",
            options: ["buys", "winces", "complains", "asks"],
            answer: 1,
            why: "Say the number and watch. All relaxed faces means raise it.",
          },
          {
            kind: "sort",
            prompt: "Which of these is fear talking?",
            buckets: ["Fear", "Reasoning"],
            items: [
              { text: "\"We should be cheap until we have more features.\"", bucket: 0, why: "Fear of not being worth it. The value is in the outcome, not the feature count." },
              { text: "\"Three of five winced and two asked about the details, so this is about right.\"", bucket: 1, why: "Read from faces. Reasoning." },
              { text: "\"If we're the cheapest, nobody can say no.\"", bucket: 0, why: "They can and will, and the ones who say yes will leave for the next cheapest." },
              { text: "\"It saves them €300 a winter; €30 a month is an obvious yes for the right owner.\"", bucket: 1, why: "Value against workaround." },
            ],
          },
        ],
        remember: "Under-pricing costs revenue and attracts the wrong customers. Raise it until some faces are not relaxed.",
        apply: { key: "price", prompt: "Add a line: what would you charge if you were not afraid? If it is higher than your price, say why you are not charging it.", hint: "Add to what you wrote." },
      },
      {
        id: "three-tiers",
        n: 3,
        title: "Three prices, and free",
        minutes: 4,
        objective: "Structure a simple three-tier price and decide whether free has a place in it.",
        teach: [
          "One price makes every customer ask whether it is worth it. Three prices make them ask which one. A small one, a middle one, a big one; say the middle one first. The small one exists to make the middle look reasonable; the big one exists to make the middle look like a bargain and to catch the few who need more.",
          "Keep the difference between tiers about what the customer gets, not about hobbling the cheap one. \"One café\" versus \"up to five cafés\" is a real difference. \"Without the feature everyone needs\" is a trap that makes the cheap tier feel like punishment.",
          "Free is a price, and usually the wrong one. A free tier attracts the people least likely to ever pay, costs you support, and — the real damage — tells you nothing about whether anyone values the thing. A free trial for a set time, with a card or without, is a different tool: it lets someone feel the value before the price. Use trials. Be very careful with free.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Why three tiers rather than one?",
            options: [
              { text: "Because more options always sell more.", good: false, why: "More options past three sell less. Three is the trick." },
              { text: "Because three changes the question from 'is it worth it?' to 'which one?'", good: true, why: "The small one makes the middle reasonable; the big one makes it a bargain." },
              { text: "Because competitors have three.", good: false, why: "They do. This is why." },
            ],
          },
          {
            kind: "sort",
            prompt: "A real tier difference, or hobbling?",
            buckets: ["A real difference", "Hobbling"],
            items: [
              { text: "Basic: one café. Standard: up to five. Group: unlimited.", bucket: 0, why: "About what they get. Grows with them." },
              { text: "Basic: no reports. Standard: reports.", bucket: 1, why: "If everyone needs reports, the cheap tier is a punishment." },
              { text: "Basic: monthly. Standard: monthly plus a person to call.", bucket: 0, why: "A real service difference." },
              { text: "Basic: limited to 20 customers on the list, forever.", bucket: 1, why: "A cap that makes the product useless at the tier it is sold at." },
            ],
          },
          {
            kind: "choose",
            prompt: "What is the real damage a free tier does early on?",
            options: [
              { text: "Support costs.", good: false, why: "Real, and not the worst of it." },
              { text: "It tells you nothing about whether anyone values the thing.", good: true, why: "Free users are not evidence. Paying users are." },
              { text: "It makes the product look cheap.", good: false, why: "Sometimes. The evidence problem is bigger." },
            ],
          },
          {
            kind: "fill",
            prompt: "Say the ___ price first.",
            options: ["lowest", "middle", "highest", "average"],
            answer: 1,
            why: "The one you want them to choose. The other two exist to frame it.",
          },
        ],
        remember: "Three tiers, real differences, say the middle one first. Trials are a tool; free is usually a mistake.",
        apply: { key: "price", prompt: "Sketch three tiers: what each one gets, and its price. Mark the one you will say first.", hint: "Add to what you wrote. Rough is fine." },
      },
      {
        id: "depth-pricing-mistakes",
        n: 4,
        title: "Depth: the four pricing mistakes, and raising a price",
        depth: true,
        minutes: 5,
        objective: "Name the four pricing mistakes from Hale's lecture and raise a price without losing the customers who matter.",
        teach: [
          "Hale's four. Prices too low, covered. Underestimating costs: the price has to cover not only making the thing but finding the customer and keeping them, which are usually the bigger numbers. Not understanding the value: pricing on what it costs or what rivals charge instead of what it does for the customer. And focusing on the wrong customers: pricing for the people who will never pay much instead of the ones who will.",
          "Raising a price. Existing customers first: tell them in advance, with a reason that is about value, and keep their old price for a period if you can. Then new customers at the new price. Then watch two numbers: how many new customers say yes at the new price, and how many existing ones leave. Almost always fewer leave than you feared, and the ones who leave were paying least.",
          "The arithmetic that makes founders brave: if you raise the price 20% and lose 10% of customers, revenue is up 8% and the customers left are the ones who valued it more. Losing some customers on a price rise is not failure; losing none means you did not raise it enough.",
        ],
        exercises: [
          {
            kind: "match",
            prompt: "Match each of Hale's mistakes to its description.",
            pairs: [
              { term: "Prices too low", meaning: "Fear, costing revenue and attracting the wrong customers" },
              { term: "Underestimating costs", meaning: "Forgetting that finding and keeping a customer costs more than making the thing" },
              { term: "Not understanding the value", meaning: "Pricing on costs or rivals instead of what it does for them" },
              { term: "The wrong customers", meaning: "Pricing for people who will never pay much" },
            ],
          },
          {
            kind: "choose",
            prompt: "You raise the price 20% and lose 10% of customers. What happened?",
            options: [
              { text: "A mistake; you lost customers.", good: false, why: "Revenue is up 8%, and the customers who left were paying least." },
              { text: "Revenue up about 8%, and the remaining customers value it more.", good: true, why: "1.2 times 0.9. Losing some on a rise is expected. Losing none means it was not enough." },
              { text: "Break-even.", good: false, why: "Do the multiplication." },
            ],
          },
          {
            kind: "order",
            prompt: "Put a price rise in the order this lesson gives.",
            steps: ["Tell existing customers in advance, with a reason about value", "Keep their old price for a period if you can", "Charge new customers the new price", "Watch how many new say yes and how many existing leave"],
            why: "Existing first, kindly. New at the new price. Then read the two numbers.",
          },
          {
            kind: "choose",
            prompt: "Which cost do founders most often forget when pricing?",
            options: [
              { text: "Hosting.", good: false, why: "Small, and remembered." },
              { text: "Finding the customer and keeping them.", good: true, why: "Usually the biggest numbers, and the ones a low price cannot cover." },
              { text: "Their own salary.", good: false, why: "Often forgotten too; unit twelve covers it." },
            ],
          },
        ],
        remember: "Too low, costs forgotten, value not understood, wrong customers. A rise that loses nobody was not a rise.",
        apply: { key: "price", prompt: "Add a line: the next price rise you would try, by how much, and the number of lost customers you would accept.", hint: "Add to what you wrote." },
      },
    ],
  },
  {
    id: "unit-economics",
    section: "money",
    n: 11,
    name: "One customer's arithmetic",
    line: "Does a customer ever pay for themselves? Three numbers answer it.",
    guide: [
      "CAC: what it costs to get one customer. LTV: what one customer is worth over their whole time with you, in gross profit. Payback: how many months until a customer's profit has covered the cost of getting them.",
      "Working benchmarks: LTV at least three times CAC; payback under twelve months. Early on, 2:1 is acceptable while you prove the motion.",
      "Gross margin is what is left of a euro of revenue after the direct cost of serving that customer. Software is often 80%+; services and hardware much less. LTV is counted in gross profit, not revenue.",
      "These are estimates until you have customers. Estimate them anyway, out loud, so the shape is known before the money is spent.",
    ],
    lessons: [
      {
        id: "cac-ltv",
        n: 1,
        title: "CAC and LTV",
        minutes: 5,
        objective: "Define the two numbers, estimate them roughly for your own idea, and say what their ratio has to be.",
        teach: [
          "Two numbers decide whether a business can exist at all. Customer acquisition cost, CAC: everything you spend to get one customer — ads, your time, the free month, the sales call — divided by the number of customers it got you. Lifetime value, LTV: what one customer is worth over the whole time they stay, counted in gross profit, not revenue.",
          "The relationship is the point. If it costs €90 to get a customer who is worth €60, every customer loses you money, and growing faster loses it faster. The working rule: LTV should be at least three times CAC. Below that the business is fragile; at 1:1 it is a machine for turning money into customers who cost more than they bring.",
          "Early on, you are estimating. Estimate anyway. \"It takes me about three hours of visits to sign a café, and a café stays about a year at €30 a month with 80% margin\" gives CAC of three hours and LTV of about €290. Rough, honest, and enough to know the shape.",
        ],
        exercises: [
          {
            kind: "match",
            prompt: "Match each term to its meaning.",
            pairs: [
              { term: "CAC", meaning: "What it costs to get one customer, all in" },
              { term: "LTV", meaning: "What one customer is worth over their whole stay, in gross profit" },
              { term: "LTV:CAC", meaning: "Whether a customer ever pays for the cost of finding them" },
            ],
          },
          {
            kind: "choose",
            prompt: "You spend €300 on flyers and a weekend of visits, and sign three cafés. What is CAC?",
            options: [
              { text: "€300.", good: false, why: "That is the total. Divide by the customers it got." },
              { text: "€100 per café, plus the value of your weekend.", good: true, why: "All in, divided by three. Your time counts even when nobody paid for it." },
              { text: "€0; flyers are marketing, not acquisition.", good: false, why: "Everything spent to get a customer is acquisition." },
            ],
          },
          {
            kind: "fill",
            prompt: "The working rule: LTV should be at least ___ CAC.",
            options: ["equal to", "twice", "three times", "ten times"],
            answer: 2,
            why: "Three to one. Two to one is acceptable while proving the motion. One to one is a machine for losing money.",
          },
          {
            kind: "choose",
            prompt: "A customer costs €90 to get and is worth €60. What does growing faster do?",
            options: [
              { text: "Fixes it, through scale.", good: false, why: "Scale multiplies the loss. Every customer loses €30; ten times the customers loses ten times as much." },
              { text: "Loses money faster.", good: true, why: "Fix the ratio first — price, margin, retention, or a cheaper way to find them — then grow." },
              { text: "Nothing; the numbers are estimates.", good: false, why: "Estimates with this shape are a warning, not a shrug." },
            ],
          },
        ],
        remember: "CAC is what one costs; LTV is what one is worth in profit. Three to one, or growing makes it worse.",
        apply: { key: "unitEconomics", prompt: "Estimate roughly: what it costs you, in money and hours, to get one customer; what one is worth over their stay, in profit. Write the ratio.", hint: "Rough and labelled as a guess is fine. The shape is the point." },
      },
      {
        id: "margin-and-payback",
        n: 2,
        title: "Gross margin and payback",
        minutes: 5,
        objective: "Count LTV in gross profit, and work out how many months until a customer has paid for themselves.",
        teach: [
          "Gross margin is what is left of a euro of revenue after the direct costs of serving that customer: the hosting, the delivery, the ingredients, the person on the phone. Software often keeps 80% or more of each euro; a delivery service might keep 20%. LTV has to be counted in that leftover, not in revenue, or the ratio lies.",
          "Payback is the other number investors ask about and founders should ask themselves: how many months of a customer's gross profit until it has covered their CAC? If it costs €100 to get a customer who brings €25 of profit a month, payback is four months. Under twelve is good; twelve to eighteen is workable; over twenty-four is a business that needs someone else's money to grow, and that is a fact about it, not a feeling.",
          "Payback is about cash, and cash is about survival. A business with a great LTV:CAC and a thirty-month payback can be right and dead: right about the customer, dead because it ran out of cash waiting for them to pay back. Short payback is what lets you grow with your own money.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "A customer pays €30 a month. Serving them costs €6 a month. What is monthly gross profit?",
            options: [
              { text: "€30.", good: false, why: "That is revenue. Subtract the direct cost." },
              { text: "€24, an 80% margin.", good: true, why: "30 minus 6. The number LTV is built from." },
              { text: "€6.", good: false, why: "That is the cost, not what is left." },
            ],
          },
          {
            kind: "choose",
            prompt: "CAC is €100. Monthly gross profit per customer is €25. Payback?",
            options: [
              { text: "Four months.", good: true, why: "100 divided by 25. Comfortably under twelve." },
              { text: "Twenty-five months.", good: false, why: "Divide the cost by the monthly profit, not the other way round." },
              { text: "One month.", good: false, why: "That would need €100 of profit a month." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which payback periods let you grow with your own money?",
            buckets: ["Can grow on its own cash", "Needs someone else's money to grow"],
            items: [
              { text: "Six months.", bucket: 0, why: "Well under twelve. Each customer funds the next within half a year." },
              { text: "Thirty months.", bucket: 1, why: "Two and a half years of cash out before each customer is even. Right about the customer, and dependent on capital." },
              { text: "Eleven months.", bucket: 0, why: "Under twelve. Good." },
              { text: "Twenty-two months.", bucket: 1, why: "Workable with funding, dangerous without." },
            ],
          },
          {
            kind: "fill",
            prompt: "LTV must be counted in ___, not revenue.",
            options: ["gross profit", "cash", "orders", "months"],
            answer: 0,
            why: "What is left after serving them. A delivery business keeping 20% of revenue has an LTV one fifth of what its revenue suggests.",
          },
        ],
        remember: "Count LTV in what is left after serving them. Payback under twelve months is what lets you grow on your own cash.",
        apply: { key: "unitEconomics", prompt: "Add your gross margin (what is left of each euro) and your payback in months. Estimates are fine.", hint: "Add to what you wrote." },
      },
      {
        id: "when-it-works",
        n: 3,
        title: "When the arithmetic works, and when it never will",
        minutes: 4,
        objective: "Look at a rough set of numbers and say whether this business can ever work, and what would have to change.",
        teach: [
          "Put the four numbers together and the shape of the business is visible before a euro is spent. CAC, monthly gross profit, how long customers stay, payback. Some shapes work: cheap to acquire, decent margin, long stay. Some never will: expensive to acquire, thin margin, short stay — every customer is a small loss, and no amount of scale turns a loss into a profit.",
          "Four levers if the shape is wrong. Raise the price, which raises margin and LTV at once. Keep customers longer, which raises LTV without touching price. Cut the cost of serving them, which raises margin. Find a cheaper way to get them, which cuts CAC. Usually one lever is the obvious one, and it is usually price.",
          "The honest use of this: before you build, write the numbers as estimates and look at the shape. If it does not work on paper, with generous estimates, it will not work in life. That is not discouragement; it is a month of building saved.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Which shape can work?",
            buckets: ["Can work", "Never will as it stands"],
            items: [
              { text: "CAC €60, profit €20 a month, customers stay two years.", bucket: 0, why: "Payback three months, LTV €480, ratio 8:1." },
              { text: "CAC €400, profit €8 a month, customers stay six months.", bucket: 1, why: "LTV €48 against CAC €400. Every customer is a €350 loss." },
              { text: "CAC three hours of visits, profit €24 a month, customers stay a year.", bucket: 0, why: "LTV about €290 against a few hours. Works, if your hours stay cheap." },
              { text: "CAC €50, profit €2 a month, customers stay three months.", bucket: 1, why: "LTV €6. Thin margin and a short stay. No lever except all of them." },
            ],
          },
          {
            kind: "match",
            prompt: "Match each lever to what it moves.",
            pairs: [
              { term: "Raise the price", meaning: "Margin and LTV, both at once" },
              { term: "Keep customers longer", meaning: "LTV, without touching price" },
              { term: "Cut the cost of serving them", meaning: "Margin" },
              { term: "Find a cheaper way to get them", meaning: "CAC" },
            ],
          },
          {
            kind: "choose",
            prompt: "The numbers do not work on paper, even with generous guesses. What does this lesson say?",
            options: [
              { text: "Build it anyway; real numbers will be better.", good: false, why: "Real numbers are usually worse than generous guesses." },
              { text: "Find the lever — usually price — and rework the shape before building. If no lever fixes it, that is a month saved.", good: true, why: "The arithmetic is a test you can run for free." },
              { text: "Raise money to cover the gap.", good: false, why: "Money covers a gap that closes. This one widens with every customer." },
            ],
          },
          {
            kind: "fill",
            prompt: "Of the four levers, the obvious one is usually ___.",
            options: ["cutting costs", "price", "advertising", "hiring"],
            answer: 1,
            why: "Price moves margin and LTV together, and founders almost always have room to raise it.",
          },
        ],
        remember: "Four numbers show the shape before you spend a euro. If it does not work on paper with generous guesses, it will not work in life.",
        apply: { key: "unitEconomics", prompt: "Write one line: does your shape work on paper? If not, which lever, and by how much?", hint: "Add to what you wrote." },
      },
      {
        id: "depth-cohorts-and-churn",
        n: 4,
        title: "Depth: churn, and why averages lie",
        depth: true,
        minutes: 5,
        objective: "Turn a churn rate into a customer lifetime, and see why the retention curve beats the average.",
        teach: [
          "Churn is the share of customers who leave in a month. It converts to lifetime by a simple rule: one divided by the churn rate. 5% monthly churn means an average customer stays about twenty months. 20% means five. This is how \"how long do they stay?\" becomes a number you can multiply by monthly profit to get LTV.",
          "The average lies, in a specific way. Early customers churn fast — the curious, the wrong fit — and the ones who stay past the first months stay much longer. So a single churn number blends two populations, and the LTV it gives is wrong for both. The retention curve from unit nine is the honest version: it shows the drop, then the flat part, and the flat part is the customers whose lifetime is long.",
          "Practical use. Measure churn on customers past their third month separately from new ones. If the old ones barely leave, your problem is the first ninety days, not the product; fix onboarding. If they leave steadily at every age, the product is not yet a habit for anyone; go back to fit.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Monthly churn is 4%. Average customer lifetime?",
            options: [
              { text: "Four months.", good: false, why: "One divided by the rate, not the rate itself." },
              { text: "About twenty-five months.", good: true, why: "1 ÷ 0.04. Multiply by monthly profit for LTV." },
              { text: "Forty months.", good: false, why: "That would be 2.5% churn." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why is a single churn number misleading?",
            options: [
              { text: "Because customers lie about leaving.", good: false, why: "Leaving is not a survey. They just leave." },
              { text: "Because it blends fast-leaving new customers with slow-leaving old ones, and is wrong for both.", good: true, why: "Two populations, one average. The curve shows them separately." },
              { text: "Because it changes every month.", good: false, why: "It does, and that is not the deep problem." },
            ],
          },
          {
            kind: "sort",
            prompt: "What does each pattern tell you to fix?",
            buckets: ["Fix the first ninety days", "Go back to fit"],
            items: [
              { text: "New customers churn 15% a month; customers past month three churn 2%.", bucket: 0, why: "The old ones stay. The product works; the start does not." },
              { text: "Customers churn about 12% a month at every age.", bucket: 1, why: "Nobody has made it a habit. The problem is deeper than onboarding." },
              { text: "Half leave in month one, then almost none.", bucket: 0, why: "A cliff at the start and a flat line after. Fix the cliff." },
              { text: "The retention curve never flattens.", bucket: 1, why: "Unit nine's sign of no fit, for anyone." },
            ],
          },
          {
            kind: "fill",
            prompt: "Measure churn on customers past their third month ___ from new ones.",
            options: ["together with", "separately", "instead of", "before"],
            answer: 1,
            why: "Two populations, two numbers. Then you know which problem you have.",
          },
        ],
        remember: "Lifetime is one over churn. The average hides a cliff and a flat line; measure old and new customers apart.",
        apply: { key: "unitEconomics", prompt: "If you have customers: churn for new ones and for ones past three months. If not: what churn you would need for the shape to work.", hint: "Add to what you wrote." },
      },
    ],
  },
  {
    id: "runway",
    section: "money",
    n: 12,
    name: "Runway",
    line: "Know the month the money runs out, and move it by choice, not by surprise.",
    guide: [
      "Runway is cash divided by monthly burn: how many months until zero. Burn is what goes out minus what comes in. Every founder should be able to say the month.",
      "Default alive or default dead (Paul Graham): if spending stays flat and revenue keeps growing at its recent rate, do you reach break-even before the cash runs out? Alive if yes, dead if no. Know which, every month.",
      "Ramen profitable: enough revenue to cover the founders' living costs. Once there, you are default alive, and every choice after is made from strength.",
      "The founder salary is a line of arithmetic, not a feeling: this much, for this long, costs this many months of runway.",
    ],
    lessons: [
      {
        id: "the-date",
        n: 1,
        title: "The date the money runs out",
        minutes: 4,
        objective: "Work out runway from cash and burn, and say the month out loud.",
        teach: [
          "Three numbers. Cash: what is in the account today. Burn: what goes out each month minus what comes in. Runway: cash divided by burn — how many months until zero. Twelve thousand in the bank, two thousand a month net out: six months. That is a date, and it should be on the wall.",
          "Founders avoid this number because it is frightening, and avoiding it is how a frightening number becomes a fatal one. The number is not the danger; not knowing it is. A founder who knows they have six months makes different decisions in month two than a founder who finds out in month five.",
          "It moves, and you can move it. Spend less: runway lengthens. Earn more: burn falls, runway lengthens. Raise money: cash rises. Every one of those is a choice, and the point of knowing the date is to make the choice on purpose, early, rather than under a deadline.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "€18,000 in the bank. €3,000 a month goes out; €1,000 a month comes in. Runway?",
            options: [
              { text: "Six months.", good: false, why: "Burn is net: 3,000 minus 1,000 is 2,000." },
              { text: "Nine months.", good: true, why: "18,000 divided by a net burn of 2,000." },
              { text: "Eighteen months.", good: false, why: "That ignores the spending entirely." },
            ],
          },
          {
            kind: "match",
            prompt: "Match each term to its meaning.",
            pairs: [
              { term: "Cash", meaning: "What is in the account today" },
              { term: "Burn", meaning: "What goes out each month, minus what comes in" },
              { term: "Runway", meaning: "Cash divided by burn: months until zero" },
            ],
          },
          {
            kind: "choose",
            prompt: "Why do founders avoid knowing their runway?",
            options: [
              { text: "Because it is hard to calculate.", good: false, why: "It is one division." },
              { text: "Because it is frightening, and avoiding it turns a frightening number into a fatal one.", good: true, why: "The number is not the danger. Not knowing it is." },
              { text: "Because it changes.", good: false, why: "It does. Recalculate monthly; it takes a minute." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these lengthens runway?",
            buckets: ["Lengthens it", "Shortens it"],
            items: [
              { text: "A customer starts paying €500 a month.", bucket: 0, why: "Burn falls by 500." },
              { text: "Hiring a part-time helper.", bucket: 1, why: "Burn rises." },
              { text: "Moving from an office to the kitchen table.", bucket: 0, why: "Burn falls." },
              { text: "Paying yourself a salary.", bucket: 1, why: "Sometimes right, and it shortens the runway. Lesson three." },
            ],
          },
        ],
        remember: "Cash divided by net burn. Say the month. Move it on purpose, early.",
        apply: { key: "runway", prompt: "Cash today, net burn per month, and the month the money runs out. If there is no company money yet, write your personal version: how long can you work on this before you need income?", hint: "A real number. This is the one that matters." },
      },
      {
        id: "default-alive",
        n: 2,
        title: "Default alive or default dead",
        minutes: 5,
        objective: "Answer Paul Graham's question for your own company, and say what changes depending on the answer.",
        teach: [
          "Paul Graham's question, which he found most founders could not answer: assuming your spending stays flat and your revenue keeps growing at the rate it has recently, do you reach the point where revenue covers spending before the cash runs out? If yes, you are default alive: left alone, you live. If no, you are default dead: left alone, you die, and something has to change.",
          "The answer decides how you should be spending your time. Default alive founders can afford to be patient, to experiment, to say no to bad money. Default dead founders have one job — become default alive — and every other job, including most product work, is a distraction from it until it is done.",
          "Two ways out of default dead. Grow revenue faster, which usually means doing more of the unscalable things that found the first customers. Or cut spending, which usually means not hiring the people you were about to hire. Graham's observation: founders who ask the question early almost always find they can fix it; the ones who find out at month five of six mostly cannot.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Revenue €2,000 a month, growing €300 a month. Spending €5,000 a month. Cash €18,000. Default alive or dead?",
            options: [
              { text: "Alive; revenue is growing.", good: false, why: "Growing, but revenue reaches 5,000 in ten months and the cash lasts about six at this burn. Dead." },
              { text: "Dead: the cash runs out before revenue covers spending, unless something changes.", good: true, why: "Ten months to break-even, roughly six months of cash. Something has to change, now." },
              { text: "Cannot say without a forecast.", good: false, why: "This is the forecast. Two lines and a division." },
            ],
          },
          {
            kind: "choose",
            prompt: "You are default dead. What is your one job?",
            options: [
              { text: "Finish the product.", good: false, why: "A distraction until you are alive, unless finishing it is what makes revenue grow." },
              { text: "Become default alive: grow revenue faster or cut spending.", good: true, why: "Everything else waits. This is the definition of the situation." },
              { text: "Raise a round.", good: false, why: "One option, and a hard one to raise while default dead. Cutting and growing are in your hands." },
            ],
          },
          {
            kind: "fill",
            prompt: "The question assumes spending stays ___ and revenue keeps growing at its recent rate.",
            options: ["zero", "flat", "falling", "rising"],
            answer: 1,
            why: "Flat spending, recent growth. No optimism, no pessimism: just the line continued.",
          },
          {
            kind: "sort",
            prompt: "Which of these does a default-alive founder get to do that a default-dead one does not?",
            buckets: ["Alive can", "Dead cannot afford to"],
            items: [
              { text: "Say no to an investor whose terms are bad.", bucket: 0, why: "Patience is a privilege of the living." },
              { text: "Spend a month on a redesign.", bucket: 1, why: "Unless the redesign is what grows revenue, it is a month closer to zero." },
              { text: "Run a slow experiment with an uncertain payoff.", bucket: 0, why: "Experiments are what alive founders do." },
              { text: "Hire ahead of revenue.", bucket: 1, why: "The commonest way to become default dead." },
            ],
          },
        ],
        remember: "Flat spending, recent growth: do you break even before zero? If not, becoming alive is the only job.",
        apply: { key: "runway", prompt: "Add a line: default alive or default dead, and the arithmetic that says so. If dead, the one thing that changes it.", hint: "Add to what you wrote." },
      },
      {
        id: "founder-salary",
        n: 3,
        title: "Ramen profitable, and the founder's salary",
        minutes: 4,
        objective: "Decide the founder salary as a line of arithmetic, and say what ramen profitable buys you.",
        teach: [
          "Ramen profitable is Graham's phrase for a company earning enough to cover the founders' living costs. Not a big salary — enough to eat and pay rent. It matters out of proportion to its size, because a ramen-profitable company is default alive. Nobody can kill it by declining to fund it. Every decision after that is made from strength.",
          "The founder salary is where runway and life meet, and it should be arithmetic, not a feeling. This much a month, for this many months, costs this many months of runway. A founder paying themselves €2,000 a month from €24,000 of cash has given themselves a year and the company nothing. The same founder on €500 with a part-time job on the side has given the company a lot longer.",
          "There is no right answer, only an honest one. Not paying yourself for a year is a real cost — to you, and to the company if it means you cannot keep going. Paying yourself well shortens the runway. Write both numbers and choose, and revisit it every quarter.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Why does ramen profitability matter more than its size suggests?",
            options: [
              { text: "Because it impresses investors.", good: false, why: "It does. That is a side effect." },
              { text: "Because a company that covers its founders' living costs is default alive, and nobody can kill it by not funding it.", good: true, why: "Strength. Every decision after is made from it." },
              { text: "Because it means the product works.", good: false, why: "It means enough people pay to keep you fed. That is related, and not the same." },
            ],
          },
          {
            kind: "choose",
            prompt: "€24,000 in cash, no revenue. Salary of €2,000 a month to the founder, nothing else. What did that choice cost?",
            options: [
              { text: "Nothing; founders should be paid.", good: false, why: "Whether they should is one question. What it costs is a number: the entire runway, in a year, with nothing spent on the company." },
              { text: "Twelve months of runway, all of it, on the founder.", good: true, why: "The arithmetic. It may still be the right choice. It should be made knowing this." },
              { text: "Two months.", good: false, why: "24,000 divided by 2,000 is twelve." },
            ],
          },
          {
            kind: "fill",
            prompt: "The founder salary should be ___, not a feeling.",
            options: ["generous", "zero", "a line of arithmetic", "market rate"],
            answer: 2,
            why: "This much, for this long, costs this many months. Then choose.",
          },
          {
            kind: "sort",
            prompt: "True or false?",
            buckets: ["True", "False"],
            items: [
              { text: "Not paying yourself is free.", bucket: 1, why: "It costs you, and it costs the company if it means you cannot continue." },
              { text: "Ramen profitable means default alive.", bucket: 0, why: "Revenue covers what it takes to keep going." },
              { text: "The salary decision should be revisited quarterly.", bucket: 0, why: "Runway changes. So should the arithmetic." },
            ],
          },
        ],
        remember: "Ramen profitable is default alive. The salary is arithmetic: this much, for this long, costs this many months.",
        apply: { key: "runway", prompt: "Add a line: what you pay yourself, or would, and how many months of runway that costs. Then what revenue would make you ramen profitable.", hint: "Add to what you wrote." },
      },
      {
        id: "depth-forecast",
        n: 4,
        title: "Depth: a three-line forecast, and when to raise",
        depth: true,
        minutes: 5,
        objective: "Build a forecast in three lines a month, and use it to decide when — if ever — outside money is needed.",
        teach: [
          "A founder's forecast does not need a model. It needs three lines a month, twelve months out: revenue, spending, cash at month end. Revenue grows at the rate you have actually seen, not the rate in the pitch. Spending is what you actually spend, plus what you have actually decided to add. Cash at month end is last month's cash plus revenue minus spending. Where the cash line crosses zero is the date; whether the revenue line crosses the spending line before that is default alive or dead.",
          "Update it monthly with real numbers. The forecast is not a prediction; it is a way of noticing early. When a month comes in worse than the line, you have eleven months of warning instead of one.",
          "When to raise money, if you are going to. From strength, not need: the best time is when the three lines say you are default alive and growing, because then the money buys speed rather than survival, and the terms are yours. The worst time is month five of six. If the forecast says you will need money, start the conversation the month you see it, not the month you feel it.",
        ],
        exercises: [
          {
            kind: "order",
            prompt: "Build the forecast in the order this lesson gives.",
            steps: ["Revenue each month, growing at the rate you have actually seen", "Spending each month, what you spend plus what you have decided to add", "Cash at month end: last month plus revenue minus spending", "Find where cash crosses zero, and whether revenue crosses spending first"],
            why: "Three lines and two crossings. That is the whole forecast.",
          },
          {
            kind: "choose",
            prompt: "What growth rate goes in the revenue line?",
            options: [
              { text: "The rate in the pitch deck.", good: false, why: "Hope. The forecast is for noticing, not persuading." },
              { text: "The rate you have actually seen recently.", good: true, why: "The line continued. Optimism belongs elsewhere." },
              { text: "Zero, to be safe.", good: false, why: "Too pessimistic to be useful. The point is the real line." },
            ],
          },
          {
            kind: "choose",
            prompt: "When is the best time to raise money, if you are going to?",
            options: [
              { text: "When you are about to run out.", good: false, why: "The worst time. The terms are theirs and the money buys survival." },
              { text: "When the forecast says you are default alive and growing.", good: true, why: "From strength. The money buys speed, and the terms are yours." },
              { text: "As early as possible, before revenue.", good: false, why: "Possible for some. Expensive in equity, and unnecessary for many." },
            ],
          },
          {
            kind: "fill",
            prompt: "Start the money conversation the month you ___ it, not the month you feel it.",
            options: ["need", "see", "want", "budget"],
            answer: 1,
            why: "The forecast shows it months early. That is the whole reason to keep one.",
          },
        ],
        remember: "Three lines a month, twelve months out, real rates. Raise from strength or not at all; start the month you see it.",
        apply: { key: "runway", prompt: "Add a line: the month, if any, your three-line forecast says you would need outside money, and whether you would rather not.", hint: "Add to what you wrote. Do the forecast on paper first; it takes fifteen minutes." },
      },
    ],
  },
];
