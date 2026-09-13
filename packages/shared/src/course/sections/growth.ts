/**
 * SECTION 5: GROWTH.
 *
 * The first customers by hand, then channels, then the one number.
 */
import type { Unit } from "../content.ts";

export const GROWTH: Unit[] = [
  {
    id: "first-ten",
    section: "growth",
    n: 13,
    name: "The first customers, by hand",
    line: "Nobody's first ten customers came from a machine.",
    guide: [
      "The first ten come from you, one at a time: people you know, places you go, communities you are in. Then the first hundred, mostly the same way, plus the first ten telling people.",
      "Early adopters gather in specific places: forums, groups, the back room of the trade association, the comments under a rival's product. Go where they already are.",
      "Ask for the introduction. Every customer knows three more. A founder who does not ask for the next name is leaving the cheapest channel there is on the table.",
      "Measure the effort per customer honestly. Hours count. It is fine for the first ten to cost a weekend each; it is not fine to pretend they were free.",
    ],
    lessons: [
      {
        id: "where-they-are",
        n: 1,
        title: "Go where they already are",
        minutes: 4,
        objective: "Find the specific places your early adopters already gather, and show up there as a member first.",
        teach: [
          "Your first customers are not spread evenly across the world. They are clustered, in a few places, because people with the same problem find each other. A forum. A Facebook group. A trade association's back room. A Slack. The comments under a rival's product. The Saturday market. Your job is to find those places and be in them.",
          "Be a member before you are a seller. Answer questions. Ask about their week. Bring something useful. A person who has been helpful in a group for a month can say \"I'm working on something for this, would anyone talk to me for ten minutes?\" and get five replies. A stranger who posts a link gets removed.",
          "Two or three places, not twenty. Depth in one community beats presence in a dozen, because trust is built by being recognised, and recognition takes repetition.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Which of these is going where early adopters already are?",
            buckets: ["Where they already are", "Hoping they come to you"],
            items: [
              { text: "The independent café owners' group on Facebook, where you have answered three questions this month.", bucket: 0, why: "They gather there, and you are known there." },
              { text: "A launch on a general start-up site.", bucket: 1, why: "Founders and the curious. Not café owners." },
              { text: "The trade association's monthly meeting.", bucket: 0, why: "The back room. Show up twice and you are a face." },
              { text: "A billboard.", bucket: 1, why: "Everyone, which is nobody." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why be a member before a seller?",
            options: [
              { text: "Because it is polite.", good: false, why: "It is. It is also the only thing that works." },
              { text: "Because a person who has been useful can ask for ten minutes and get five replies; a stranger with a link gets removed.", good: true, why: "Trust first. The ask comes after." },
              { text: "Because groups ban sellers.", good: false, why: "Many do. The reason to be a member is deeper than avoiding the ban." },
            ],
          },
          {
            kind: "fill",
            prompt: "Depth in ___ community beats presence in a dozen.",
            options: ["one", "the biggest", "an online", "a paid"],
            answer: 0,
            why: "Recognition takes repetition. Two or three places, not twenty.",
          },
          {
            kind: "choose",
            prompt: "You have found the group where your customers gather. What is the first thing you post?",
            options: [
              { text: "A link to your landing page.", good: false, why: "A stranger with a link." },
              { text: "Nothing yet. An answer to someone else's question, this week and next.", good: true, why: "Member first. The ask comes when you are a face." },
              { text: "A survey.", good: false, why: "A survey from a stranger is a link with extra steps." },
            ],
          },
        ],
        remember: "Find the two or three places they gather. Be useful there before you ask for anything.",
        apply: { key: "firstTen", prompt: "Name two or three specific places your early adopters already gather, and what you will do in each this week that is useful to them.", hint: "Add to what you wrote. Names of groups, not kinds of groups." },
      },
      {
        id: "the-ask",
        n: 2,
        title: "The ask, and the next name",
        minutes: 4,
        objective: "Make a small, specific ask, and get the next introduction from every conversation.",
        teach: [
          "The ask that works is small and specific. Not \"would you be interested in my product\" but \"could I have ten minutes on Thursday to hear how you handle this?\" or \"would you try this for a week if I set it up for you?\" Small enough to say yes to without thinking; specific enough that yes means something.",
          "Then the cheapest channel in the world: the next name. Every customer knows three more people with the same problem. At the end of every conversation — good or bad — ask: \"Who else do you know who deals with this?\" and then, \"Would you mind introducing us?\" An introduction from a peer is worth twenty cold messages.",
          "Founders skip the second ask because it feels pushy. It is the opposite: you are asking them to help someone they know. Most people like being that person.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "A good ask or a bad one?",
            buckets: ["Small and specific", "Big or vague"],
            items: [
              { text: "\"Could I have ten minutes on Thursday to hear how you handle regulars?\"", bucket: 0, why: "A time, a topic, a small cost." },
              { text: "\"Would you be interested in a loyalty solution?\"", bucket: 1, why: "Vague, and about your idea." },
              { text: "\"If I set it up on your till this week, would you try it for a fortnight?\"", bucket: 0, why: "Specific, and you carry the effort." },
              { text: "\"Let me know if you ever want to chat.\"", bucket: 1, why: "Never is when they will let you know." },
            ],
          },
          {
            kind: "choose",
            prompt: "What is the cheapest channel in the world?",
            options: [
              { text: "Social media.", good: false, why: "Cheap to post; expensive to be heard." },
              { text: "The next name: an introduction from someone you just talked to.", good: true, why: "A peer's introduction is worth twenty cold messages, and it costs one question." },
              { text: "Email.", good: false, why: "Cold email is cheap and mostly ignored." },
            ],
          },
          {
            kind: "fill",
            prompt: "At the end of every conversation ask: \"Who else do you know who ___?\"",
            options: ["might invest", "deals with this", "likes new apps", "runs a business"],
            answer: 1,
            why: "Same problem, next person. Then ask for the introduction.",
          },
          {
            kind: "choose",
            prompt: "Why do founders skip asking for the next name?",
            options: [
              { text: "Because it does not work.", good: false, why: "It works better than almost anything." },
              { text: "Because it feels pushy — though you are actually asking them to help someone they know, which most people like.", good: true, why: "Reframe it and the fear goes." },
              { text: "Because they forget.", good: false, why: "Often. Write it on the list of questions." },
            ],
          },
        ],
        remember: "Ask for ten minutes, or a week's trial you set up yourself. Then ask who else, and for the introduction.",
        apply: { key: "questions", prompt: "Add the exact words of your ask and of your request for the next name.", hint: "Add to your questions list." },
      },
      {
        id: "first-hundred",
        n: 3,
        title: "From ten to a hundred",
        minutes: 4,
        objective: "Get from the first ten customers to the first hundred without a machine, and know when the machine is due.",
        teach: [
          "The first ten came by hand. The first hundred come mostly the same way, plus the first ten telling people, plus you now knowing exactly what to say because you have said it fifty times. It is still unscalable and it is still right; a hundred customers by hand is a real company.",
          "What changes between ten and a hundred is that you start to see patterns. The same objection three times. The same kind of person saying yes fastest. The same place producing most of the names. Those patterns are the first draft of your channel — the thing that, later, finds customers without you in the room.",
          "The machine is due when the by-hand method is the bottleneck and the patterns are clear: you know who buys, what they say when they do, and where they were. Not before. A machine built before the patterns are known automates a guess.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "How do the first hundred customers mostly arrive?",
            options: [
              { text: "Through advertising, now that the product is proven.", good: false, why: "Ads before the patterns are known buy the wrong people." },
              { text: "The same way as the first ten, plus those ten telling people, plus you being much better at it.", good: true, why: "Still by hand. Still right." },
              { text: "Through a launch.", good: false, why: "A launch brings the curious for a week." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these is a pattern worth writing down?",
            buckets: ["A pattern", "Noise"],
            items: [
              { text: "Every owner who said yes within a week had a second location.", bucket: 0, why: "Who buys fastest. The first draft of your customer." },
              { text: "One owner wore a red jumper.", bucket: 1, why: "Noise." },
              { text: "The same objection about the till came up in four of six conversations.", bucket: 0, why: "What they say. Fix it or answer it." },
              { text: "Most of the introductions came from the trade group, not the online forum.", bucket: 0, why: "Where they were. The first draft of the channel." },
            ],
          },
          {
            kind: "choose",
            prompt: "When is the machine due?",
            options: [
              { text: "As soon as you have a product.", good: false, why: "A machine built before the patterns are known automates a guess." },
              { text: "When by-hand is the bottleneck and you know who buys, what they say, and where they were.", good: true, why: "Then the machine is automating something you have already seen work." },
              { text: "Never; the best companies stay manual.", good: false, why: "No. But later than founders think." },
            ],
          },
          {
            kind: "fill",
            prompt: "A hundred customers by hand is a ___.",
            options: ["failure to scale", "real company", "hobby", "pilot"],
            answer: 1,
            why: "Real revenue from real people. The machine comes after, informed by them.",
          },
        ],
        remember: "Ten to a hundred is still by hand. Watch for the patterns; they are the first draft of the channel.",
        apply: { key: "firstTen", prompt: "Add a line: the pattern you have seen so far, if any, about who says yes fastest and where they came from.", hint: "Add to what you wrote. 'None yet' is an honest answer." },
      },
      {
        id: "depth-referral-loops",
        n: 4,
        title: "Depth: word of mouth, on purpose",
        depth: true,
        minutes: 5,
        objective: "Turn the accidental referrals into a loop, and measure whether it is one.",
        teach: [
          "Word of mouth is the channel everyone wants and nobody designs. It can be designed, a little. Three parts: a moment worth telling — something the product does that a customer would mention unprompted; a reason to tell — sometimes an incentive, more often just making it easy; and a way to measure — asking every new customer how they heard, and counting.",
          "The measure is the viral coefficient, which sounds grander than it is: for every customer, how many new customers do they bring, on average? If it is 0.3, every ten customers bring three more, which is a helpful tailwind. If it is above 1, the product grows on its own, which is rare and mostly a property of products people use together. Most good businesses live between 0.2 and 0.6 and are glad of it.",
          "Incentives are a tool with a cost. A referral reward brings referrals; it also brings people who came for the reward. Use them after the product is one people would mention anyway, not instead of that.",
        ],
        exercises: [
          {
            kind: "order",
            prompt: "Put the three parts of designed word of mouth in the order this lesson gives.",
            steps: ["A moment worth telling", "A reason, or an easy way, to tell", "A way to measure: ask every new customer how they heard, and count"],
            why: "Something to say, a way to say it, and a count. Without the count you are guessing."
          },
          {
            kind: "choose",
            prompt: "Every ten customers bring, between them, four new ones. What is the viral coefficient, and what does it mean?",
            options: [
              { text: "4; the product is viral.", good: false, why: "Four per ten, not four per one." },
              { text: "0.4; a helpful tailwind, not self-sustaining growth.", good: true, why: "Below 1, the loop helps; above 1, it carries. Most good businesses are below." },
              { text: "40%; retention is good.", good: false, why: "Different number. This is about bringing others, not staying." },
            ],
          },
          {
            kind: "choose",
            prompt: "When should you add a referral reward?",
            options: [
              { text: "From day one, to get the loop going.", good: false, why: "It brings people who came for the reward, before there is anything worth mentioning." },
              { text: "After the product is one people would mention anyway.", good: true, why: "A reward amplifies a real loop. It cannot create one." },
              { text: "Never; rewards are manipulative.", good: false, why: "A tool with a cost, not a sin." },
            ],
          },
          {
            kind: "sort",
            prompt: "A moment worth telling, or not?",
            buckets: ["Worth telling", "Nobody would mention it"],
            items: [
              { text: "The café owner got a text saying three lapsed regulars came back this week.", bucket: 0, why: "A result, with a number, that she will say to the owner next door." },
              { text: "The app got a new icon.", bucket: 1, why: "Nobody has ever told a friend about an icon." },
              { text: "A regular got a free coffee on their tenth visit and told the table.", bucket: 0, why: "A moment for the customer's customer. Two loops at once." },
              { text: "The settings page loads faster.", bucket: 1, why: "Good. Silent." },
            ],
          },
        ],
        remember: "A moment worth telling, an easy way to tell, and a count. Below 1 is a tailwind; rewards amplify a loop that exists.",
        apply: { key: "channel", prompt: "Write the moment in your product a customer would mention unprompted, if there is one, and how you will ask new customers how they heard.", hint: "Two lines." },
      },
    ],
  },
  {
    id: "channels",
    section: "growth",
    n: 14,
    name: "Channels",
    line: "Nineteen ways customers can find you. One of them works for you. Find it cheaply.",
    guide: [
      "Traction (Weinberg and Mares) lists nineteen channels: viral, PR, unconventional PR, search ads, social ads, offline ads, search engine optimisation, content, email, engineering as marketing, targeting blogs, business development, sales, affiliates, existing platforms, trade shows, offline events, speaking, community.",
      "The Bullseye method: brainstorm how every channel could work for you; rank them by likely impact, confidence, and cost of a small test; test the top three cheaply in parallel; focus on the one that works.",
      "One channel at a time, once found. Spreading across five channels is how a small team does none of them well.",
      "The channel is usually not the one you expected. That is why you test rather than guess.",
    ],
    lessons: [
      {
        id: "nineteen-channels",
        n: 1,
        title: "The nineteen channels",
        minutes: 5,
        objective: "Name the kinds of channel that exist, and stop thinking of marketing as one thing.",
        teach: [
          "Founders say \"marketing\" as if it were one activity. It is nineteen, at least, and they have almost nothing in common. Gabriel Weinberg and Justin Mares listed them in Traction: viral loops, public relations, unconventional PR (stunts), search ads, social and display ads, offline ads, search engine optimisation, content, email, engineering as marketing (free tools), targeting blogs, business development (partnerships), direct sales, affiliates, existing platforms (app stores, marketplaces), trade shows, offline events, speaking, and community.",
          "Each one is a different job with different skills, and each works for some businesses and not others. Sales works for expensive things bought by few people. Content and search work for problems people already type into a search box. Existing platforms work when your customers are already on one. Community works when your customers talk to each other. Trade shows work when they all go to the same room once a year.",
          "The useful move is to stop asking \"how do I market this?\" and start asking, for each of the nineteen, \"could this one work for us, and how would I find out for a hundred euros?\"",
        ],
        exercises: [
          {
            kind: "match",
            prompt: "Match the business to the channel most likely to fit.",
            pairs: [
              { term: "Expensive software for hospitals, bought by a few people", meaning: "Direct sales" },
              { term: "A tool for a problem people type into a search box", meaning: "Search engine optimisation and content" },
              { term: "A product for people who all go to one trade show a year", meaning: "Trade shows" },
              { term: "A product for people who already talk to each other online", meaning: "Community" },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these is a channel, and which is a wish?",
            buckets: ["A channel", "A wish"],
            items: [
              { text: "Existing platforms: listing on the app store that café tills already use.", bucket: 0, why: "Where the customers already are, with a listing you can make." },
              { text: "Going viral.", bucket: 1, why: "Viral is a channel with a mechanism. 'Going viral' is a hope." },
              { text: "Engineering as marketing: a free calculator that shows a café what its regulars are worth.", bucket: 0, why: "A tool that draws the right people and shows the value." },
              { text: "Getting famous.", bucket: 1, why: "PR is a channel. Fame is a lottery." },
            ],
          },
          {
            kind: "choose",
            prompt: "What is wrong with asking \"how do I market this?\"",
            options: [
              { text: "Nothing; it is the right question.", good: false, why: "It treats nineteen different jobs as one." },
              { text: "It treats nineteen different channels as one activity, and so gets a vague answer.", good: true, why: "Ask it nineteen times, once per channel, and the answers get specific." },
              { text: "Marketing does not work for start-ups.", good: false, why: "It works. It is nineteen things." },
            ],
          },
          {
            kind: "fill",
            prompt: "The useful question for each channel: could this work for us, and how would I find out for ___?",
            options: ["a year", "a hundred euros", "free", "a month"],
            answer: 1,
            why: "Cheap and fast. Enough to see a signal, not enough to hurt.",
          },
        ],
        remember: "Marketing is nineteen different jobs. Ask, for each, whether it could work and how to test it cheaply.",
        apply: { key: "channel", prompt: "List the three channels, from the nineteen, that seem most likely for your customers, and one line each on why.", hint: "Add to what you wrote." },
      },
      {
        id: "bullseye",
        n: 2,
        title: "Bullseye",
        minutes: 4,
        objective: "Run the Bullseye method: brainstorm, rank, test three cheaply, focus on one.",
        teach: [
          "Bullseye is a way of choosing a channel without guessing. Three rings. The outer ring: brainstorm, for every one of the nineteen, how it could possibly work for you — even the silly ones, because the channel that works is often the one you would have dismissed. The middle ring: rank them by three things — how big the impact could be, how confident you are, and how cheap a small test would be. Pick the top three. The inner ring: test those three, cheaply, at the same time, and focus on whichever shows a signal.",
          "The tests are small on purpose. A hundred euros of ads. Ten cold emails. One post in the community. One afternoon at the trade group. You are looking for a signal — a customer, a reply rate, a click — not a result. A signal tells you which channel to spend real effort on.",
          "Then focus. One channel, worked hard, until it stops working. A small team spreading across five channels does none of them well enough to learn anything.",
        ],
        exercises: [
          {
            kind: "order",
            prompt: "Put the Bullseye rings in order.",
            steps: ["Brainstorm how every one of the nineteen could work, including the silly ones", "Rank by likely impact, confidence, and cost of a small test; pick three", "Test the three cheaply, in parallel, for a signal", "Focus on the one that showed a signal"],
            why: "Outer ring, middle ring, inner ring, then the centre.",
          },
          {
            kind: "sort",
            prompt: "Is this a cheap test or a commitment?",
            buckets: ["A cheap test", "A commitment"],
            items: [
              { text: "€100 of search ads on three phrases for a week.", bucket: 0, why: "A signal for a hundred euros." },
              { text: "Hiring a salesperson.", bucket: 1, why: "A commitment before the channel is known to work." },
              { text: "One post asking for ten-minute conversations in the trade group.", bucket: 0, why: "Free, fast, a reply rate." },
              { text: "A six-month content strategy.", bucket: 1, why: "Six months before a signal. Write three posts first." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why brainstorm the silly channels too?",
            options: [
              { text: "For completeness.", good: false, why: "Partly. There is a better reason." },
              { text: "Because the channel that works is often the one you would have dismissed.", good: true, why: "Guessing is what Bullseye exists to replace." },
              { text: "Because investors ask.", good: false, why: "They do not, usually." },
            ],
          },
          {
            kind: "choose",
            prompt: "Three tests ran. One produced two customers, two produced nothing. What now?",
            options: [
              { text: "Keep all three going; diversification is safer.", good: false, why: "A small team across three channels does none well." },
              { text: "Focus on the one with the signal and work it hard.", good: true, why: "The centre of the bullseye." },
              { text: "Test three more.", good: false, why: "You have a signal. Follow it before looking for another." },
            ],
          },
        ],
        remember: "Brainstorm all nineteen, rank, test three cheaply, focus on one.",
        apply: { key: "channel", prompt: "For each of your three channels, write the hundred-euro test: what you will do, and what signal you are looking for.", hint: "Add to what you wrote." },
      },
      {
        id: "one-channel",
        n: 3,
        title: "One channel, worked hard",
        minutes: 4,
        objective: "Commit to the channel that showed a signal, and know what \"worked hard\" means for it.",
        teach: [
          "Once a channel shows a signal, the temptation is to add another. Resist it. Most successful companies got their first serious growth from one channel, worked much harder than seemed reasonable. Not because other channels were bad, but because a channel rewards depth: the tenth iteration of a search ad, the fiftieth community post, the two-hundredth sales call. The learning compounds inside a channel and not across them.",
          "Worked hard means: measure it weekly, change one thing at a time, and keep going past the point where it feels done. A founder who tries a channel for two weeks and moves on has tested nothing; the first two weeks of any channel are bad.",
          "A channel stops working, eventually. It saturates, gets expensive, or the platform changes the rules. When the weekly number has fallen for a month despite real effort, that is the time to go back to the rings and pick the next one — not before.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Why does one channel beat three?",
            options: [
              { text: "Because it is cheaper.", good: false, why: "Often. Not the reason." },
              { text: "Because learning compounds inside a channel and not across them.", good: true, why: "The fiftieth post in one place is worth more than the fifth in ten." },
              { text: "Because customers get confused by multiple channels.", good: false, why: "They do not notice." },
            ],
          },
          {
            kind: "fill",
            prompt: "The first ___ of any channel are bad.",
            options: ["two weeks", "two days", "two customers", "two tests"],
            answer: 0,
            why: "Which is why trying one for a fortnight and moving on has tested nothing.",
          },
          {
            kind: "sort",
            prompt: "Time to change channel, or keep going?",
            buckets: ["Keep going", "Back to the rings"],
            items: [
              { text: "Week three of the community channel; two replies so far; you have changed the wording twice.", bucket: 0, why: "Early. Real effort has barely started." },
              { text: "Search ads: the weekly number has fallen four weeks running despite new phrases and new pages.", bucket: 1, why: "A month of decline against real effort. Saturated." },
              { text: "The trade group produced a customer a month for six months and then the group closed.", bucket: 1, why: "The rules changed. Next ring." },
              { text: "Cold email has a 4% reply rate and you have sent forty.", bucket: 0, why: "A signal. Send four hundred." },
            ],
          },
          {
            kind: "choose",
            prompt: "What does \"worked hard\" mean for a channel?",
            options: [
              { text: "Spending more money on it.", good: false, why: "Sometimes. Mostly it means iterations." },
              { text: "Measure weekly, change one thing at a time, keep going past where it feels done.", good: true, why: "The compounding is in the iterations." },
              { text: "Posting every day.", good: false, why: "Frequency without measurement is noise." },
            ],
          },
        ],
        remember: "One channel, measured weekly, one change at a time, past where it feels done. Change channel after a month of real decline.",
        apply: { key: "channel", prompt: "Add a line: the one channel you will commit to for the next eight weeks, and the weekly number you will watch.", hint: "Add to what you wrote." },
      },
      {
        id: "depth-channel-economics",
        n: 4,
        title: "Depth: what a channel costs, and paid versus earned",
        depth: true,
        minutes: 5,
        objective: "Work out CAC per channel, and understand why paid channels get more expensive as you grow.",
        teach: [
          "Every channel has its own CAC, and they differ by ten times or more. Work it out per channel: what you spent, in money and hours, divided by the customers it produced. A channel with a wonderful reply rate and a terrible CAC is a wonderful way to lose money.",
          "Paid channels — ads, mostly — have a property that surprises founders: they get more expensive as you grow. The first hundred euros reach the people most likely to want the thing; the next thousand reach people slightly less likely; the next ten thousand reach people who do not. CAC rises with spend. That is normal, and it is why a paid channel that works at small scale can stop working at large scale.",
          "Earned channels — content, search, community, referrals — have the opposite shape: expensive at first, in hours, and cheaper per customer over time, because the work compounds. A post written this month brings customers next year. The trade-off is time: paid works this week; earned works in six months. Most companies need some of each, and knowing which shape you are buying is the point.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Channel A: 200 replies, 2 customers, €400. Channel B: 10 replies, 4 customers, €200. Which is better?",
            options: [
              { text: "A; twenty times the replies.", good: false, why: "Replies are not customers. A costs €200 per customer." },
              { text: "B; €50 per customer against A's €200.", good: true, why: "CAC per channel. The reply rate was the distraction." },
              { text: "Neither; the sample is too small.", good: false, why: "Small, and a four-times difference is a signal worth following." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why do paid channels get more expensive as you spend more?",
            options: [
              { text: "Because platforms raise prices for bigger customers.", good: false, why: "Not the mechanism." },
              { text: "Because the first euros reach the people most likely to want it, and each further euro reaches people less likely.", good: true, why: "CAC rises with spend. Normal, and why a channel can work small and fail large." },
              { text: "They do not; scale makes them cheaper.", good: false, why: "The reverse, for paid." },
            ],
          },
          {
            kind: "sort",
            prompt: "Paid shape or earned shape?",
            buckets: ["Paid: works now, costlier as it grows", "Earned: costly now, cheaper as it compounds"],
            items: [
              { text: "Search ads.", bucket: 0, why: "Results this week; CAC rises with spend." },
              { text: "Search engine optimisation and content.", bucket: 1, why: "Months of hours first; then a post from last year brings customers." },
              { text: "Referrals from existing customers.", bucket: 1, why: "Free, and grows with the customer base." },
              { text: "Social ads.", bucket: 0, why: "Paid shape." },
            ],
          },
          {
            kind: "fill",
            prompt: "Work out CAC ___ channel, not overall.",
            options: ["per", "excluding", "after the first", "for the best"],
            answer: 0,
            why: "They differ by ten times. An overall number hides which one is losing money.",
          },
        ],
        remember: "CAC per channel, not overall. Paid gets dearer as it grows; earned gets cheaper. Know which shape you are buying.",
        apply: { key: "channel", prompt: "Add a line: CAC for your channel so far, in money and hours, and whether it is a paid or an earned shape.", hint: "Add to what you wrote." },
      },
    ],
  },
  {
    id: "one-number",
    section: "growth",
    n: 15,
    name: "The one number",
    line: "One primary number, measured weekly, that says whether the company is working.",
    guide: [
      "Your primary number is almost always revenue or active users. Pick one. Measure it weekly, because a start-up needs feedback every week.",
      "AARRR — acquisition, activation, retention, referral, revenue — is a way of finding where the number goes wrong. Each stage is a place customers can be lost.",
      "Vanity numbers go up and mean nothing: downloads, sign-ups, page views, followers. Real numbers are what people do that costs them: paying, coming back, referring.",
      "Set a weekly goal for the number, in the building's rhythm: Monday plan, Friday log.",
    ],
    lessons: [
      {
        id: "pick-one",
        n: 1,
        title: "Pick one number",
        minutes: 4,
        objective: "Choose the single number that says whether the company is working, and measure it every week.",
        teach: [
          "Adora Cheung's lecture at YC on setting goals starts with the thing most founders skip: pick one number. Your primary metric is almost always revenue or active users — revenue if people pay, active users if they do not yet. One, not five. Five numbers is a dashboard, and a dashboard is a way of never knowing whether things are going well.",
          "Weekly. Not monthly, because a month is too long to learn from; not daily, because a day is noise. A start-up needs feedback every week, and a weekly number turns a big goal into fifty-two small ones. YC's benchmark for a good week during its programme is 5–7% growth in the number.",
          "Write it where you see it. Set a goal for next week on Monday. Read the real number on Friday. This is the rhythm the rest of the building runs on: the Monday plan, the Friday log, the week read back.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Your customers pay monthly. What is your primary number?",
            options: [
              { text: "Sign-ups.", good: false, why: "A sign-up costs nothing. Revenue is what they do that costs them." },
              { text: "Monthly recurring revenue, measured weekly.", good: true, why: "They pay; revenue is the number." },
              { text: "Page views.", good: false, why: "Vanity." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why weekly rather than monthly?",
            options: [
              { text: "Because investors want weekly updates.", good: false, why: "Some do. Not the reason." },
              { text: "Because a month is too long to learn from, and a weekly number turns a big goal into fifty-two small ones.", good: true, why: "Feedback every week. Small enough to act on." },
              { text: "Because daily is too much work.", good: false, why: "Daily is noise, not work." },
            ],
          },
          {
            kind: "fill",
            prompt: "Five numbers is a ___, and a way of never knowing whether things are going well.",
            options: ["plan", "dashboard", "forecast", "report"],
            answer: 1,
            why: "One number can be up or down. Five can always be argued to be fine.",
          },
          {
            kind: "sort",
            prompt: "Primary number, or a supporting one?",
            buckets: ["Primary", "Supporting"],
            items: [
              { text: "Weekly revenue.", bucket: 0, why: "What they pay." },
              { text: "Weekly active users, for a product that is free so far.", bucket: 0, why: "What they do, when nobody pays yet." },
              { text: "Emails sent.", bucket: 1, why: "Your effort, not their behaviour." },
              { text: "Followers.", bucket: 1, why: "Vanity." },
            ],
          },
        ],
        remember: "One number, revenue or active users. Weekly. Monday goal, Friday truth.",
        apply: { key: "kpi", prompt: "Write your one number, what counts towards it, and its value this week. Then a goal for next week.", hint: "If it is zero, write zero. It is a real number." },
      },
      {
        id: "aarrr",
        n: 2,
        title: "Where the number goes wrong",
        minutes: 5,
        objective: "Use the five stages of AARRR to find where customers are being lost.",
        teach: [
          "When the one number is not moving, you need to know where. Dave McClure's AARRR gives five places to look. Acquisition: did they arrive? Activation: did they get to the point where the product did something for them? Retention: did they come back? Referral: did they bring anyone? Revenue: did they pay? Customers are lost at each stage, and the stage where most are lost is where the work is.",
          "The most-ignored stage is activation. A hundred people arrive; how many reach the first moment of value — the first pass sold, the first regular who came back? If it is ten, the problem is not acquisition; it is the ninety who arrived and left before the product did anything. More acquisition would pour more people into the same hole.",
          "Measure each stage as a share of the one before. Then the biggest drop is obvious, and so is the week's work.",
        ],
        exercises: [
          {
            kind: "order",
            prompt: "Put the five stages in order.",
            steps: ["Acquisition: they arrive", "Activation: the product does something for them", "Retention: they come back", "Referral: they bring someone", "Revenue: they pay"],
            why: "Arrive, get value, return, tell, pay. Each a place to lose them.",
          },
          {
            kind: "choose",
            prompt: "100 arrive, 12 reach the first moment of value, 10 of those come back, 8 pay. Where is the work?",
            options: [
              { text: "Acquisition; get more than 100.", good: false, why: "More people into the same hole." },
              { text: "Activation: 88 of 100 left before the product did anything.", good: true, why: "The biggest drop. Fix that and every later number rises." },
              { text: "Revenue; 8 of 10 is too low.", good: false, why: "Eight of ten is excellent." },
            ],
          },
          {
            kind: "match",
            prompt: "Match each stage to its question.",
            pairs: [
              { term: "Activation", meaning: "Did the product do something for them?" },
              { term: "Retention", meaning: "Did they come back?" },
              { term: "Referral", meaning: "Did they bring anyone?" },
              { term: "Revenue", meaning: "Did they pay?" },
            ],
          },
          {
            kind: "fill",
            prompt: "Measure each stage as a share of the ___.",
            options: ["total", "one before", "goal", "best week"],
            answer: 1,
            why: "Then the biggest drop is obvious, and the week's work with it.",
          },
        ],
        remember: "Arrive, get value, return, tell, pay. Find the biggest drop; that is the week's work. It is usually activation.",
        apply: { key: "kpi", prompt: "Add rough numbers for each of the five stages this month, and circle the biggest drop.", hint: "Add to what you wrote." },
      },
      {
        id: "vanity",
        n: 3,
        title: "Vanity numbers",
        minutes: 4,
        objective: "Tell a number that goes up and means nothing from one that costs the customer something.",
        teach: [
          "A vanity number is one that only goes up and tells you nothing. Downloads, sign-ups, page views, followers, total users ever. They rise as long as anyone at all is trying the thing, and they never fall, so they cannot tell you when something is wrong. They are also the numbers that feel best, which is why they are dangerous.",
          "A real number is something the customer does that costs them: pays, comes back, refers a friend, spends time. Real numbers can fall. That is their whole value: a number that can fall can tell you the truth.",
          "The test: could this number be going up while the business is dying? Downloads: yes, easily. Weekly paying customers: no. If yes, it is vanity, and it belongs in the launch announcement and nowhere else.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Vanity or real?",
            buckets: ["Vanity", "Real"],
            items: [
              { text: "Total sign-ups since launch.", bucket: 0, why: "Only goes up. Says nothing about now." },
              { text: "Customers who paid this week.", bucket: 1, why: "Costs them. Can fall." },
              { text: "Followers.", bucket: 0, why: "A thumb moved once." },
              { text: "Share of last month's customers who used it this week.", bucket: 1, why: "Retention. Can fall, and would if something were wrong." },
            ],
          },
          {
            kind: "choose",
            prompt: "The test for a vanity number is:",
            options: [
              { text: "Does it appear in the pitch deck?", good: false, why: "Vanity numbers often do. That is not the test." },
              { text: "Could it be going up while the business is dying?", good: true, why: "If yes, it cannot tell you the truth." },
              { text: "Is it a big number?", good: false, why: "Big real numbers exist." },
            ],
          },
          {
            kind: "choose",
            prompt: "Why are vanity numbers dangerous rather than merely useless?",
            options: [
              { text: "Because they are inaccurate.", good: false, why: "They are usually accurate. Ten thousand downloads did happen." },
              { text: "Because they feel best, and so they get watched instead of the numbers that could warn you.", good: true, why: "Comfort in place of information." },
              { text: "Because investors dislike them.", good: false, why: "Good investors do. Not the reason." },
            ],
          },
          {
            kind: "fill",
            prompt: "A number that can ___ can tell you the truth.",
            options: ["be shared", "fall", "be rounded", "double"],
            answer: 1,
            why: "Vanity only rises. Real numbers fall when something is wrong, which is exactly when you need to know.",
          },
        ],
        remember: "If it could go up while the business dies, it is vanity. Watch the numbers that can fall.",
        apply: { key: "kpi", prompt: "Add a line: the vanity number you have been tempted to watch, and the real one you will watch instead.", hint: "Add to what you wrote." },
      },
      {
        id: "depth-cohorts-and-growth-rate",
        n: 4,
        title: "Depth: growth rate, cohorts, and the honest chart",
        depth: true,
        minutes: 5,
        objective: "Calculate a weekly growth rate correctly, read a cohort table, and draw the one chart that cannot flatter you.",
        teach: [
          "Weekly growth rate: this week's number divided by last week's, minus one. Forty customers this week, thirty-seven last week: 8%. Simple, and founders get it wrong in two ways — using the total-ever number, which always grows, and averaging good weeks with bad in a way that hides a decline. Use the weekly number, and look at the last four weeks side by side.",
          "A cohort table is the honest chart. Rows are the week people started; columns are weeks since they started; each cell is the share still active. Read down a column and you see whether newer cohorts are retained better than older ones — which is whether the product is improving. Read along a row and you see the retention curve from unit nine. Totals cannot show either.",
          "Two things the honest chart makes visible that totals hide: a leaky bucket, where acquisition rises and retention falls and the total looks flat and fine; and improvement, where each new cohort is a little better retained than the last, which is the most encouraging pattern a young company can show and is invisible in a total.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "37 paying customers last week, 40 this week. Weekly growth rate?",
            options: [
              { text: "3%.", good: false, why: "Three customers, not three percent. Divide by last week." },
              { text: "About 8%.", good: true, why: "40 ÷ 37 minus one. A good week by YC's benchmark." },
              { text: "40%.", good: false, why: "That is this week's number with a percent sign on it." },
            ],
          },
          {
            kind: "choose",
            prompt: "In a cohort table, what does reading down a column tell you?",
            options: [
              { text: "The retention curve of one cohort.", good: false, why: "That is along a row." },
              { text: "Whether newer cohorts are retained better than older ones — whether the product is improving.", good: true, why: "Same week-since-start, different starting weeks. The most encouraging pattern a young company can show." },
              { text: "Total users.", good: false, why: "Totals are what the table exists to replace." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these does a total-users chart hide?",
            buckets: ["Hidden by totals", "Visible in totals"],
            items: [
              { text: "Acquisition rising while retention falls.", bucket: 0, why: "The leaky bucket. Total looks flat and fine." },
              { text: "Each new cohort retained a little better than the last.", bucket: 0, why: "Improvement. Invisible in a total." },
              { text: "The company has more users than last year.", bucket: 1, why: "Totals show that. It is the only thing they show." },
            ],
          },
          {
            kind: "fill",
            prompt: "Use the ___ number for growth rate, never the total-ever.",
            options: ["weekly", "average", "best", "projected"],
            answer: 0,
            why: "Total-ever always grows. Weekly can fall, and so it can tell the truth.",
          },
        ],
        remember: "Growth rate is this week over last, minus one. Cohort tables show what totals hide: leaks, and improvement.",
        apply: { key: "kpi", prompt: "Add your last four weekly numbers side by side and the growth rate for each week. Zeros are fine.", hint: "Add to what you wrote." },
      },
    ],
  },
];
