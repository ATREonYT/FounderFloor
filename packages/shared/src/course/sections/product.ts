/**
 * SECTION 3: THE PRODUCT.
 *
 * The smallest thing, testing an offer, and product-market fit. The
 * section that most courses start with, placed third on purpose.
 */
import type { Unit } from "../content.ts";

export const PRODUCT: Unit[] = [
  {
    id: "smallest-thing",
    section: "product",
    n: 7,
    name: "The smallest thing",
    line: "You do not need to build the product to find out whether anyone wants it.",
    missions: ["smallest-offer"],
    guide: [
      "A minimum viable product is the smallest thing that tests your riskiest assumption. Not the smallest version of your product — the smallest test. Often it is not a product at all.",
      "Four shapes: the concierge (do it by hand for one customer), the Wizard of Oz (it looks automatic, a person is behind the curtain), the landing page (a sentence, a price, a button), and the pre-order (money before the thing exists, clearly labelled).",
      "Do things that don't scale. Recruit the first users by hand, one at a time, and give them an experience no scaled company could. Airbnb photographed listings. Stripe set up accounts on the customer's laptop.",
      "Small means this month. If the smallest test you can imagine takes three months to build, you have not found the smallest test.",
    ],
    lessons: [
      {
        id: "what-mvp-means",
        n: 1,
        title: "What \"minimum viable\" actually means",
        minutes: 4,
        objective: "Say what an MVP is for, and tell one from a small version of the product.",
        teach: [
          "Minimum viable product is one of the most misused phrases in the field. It does not mean a small, rough version of your product. It means the smallest thing you can put in front of a real person that tests your riskiest assumption. The test is the point; the product is optional.",
          "So the question is not \"what is the least I can build?\" It is \"what is the least I can do to find out whether anyone wants this?\" Sometimes the answer is a page with a price on it. Sometimes it is you, doing the job by hand for one customer, with no software at all. Sometimes it is a demonstration of something that does not work yet.",
          "The reason to be this strict is the 42%. Every month spent building before the need is tested is a month bet on an assumption. An MVP is how you make the bet small.",
        ],
        example: [
          { label: "A small product", text: "A cut-down version of the app with three screens instead of ten. Two months." },
          { label: "An MVP", text: "Hand-drawn pass cards for one café, sold by the owner at the counter for a month. You keep the tally in a spreadsheet. One week to start." },
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "What does an MVP test?",
            options: [
              { text: "Whether the product can be built.", good: false, why: "Usually it can. That is rarely the risk." },
              { text: "Your riskiest assumption, usually whether anyone wants this enough to pay.", good: true, why: "The test is the point. The product is one way to run it." },
              { text: "Whether users like the design.", good: false, why: "A real question, for later. Nobody dies of a design they did not like." },
            ],
          },
          {
            kind: "sort",
            prompt: "An MVP, or just a smaller product?",
            buckets: ["An MVP", "A smaller product"],
            items: [
              { text: "A one-page site with the sentence, a price, and a 'reserve a pass' button, shown to fifty café regulars.", bucket: 0, why: "Tests whether people will act at that price. No product." },
              { text: "The app with fewer features, launched to see what happens.", bucket: 1, why: "Smaller, still a bet on an untested need." },
              { text: "You, texting each regular by hand for one café for a month.", bucket: 0, why: "Tests whether regulars come back when reminded. Zero software." },
              { text: "A beta version for friends.", bucket: 1, why: "Friends, and a product. Two reasons it teaches little." },
            ],
          },
          {
            kind: "fill",
            prompt: "The question is not \"what is the least I can build?\" but \"what is the least I can do to ___?\"",
            options: ["launch", "find out whether anyone wants this", "impress investors", "look professional"],
            answer: 1,
            why: "Finding out is the job. Building is one way to do it, and usually the slowest.",
          },
          {
            kind: "choose",
            prompt: "Why be strict about \"smallest\"?",
            options: [
              { text: "Because small is cheaper.", good: false, why: "True, and not the main reason." },
              { text: "Because every month of building before the need is tested is a month bet on an assumption.", good: true, why: "The MVP makes the bet small. That is its whole purpose." },
              { text: "Because investors like lean teams.", good: false, why: "They do. That is a side effect." },
            ],
          },
        ],
        remember: "An MVP is the smallest test of your riskiest assumption, not the smallest version of your product.",
        apply: { key: "mvp", prompt: "What is the smallest thing you could put in front of one real person this month to test your riskiest assumption? It may not be software.", hint: "One paragraph. If it takes more than a month, it is not the smallest." },
      },
      {
        id: "four-shapes",
        n: 2,
        title: "Four shapes of a first test",
        minutes: 5,
        objective: "Choose between a concierge, a Wizard of Oz, a landing page and a pre-order for your own idea.",
        teach: [
          "Four shapes cover most first tests. The concierge: you do the job by hand for one customer, openly, as a service. The Wizard of Oz: it looks automatic to the customer, and a person is behind the curtain doing it. The landing page: a sentence, a price, a button, and you count who presses it. The pre-order: money before the thing exists, labelled as such.",
          "Each one tests something slightly different. The concierge tests whether the outcome is wanted and what it is worth. The Wizard tests whether people will use the thing the way you imagine, before you build it. The landing page tests whether the sentence and the price make strangers act. The pre-order tests commitment with money, which is the strongest evidence there is.",
          "Choose by the assumption. If the risk is \"nobody wants the outcome\", concierge. If it is \"they will not use it that way\", Wizard. If it is \"strangers will not stop for this\", landing page. If it is \"they will not pay\", pre-order. Often you will run two, small, in sequence.",
        ],
        exercises: [
          {
            kind: "match",
            prompt: "Match each test shape to what it tests best.",
            pairs: [
              { term: "Concierge (do it by hand, openly)", meaning: "Whether the outcome is wanted, and what it is worth" },
              { term: "Wizard of Oz (looks automatic, person behind it)", meaning: "Whether people will use it the way you imagine" },
              { term: "Landing page (sentence, price, button)", meaning: "Whether strangers act on the sentence and the price" },
              { term: "Pre-order (money before it exists)", meaning: "Commitment, with money" },
            ],
          },
          {
            kind: "choose",
            prompt: "Your riskiest assumption is \"café regulars will pay upfront for a pass\". Which test first?",
            options: [
              { text: "A landing page describing the app.", good: false, why: "Tests interest in a description, not payment for a pass." },
              { text: "A pre-order: hand-made pass cards sold at one counter for real money, for a month.", good: true, why: "The assumption is about paying. Test paying." },
              { text: "A Wizard of Oz app where you text regulars manually.", good: false, why: "Tests whether reminders bring people back. A good second test." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which shape is each of these?",
            buckets: ["Concierge or Wizard", "Landing page or pre-order"],
            items: [
              { text: "You personally reorder bread for three neighbours every evening by text for two weeks.", bucket: 0, why: "Concierge. The outcome, by hand, openly." },
              { text: "A page that says 'Bread tonight, delivered tomorrow, €4' with a button, shared in the local group.", bucket: 1, why: "Landing page. Do strangers stop and press?" },
              { text: "An 'app' that is really you, reading messages and typing replies.", bucket: 0, why: "Wizard of Oz. Looks automatic; is not." },
              { text: "Ten neighbours pay €20 each for a week of bread that starts next Monday.", bucket: 1, why: "Pre-order. Money before the thing." },
            ],
          },
          {
            kind: "choose",
            prompt: "What must a pre-order always be?",
            options: [
              { text: "Refundable.", good: false, why: "Often wise. Not the rule." },
              { text: "Clearly labelled as a pre-order for something that does not exist yet.", good: true, why: "Honesty is the rule. A pre-order sold as a product is a different thing with a different name." },
              { text: "Discounted.", good: false, why: "Sometimes. A discount also weakens what it tells you." },
            ],
          },
        ],
        remember: "Concierge, Wizard, landing page, pre-order. Pick by the assumption, and run two small ones rather than one big one.",
        apply: { key: "mvp", prompt: "Name the shape of your first test and, in one line, what it tests. If you would run a second, name that too.", hint: "Add to what you wrote." },
      },
      {
        id: "dont-scale",
        n: 3,
        title: "Do things that don't scale",
        minutes: 4,
        objective: "Recruit the first users by hand and give them an experience no scaled company could, and say why that is not a shortcut but the road.",
        teach: [
          "Paul Graham's most quoted advice, and the least followed. Founders want to build the machine that finds customers automatically. The first customers do not come from a machine. They come from the founder, one at a time, by hand, in a way that could never work for ten thousand people — and that is fine, because there are not ten thousand yet.",
          "Airbnb's founders flew to New York, met hosts, and photographed their apartments themselves. Stripe's founders, when someone said they would try it, said \"give me your laptop\" and set it up on the spot. Neither scales. Both are why those companies exist.",
          "Two reasons this works. The first customers get an experience so good they tell people. And the founder learns, from the inside, what the machine will eventually need to do — which they could not have guessed from a desk. Doing it by hand is not the slow way round to the real thing. It is how you find out what the real thing is.",
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "Why did Stripe's founders set up accounts on customers' laptops?",
            options: [
              { text: "Because the sign-up form was broken.", good: false, why: "Because a person who says 'I'll try it later' mostly does not. Doing it now, by hand, turned maybe into yes." },
              { text: "Because doing it by hand turned 'I'll try it' into a customer, and taught them what the sign-up would have to do.", good: true, why: "Both reasons at once. Unscalable, and the reason it later scaled." },
              { text: "Because they had no other customers.", good: false, why: "True, and it is the point: at the start, nobody does." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which of these is doing things that don't scale?",
            buckets: ["Doesn't scale, and should be done", "Trying to scale too early"],
            items: [
              { text: "Visiting each of the first six cafés weekly to ask what broke.", bucket: 0, why: "By hand, for six. You will learn what the product needs." },
              { text: "Building an automated onboarding flow before the first customer.", bucket: 1, why: "A machine for a queue that does not exist." },
              { text: "Personally delivering the first fifty orders.", bucket: 0, why: "Unscalable, and you will see every problem with your own eyes." },
              { text: "Running paid ads to find users at scale.", bucket: 1, why: "Scale before you know what you are scaling." },
            ],
          },
          {
            kind: "fill",
            prompt: "The most common unscalable thing founders have to do is ___.",
            options: ["write code", "recruit users by hand", "raise money", "hire"],
            answer: 1,
            why: "One at a time. Nearly every start-up has to, and most founders resist it.",
          },
          {
            kind: "choose",
            prompt: "What does the founder get from doing it by hand, besides customers?",
            options: [
              { text: "A break from coding.", good: false, why: "If only." },
              { text: "Knowledge, from the inside, of what the machine will eventually need to do.", good: true, why: "Which cannot be guessed from a desk. That is why it is the road and not a detour." },
              { text: "Nothing; it is a necessary evil.", good: false, why: "It is necessary. It is not evil. It is where the product comes from." },
            ],
          },
        ],
        remember: "The first customers come by hand, one at a time. Doing it by hand is how you find out what the real thing is.",
        apply: { key: "firstTen", prompt: "Write the unscalable thing you will do for your first ten customers: what you will do by hand that no big company could.", hint: "Be specific. Names and places if you have them." },
      },
      {
        id: "depth-build-vs-test",
        n: 4,
        title: "Depth: when to actually build",
        depth: true,
        minutes: 5,
        objective: "Decide when a test has told you enough to justify building, and what to build first when it has.",
        teach: [
          "Testing is not a religion. At some point you have to build. The question is when, and the answer is: when the tests have said something a build could not have, and the next thing you need to learn can only be learned from a built thing.",
          "Signals it is time. Strangers have paid for the concierge version and asked when the real one is coming. The Wizard is drowning — you are doing by hand something that takes all your evenings, and the demand is real. Your kill criterion was not hit and the pattern held across ten conversations. Any one of those is enough. None of them means build everything.",
          "What to build first: the thing you were doing by hand. Not the feature list. The concierge told you exactly what the customer gets and what it costs you to give it; the first version of the product does that one thing and nothing else. The builder tools in the Workshop are for exactly this moment: a brief for the one thing, not a platform.",
          "The trap on the other side: testing forever because building is frightening. If three tests have said yes and you are designing a fourth, that is fear. Build the one thing.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Is it time to build?",
            buckets: ["Time to build the one thing", "Not yet"],
            items: [
              { text: "Eight regulars paid for hand-made passes and two asked if there is an app.", bucket: 0, why: "Paid, and asked for the built version. Build the pass." },
              { text: "Three friends said they would definitely use it.", bucket: 1, why: "Compliments about the future. Run a test with strangers." },
              { text: "The manual texting takes four hours a night and the cafés want more.", bucket: 0, why: "The Wizard is drowning in real demand. Build the texting." },
              { text: "One conversation went really well.", bucket: 1, why: "One. Have four more." },
            ],
          },
          {
            kind: "choose",
            prompt: "The tests have said yes. What do you build first?",
            options: [
              { text: "The full product, since the need is proven.", good: false, why: "The need for one thing is proven. Build that thing." },
              { text: "The thing you were doing by hand, and nothing else.", good: true, why: "The concierge told you exactly what it is. The first version does that one thing." },
              { text: "A platform that can do this for any business.", good: false, why: "A platform is what you build after the one thing works for one kind of customer." },
            ],
          },
          {
            kind: "choose",
            prompt: "Three tests have said yes and you are designing a fourth. This lesson says:",
            options: [
              { text: "Good; more evidence is always better.", good: false, why: "Past a point it is not evidence, it is avoidance." },
              { text: "That is probably fear. Build the one thing.", good: true, why: "Testing forever because building is frightening is the trap on the other side." },
              { text: "Ask an investor.", good: false, why: "They will say build. So does this lesson." },
            ],
          },
          {
            kind: "fill",
            prompt: "Build when the next thing you need to learn can only be learned from a ___ thing.",
            options: ["cheaper", "built", "bigger", "funded"],
            answer: 1,
            why: "Tests teach until they cannot. Then the product teaches.",
          },
        ],
        remember: "Build when tests have said yes and the next lesson needs a built thing. Build the thing you did by hand, and only that.",
        apply: { key: "mvp", prompt: "Add a line: what would have to be true for you to start building, and what the first built version would do — one thing.", hint: "Add to what you wrote." },
      },
    ],
  },
  {
    id: "testing-offer",
    section: "product",
    n: 8,
    name: "Testing an offer",
    line: "Define the test first, then run it, then look honestly at what happened.",
    missions: ["define-test", "review-test"],
    guide: [
      "A test has five parts: hypothesis, participant, the ask, how you observe, and when you review. A test defined afterwards always passes.",
      "Interest is when someone says they would like it. Commitment is when they give something up for it. Decide which one your test measures before you run it, and do not upgrade it afterwards.",
      "Say the price out loud. Nothing a survey can do compares to watching a person's face when you say a number.",
      "Three honest outcomes: repeat, change, stop. All three earn the same credit.",
    ],
    lessons: [
      {
        id: "five-parts",
        n: 1,
        title: "The five parts of a test",
        minutes: 5,
        objective: "Write a test plan with all five parts before running anything.",
        teach: [
          "A test you define after you have the results always passes, because you define it to. So define it first. Five parts: the hypothesis (what you expect to happen, with a number), the participant (one real person or a small group), the ask (the specific thing you want them to do), the observation (how you will know whether they did it), and the review date (when you sit down and look).",
          "Each part protects you from something. Without a hypothesis you cannot fail, which sounds nice and means you cannot learn. Without a named participant you test on whoever is nearest. Without a specific ask, people can be enthusiastic without doing anything. Without an observation plan you will remember it the way you wanted it. Without a date the test never ends and never teaches.",
          "Dates move. Life moves them. Move the date out loud, with a reason, and the plan survives. Move it quietly and the plan has already died.",
        ],
        example: [
          { label: "Hypothesis", text: "If I offer the corner café hand-made prepaid passes, at least five regulars buy one in two weeks." },
          { label: "Observation", text: "The owner tells me how many sold. I count the cash she hands me for them." },
        ],
        exercises: [
          {
            kind: "order",
            prompt: "Put the five parts of a test in the order this lesson gives them.",
            steps: ["Hypothesis, with a number", "Participant", "The ask", "How you will observe it", "The review date"],
            why: "What you expect, from whom, doing what, seen how, by when.",
          },
          {
            kind: "match",
            prompt: "Match each missing part to what goes wrong without it.",
            pairs: [
              { term: "No hypothesis", meaning: "You cannot fail, so you cannot learn" },
              { term: "No named participant", meaning: "You test on whoever is nearest" },
              { term: "No specific ask", meaning: "People can be enthusiastic without doing anything" },
              { term: "No observation plan", meaning: "You remember it the way you wanted it" },
              { term: "No review date", meaning: "The test never ends and never teaches" },
            ],
          },
          {
            kind: "choose",
            prompt: "Which hypothesis is written well?",
            options: [
              { text: "People will like the passes.", good: false, why: "No number, no action. Cannot fail." },
              { text: "If I offer passes at the corner café for two weeks, at least five regulars buy one.", good: true, why: "An offer, a place, a time, an action, a number." },
              { text: "The passes will be a success.", good: false, why: "Success is whatever you decide afterwards. That is the problem." },
            ],
          },
          {
            kind: "choose",
            prompt: "The review date arrives and life has happened. What do you do?",
            options: [
              { text: "Move it quietly; nobody will know.", good: false, why: "You will. And the plan has died." },
              { text: "Move it out loud, with a reason, and write the new date down.", good: true, why: "Dates move. Plans survive if the move is visible." },
              { text: "Abandon the test.", good: false, why: "A moved date is not a failed test." },
            ],
          },
        ],
        remember: "Hypothesis, participant, ask, observation, date. Written first, or it always passes.",
        apply: { key: "testHypothesis", prompt: "Write your hypothesis with a number in it: if I offer X to Y, then Z will happen.", hint: "The other four parts are written in mission nine." },
      },
      {
        id: "interest-vs-commitment",
        n: 2,
        title: "Interest is not commitment",
        minutes: 4,
        objective: "Decide before running a test whether it measures interest or commitment, and never upgrade it afterwards.",
        teach: [
          "Interest is when someone says they would like it. Commitment is when they give something up for it: money, time, a name on a list, a booked slot. Interest is pleasant and cheap. Commitment is evidence.",
          "Both kinds of test are legitimate. A landing page that counts button presses measures interest, and that is worth knowing early. A pre-order measures commitment. The dishonesty is in the mixing: running an interest test and then, when it goes well, reporting it as if it were commitment. \"Two hundred people signed up\" means two hundred people typed an email address, which costs nothing. Say what it was.",
          "Decide before you run it. Write it in the plan: this test measures interest, or this test measures commitment. Then, when you review it, you read the result at the level it was designed for and not one above.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Interest or commitment?",
            buckets: ["Interest", "Commitment"],
            items: [
              { text: "Two hundred people entered an email on the landing page.", bucket: 0, why: "Typing an email costs nothing." },
              { text: "Twelve people paid a €10 deposit for a pass.", bucket: 1, why: "Money given up." },
              { text: "A café owner booked an hour next Tuesday to set it up.", bucket: 1, why: "Time, and a date." },
              { text: "Fifty likes on the post.", bucket: 0, why: "A thumb moved." },
            ],
          },
          {
            kind: "choose",
            prompt: "Is an interest test a bad test?",
            options: [
              { text: "Yes; only commitment counts.", good: false, why: "Interest is worth knowing early, cheaply. It just has to be reported as interest." },
              { text: "No, as long as you designed it as one and report it as one.", good: true, why: "The dishonesty is in the upgrade, not the test." },
              { text: "It depends on the sample size.", good: false, why: "Two thousand emails are still emails." },
            ],
          },
          {
            kind: "choose",
            prompt: "\"Two hundred people signed up for the waitlist, so the demand is proven.\" What is wrong with the sentence?",
            options: [
              { text: "Two hundred is too few.", good: false, why: "The number is not the problem." },
              { text: "It reports an interest test as if it measured commitment.", good: true, why: "Two hundred email addresses, at zero cost each. Say what it was." },
              { text: "Waitlists are always fake.", good: false, why: "They are real. They measure interest, which is real and small." },
            ],
          },
          {
            kind: "fill",
            prompt: "Decide which the test measures ___ you run it.",
            options: ["after", "before", "while", "unless"],
            answer: 1,
            why: "Before. Then you read the result at the level it was designed for.",
          },
        ],
        remember: "Interest is a said thing. Commitment is a given-up thing. Decide which you are measuring first, and report it as that.",
        apply: { key: "testKind", prompt: "Does your test measure interest or commitment? Choose honestly, and write one line about what the commitment version would look like.", hint: "Set in mission nine; this is where you decide." },
      },
      {
        id: "say-the-price",
        n: 3,
        title: "Say the price out loud",
        minutes: 4,
        objective: "Put a real number to a real person and read what their face and their next sentence tell you.",
        teach: [
          "There is a moment no survey can give you: you say a number, out loud, to a person who might pay it, and you watch their face. Not \"would you pay for this?\" — a number. \"It's forty euros a month.\" Then silence, and you let them fill it.",
          "Three things can happen. They wince: too high, or the value is not clear yet, and their next sentence tells you which. They say yes too fast: too low, and you have just learned something expensive. They ask a question — \"per café or per till?\", \"does that include…?\" — which is the best outcome, because a question about the details is a person imagining buying it.",
          "Do it three times before you change the number. One wince is one person. Three wince and one asks about the details: you have learned the price is high and the value is clear. One wince and two ask questions: the price is about right. Write down each face; you will not remember them evenly.",
        ],
        exercises: [
          {
            kind: "match",
            prompt: "Match the reaction to what it usually means.",
            pairs: [
              { term: "A wince, then silence", meaning: "Too high, or the value is not clear yet" },
              { term: "A fast yes", meaning: "Too low. An expensive thing to learn" },
              { term: "A question about the details", meaning: "A person imagining buying it. The best outcome" },
            ],
          },
          {
            kind: "choose",
            prompt: "Why say a number rather than ask \"would you pay for this?\"",
            options: [
              { text: "Because it is faster.", good: false, why: "It is. That is not why." },
              { text: "Because a number gets a reaction and a question gets a polite answer.", good: true, why: "The face after the number is the data. 'Would you pay' gets 'probably'." },
              { text: "Because it closes the sale.", good: false, why: "Sometimes. You are here to learn, and a sale is a fine way to learn." },
            ],
          },
          {
            kind: "choose",
            prompt: "Three people. Two wince and one asks \"is that per café?\" What have you learned?",
            options: [
              { text: "The price is right.", good: false, why: "Two of three winced. It is high, or the value is not landing yet." },
              { text: "The price is probably high, and at least one person can see the value clearly enough to ask about the shape of it.", good: true, why: "Read all three. The wince says high; the question says the value is real." },
              { text: "Nothing; three is too few.", good: false, why: "Three faces are three facts. Enough to adjust once and go again." },
            ],
          },
          {
            kind: "fill",
            prompt: "Say the number, then ___.",
            options: ["explain the value", "offer a discount", "be quiet and let them fill the silence", "ask if that is okay"],
            answer: 2,
            why: "The silence is where the reaction lives. Filling it yourself erases the data.",
          },
        ],
        remember: "A number, out loud, then silence. Three faces before you change it. Write each one down.",
        apply: { key: "price", prompt: "Write the number you will say, per what, and the three people you will say it to first.", hint: "Then come back and add the three faces." },
      },
      {
        id: "depth-reading-results",
        n: 4,
        title: "Depth: reading results without lying to yourself",
        depth: true,
        minutes: 5,
        objective: "Separate what happened from what you made of it, and choose repeat, change or stop with evidence.",
        teach: [
          "Write what happened before you write what it means. Numbers first: how many people, how many did the thing. Then what they did, separately from what they said. Only then what you think it means. The order matters because the mind, given the meaning first, edits the numbers to fit.",
          "\"What you still do not know\" is a real section. A test that answers one question opens two, and writing them down aims the next test. A founder who cannot list three unknowns after a test has not looked hard enough.",
          "Three honest next steps. Repeat: it worked; run it again with different people to see if it holds. Change: something specific in the offer or the ask was wrong and you now know what; fix that one thing and run again. Stop: the evidence says this version is not one people will act on; put it down, with the evidence, and go back to the problem. All three are good answers. Stopping early, with evidence, is a founder skill, and this building counts it as one.",
          "The bad answer is the fourth one: \"inconclusive, run it longer\". Sometimes true. Usually it means the kill criterion was hit and you would rather not say so.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "What happened, or what you made of it?",
            buckets: ["What happened", "What I made of it"],
            items: [
              { text: "Three people bought a card in two weeks.", bucket: 0, why: "A count." },
              { text: "People clearly love the idea.", bucket: 1, why: "'Clearly' and 'love' are interpretation." },
              { text: "Two said they would buy one and did not.", bucket: 0, why: "It happened, even though it is disappointing." },
              { text: "The card needs a better explanation on it.", bucket: 1, why: "A reasonable conclusion, and a conclusion." },
            ],
          },
          {
            kind: "order",
            prompt: "Put the review in the order this lesson gives.",
            steps: ["The numbers: how many people, how many did the thing", "What they did, separately from what they said", "What you think it means", "What you still do not know", "Repeat, change or stop"],
            why: "Facts, then behaviour, then meaning, then gaps, then the decision. Meaning first edits the facts.",
          },
          {
            kind: "choose",
            prompt: "Which of these is the answer to be suspicious of?",
            options: [
              { text: "Stop.", good: false, why: "Honest, with evidence. A skill." },
              { text: "Change one specific thing and run it again.", good: false, why: "Honest, and the commonest good answer." },
              { text: "Inconclusive; run it longer.", good: true, why: "Sometimes true. Usually the kill criterion was hit and this is the sound of not saying so." },
            ],
          },
          {
            kind: "choose",
            prompt: "The test hit its kill criterion. Two people bought where five was the line. What does this lesson say?",
            options: [
              { text: "Two is close; count it as a pass.", good: false, why: "The criterion was written so that this moment could not be negotiated." },
              { text: "It did not pass. Decide: change one specific thing and run again, or stop this version with the evidence written down.", good: true, why: "Both are good answers. Moving the line is not one of them." },
              { text: "Run it for another month.", good: false, why: "The fourth answer. Say why it would go differently, or it is avoidance." },
            ],
          },
        ],
        remember: "Numbers, then behaviour, then meaning, then unknowns. Repeat, change or stop. \"Run it longer\" is usually fear.",
        apply: { key: "outcomeUnknown", prompt: "After your next test, or the last thing you tried: three things you still do not know, one per line.", hint: "These aim the next test." },
      },
    ],
  },
  {
    id: "pmf",
    section: "product",
    n: 9,
    name: "Product-market fit",
    line: "What it is, how you measure it honestly, and what to do when the answer is not yet.",
    guide: [
      "Product-market fit is when enough of the right people would be upset to lose your product that it grows on its own. It is not a feeling; it is measurable, two ways.",
      "The 40% test (Sean Ellis): ask users how they would feel if they could no longer use the product. If 40% or more say 'very disappointed', you have it.",
      "The retention curve: plot the share of each cohort still active week by week. If it flattens above zero, some people have made it a habit. If it falls to zero, nobody has.",
      "The PMF engine (Rahul Vohra): find the users who said 'very disappointed', learn what they love, find what holds the 'somewhat' back, split the roadmap between the two, measure again.",
    ],
    lessons: [
      {
        id: "what-pmf-is",
        n: 1,
        title: "What product-market fit is",
        minutes: 4,
        objective: "Say what product-market fit means, and tell it from things that feel like it.",
        teach: [
          "Product-market fit is the point where enough of the right people want your product badly enough that it grows without being pushed. Before it, every customer is dragged in by the founder. After it, customers pull, tell each other, and complain when it breaks — because they depend on it.",
          "Marc Andreessen's description is the one founders recognise when they finally see it: customers buying as fast as you can add them, usage growing as fast as you can add servers, money piling up. And the description of its absence is the one most founders live in: users not quite getting value, word of mouth not spreading, deals not closing, the press indifferent.",
          "It is not a feeling, and it is not a launch. Launches feel like fit for a week. Fit is what the numbers say a month later, when the launch traffic has gone and some people are still there.",
        ],
        exercises: [
          {
            kind: "sort",
            prompt: "Fit, or something that feels like it?",
            buckets: ["A sign of fit", "Feels like it, is not"],
            items: [
              { text: "Customers complain loudly when the service goes down for an hour.", bucket: 0, why: "They depend on it. Nobody complains about losing something they did not use." },
              { text: "A launch post gets five thousand views.", bucket: 1, why: "Interest, for a week. Look again in a month." },
              { text: "New customers arrive every week and you did not do anything to find them.", bucket: 0, why: "Pull. Word of mouth doing the work." },
              { text: "An investor says the space is hot.", bucket: 1, why: "About the space, not your product." },
            ],
          },
          {
            kind: "choose",
            prompt: "Before fit, where do customers come from?",
            options: [
              { text: "Advertising.", good: false, why: "Ads before fit buy people who leave." },
              { text: "The founder, dragging them in one at a time.", good: true, why: "Which is fine and expected. Fit is when that stops being the only way." },
              { text: "Nowhere; there are none.", good: false, why: "There are some. They are just hard-won." },
            ],
          },
          {
            kind: "fill",
            prompt: "Fit is what the numbers say a ___ after launch, when the launch traffic has gone.",
            options: ["day", "week", "month", "year"],
            answer: 2,
            why: "Long enough for the curious to leave and the dependent to stay.",
          },
          {
            kind: "choose",
            prompt: "Which sentence describes the absence of fit?",
            options: [
              { text: "Customers are buying as fast as you can add them.", good: false, why: "That is fit." },
              { text: "Users do not quite get value, word of mouth does not spread, deals do not quite close.", good: true, why: "Andreessen's description of the state most founders are in. Recognising it is the first step out." },
              { text: "The product has bugs.", good: false, why: "Products with fit have bugs. Customers complain about them, which is the sign." },
            ],
          },
        ],
        remember: "Fit is when the right people would be upset to lose it and it grows on its own. It is measured a month after the launch, not during it.",
        apply: { key: "pmfSignal", prompt: "Which state are you in, honestly: dragging every customer in, or starting to be pulled? One line, and the evidence for it.", hint: "'Not there yet, no customers' is a fine and honest answer." },
      },
      {
        id: "the-40-percent-test",
        n: 2,
        title: "The 40% test",
        minutes: 4,
        objective: "Run the one survey question that measures fit, and read the answer honestly.",
        teach: [
          "Sean Ellis, after working with dozens of start-ups, found one question that predicted which would grow: How would you feel if you could no longer use this product? Very disappointed, somewhat disappointed, not disappointed. Companies where 40% or more of users said \"very disappointed\" grew. Companies under it struggled, however happy their users seemed.",
          "It works because it measures dependence, not liking. Plenty of people like a product they would not miss. The ones who would be very disappointed are the ones who have built it into their week.",
          "Ask it only of people who have actually used the product recently — a couple of times in the last two weeks — otherwise you are measuring the opinions of people who left. And ask it of enough people that one answer does not swing the number: forty is a decent minimum. Below that, the number is a hint, not a measure.",
        ],
        exercises: [
          {
            kind: "fill",
            prompt: "The threshold in the Sean Ellis test: ___ of users say they would be very disappointed.",
            options: ["10%", "25%", "40%", "75%"],
            answer: 2,
            why: "40%. Above it, companies grew; below it, they struggled regardless of how happy users seemed.",
          },
          {
            kind: "choose",
            prompt: "Why 'very disappointed' rather than 'would you recommend it'?",
            options: [
              { text: "Because it is a nicer question.", good: false, why: "It is a harsher one." },
              { text: "Because it measures dependence, and dependence is what makes people stay and tell others.", good: true, why: "Liking is cheap. Missing is the signal." },
              { text: "Because recommendation scores are outdated.", good: false, why: "They measure something else. This measures fit." },
            ],
          },
          {
            kind: "choose",
            prompt: "Who should you ask?",
            options: [
              { text: "Everyone who ever signed up.", good: false, why: "You would be measuring the opinions of people who left." },
              { text: "People who have used it recently, at least a couple of times in the last two weeks.", good: true, why: "The question is about losing something they use." },
              { text: "Your most enthusiastic users.", good: false, why: "You would be measuring your selection, not your product." },
            ],
          },
          {
            kind: "sort",
            prompt: "Is this number a measure or a hint?",
            buckets: ["A measure", "A hint"],
            items: [
              { text: "45% of 120 recent users said very disappointed.", bucket: 0, why: "Enough people, the right people, above the line." },
              { text: "3 of 5 friends said very disappointed.", bucket: 1, why: "Five, and friends. A hint at best." },
              { text: "22% of 80 recent users said very disappointed.", bucket: 0, why: "A real measure, and the honest answer is 'not yet'. Now the engine." },
              { text: "60% of 8 people said very disappointed.", bucket: 1, why: "Eight. One person is 12%." },
            ],
          },
        ],
        remember: "\"How would you feel if you could no longer use it?\" 40% very disappointed, from recent users, from enough of them.",
        apply: { key: "pmfSignal", prompt: "If you have users: your very-disappointed percentage, from how many, asked when. If not: the number of users you would need before the question means anything.", hint: "Add to what you wrote." },
      },
      {
        id: "the-retention-curve",
        n: 3,
        title: "The retention curve",
        minutes: 5,
        objective: "Read a retention curve, and say what its shape tells you about fit.",
        teach: [
          "The other honest measure needs no survey. Take everyone who started in a given week — a cohort — and plot what share of them are still active one week later, two weeks, three, and on. That line is the retention curve, and its shape is the most reliable sign of fit there is.",
          "Two shapes. The curve falls and keeps falling towards zero: people try it and leave, and nobody has made it a habit. Or the curve falls and then flattens — at 40%, at 20%, at 8% — and stays there: some share of people have built it into their lives, and that flat part is your business. The height of the flat part matters; whether it flattens at all matters more.",
          "A curve that flattens at a low number is still a curve that flattens. It says: for some kind of person, this is a habit. Find out who they are. A curve that never flattens, however high it starts, says: not yet, for anyone.",
        ],
        example: [
          { label: "No fit", text: "Week 0: 100%. Week 1: 40%. Week 2: 18%. Week 4: 6%. Week 8: 1%." },
          { label: "Fit, for some", text: "Week 0: 100%. Week 1: 45%. Week 2: 30%. Week 4: 26%. Week 8: 25%. Week 12: 25%." },
        ],
        exercises: [
          {
            kind: "choose",
            prompt: "A cohort: 100%, 38%, 22%, 20%, 19%, 19%, 19% over seven weeks. What does the curve say?",
            options: [
              { text: "Bad; only 19% stayed.", good: false, why: "It flattened. Nineteen percent of people made it a habit. That is a business, for that kind of person." },
              { text: "It flattens at about 19%: some people have made it a habit. Find out who they are.", good: true, why: "Whether it flattens matters most. The height is the next problem." },
              { text: "Inconclusive; more data needed.", good: false, why: "Seven weeks, flat for four. That is a conclusion." },
            ],
          },
          {
            kind: "choose",
            prompt: "A cohort: 100%, 60%, 35%, 20%, 11%, 6%, 3%. What does the curve say?",
            options: [
              { text: "Good start; 60% week-one retention is strong.", good: false, why: "It keeps falling. A high start that falls to zero is a high start to zero." },
              { text: "Not yet, for anyone: it never flattens.", good: true, why: "Nobody has made it a habit. Back to the problem and the early adopters." },
              { text: "Fit; most products lose users.", good: false, why: "Most products lose users and then keep some. This keeps none." },
            ],
          },
          {
            kind: "fill",
            prompt: "Everyone who started in a given week is a ___.",
            options: ["segment", "cohort", "funnel", "sample"],
            answer: 1,
            why: "A cohort. You follow the same people over time; that is what makes the curve honest.",
          },
          {
            kind: "sort",
            prompt: "True or false?",
            buckets: ["True", "False"],
            items: [
              { text: "Whether the curve flattens matters more than where.", bucket: 0, why: "Flattening means a habit exists. Height is the next problem." },
              { text: "A curve that flattens at 8% means no fit.", bucket: 1, why: "It means fit for a narrow kind of person. Find them and build for them." },
              { text: "You can read fit from total user numbers.", bucket: 1, why: "Totals hide a cohort that leaves under a cohort that arrives. Follow the same people." },
            ],
          },
        ],
        remember: "Follow one week's starters over time. If the line flattens above zero, some people have a habit. If it falls to zero, nobody does.",
        apply: { key: "pmfSignal", prompt: "If you have users: your oldest cohort's retention at weeks 1, 2, 4 and 8. If not: what 'active' will mean for your product, so you can measure it from day one.", hint: "Add to what you wrote." },
      },
      {
        id: "depth-pmf-engine",
        n: 4,
        title: "Depth: the PMF engine",
        depth: true,
        minutes: 5,
        objective: "Use the Superhuman method to move a product from \"not yet\" towards fit, deliberately.",
        teach: [
          "Rahul Vohra's team at Superhuman ran the 40% test and got 22%. Instead of guessing what to build, they built a method, and it moved the number to 58% in under a year. Four steps.",
          "One: segment. Look only at the people who said \"very disappointed\" and describe them — job, situation, what they use it for. Then re-run the number on people like them. Superhuman's went from 22% to 32% just by naming the right customer. Two: learn what those people love. Ask them the main benefit; the answer is what you must never break. Three: learn what holds back the \"somewhat disappointed\" who look like your fans. Ask what would make it a must-have; their answers are the roadmap. Four: split the roadmap in half — half doubling down on what the fans love, half removing what blocks the fence-sitters — and measure again in a quarter.",
          "The lesson under the method: fit is not found by adding features for everyone. It is found by picking who it is for, protecting what they love, and fixing what stops the people next to them.",
        ],
        exercises: [
          {
            kind: "order",
            prompt: "Put the four steps of the PMF engine in order.",
            steps: ["Segment: describe the very-disappointed users and measure on people like them", "Learn what those people love, and never break it", "Learn what holds back the somewhat-disappointed who resemble them", "Split the roadmap: half protect the love, half remove the blockers; measure again"],
            why: "Who, what they love, what blocks their neighbours, then build both halves and measure.",
          },
          {
            kind: "choose",
            prompt: "Superhuman's score went from 22% to 32% before they built anything. How?",
            options: [
              { text: "They ran the survey again on a good day.", good: false, why: "The number moved because the customer definition moved." },
              { text: "They named the kind of person who was very disappointed and measured only among people like them.", good: true, why: "Segmenting. Fit is with a kind of person, not with everyone." },
              { text: "They lowered the price.", good: false, why: "Price was not the lever." },
            ],
          },
          {
            kind: "choose",
            prompt: "Which users tell you what to build next?",
            options: [
              { text: "The ones who said 'not disappointed'.", good: false, why: "They were never going to be customers. Building for them dilutes the product." },
              { text: "The 'somewhat disappointed' who look like your fans.", good: true, why: "Close, and blocked by something specific. Their answers are the roadmap." },
              { text: "Everyone, weighted equally.", good: false, why: "Everyone equally is how you build a product nobody loves." },
            ],
          },
          {
            kind: "sort",
            prompt: "Which half of the roadmap does each belong in?",
            buckets: ["Protect what fans love", "Remove what blocks the fence-sitters"],
            items: [
              { text: "The fans say the main benefit is speed. Make the slowest screen faster.", bucket: 0, why: "Never break the love. Make it stronger." },
              { text: "The somewhat-disappointed say they cannot use it on their phone.", bucket: 1, why: "A specific blocker for people who are almost fans." },
              { text: "The fans love that it never nags them. Do not add notifications.", bucket: 0, why: "Protecting the love sometimes means not building." },
              { text: "The somewhat-disappointed say the price feels high for one till.", bucket: 1, why: "A blocker with a specific fix." },
            ],
          },
        ],
        remember: "Segment to the fans, protect what they love, fix what blocks their neighbours, measure again. Fit is chosen, not stumbled on.",
        apply: { key: "pmfSignal", prompt: "Describe the kind of person most likely to be very disappointed to lose your product, in one line. That is who you build for next.", hint: "Add to what you wrote." },
      },
    ],
  },
];
