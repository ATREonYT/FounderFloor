/**
 * THE JOURNEY: FROM AN IDEA TO A FIRST CUSTOMER TEST.
 *
 * One road, three stages, ten missions. This file is the whole curriculum
 * and nothing else: no screens, no storage, no model. The website reads
 * it, and so could the phone app, which is why it lives in shared and
 * imports nothing.
 *
 * What a mission is. Each one has the same seven parts in the same order —
 * an objective, a short explanation, a concrete example, one small
 * interaction where it earns its place, a practical action, a saved
 * output, and a reflection — so a founder always knows where they are in
 * a lesson. The parts are typed here rather than described in prose, so a
 * mission that is missing one does not compile.
 *
 * What a mission is not. It is not a course and it is not a quiz.
 * Completing the ten of these proves the founder has thought carefully
 * and talked to real people; it does not prove the business will work,
 * and nothing in this file says otherwise. Time estimates are for the
 * lesson only. A three-minute lesson can lead to a conversation that
 * happens a week later, and that is expected.
 *
 * Voice: plain, second person, short sentences, no exclamation marks, and
 * any term explained the first time it appears.
 */

export type StageId = "problem" | "people" | "test";

export interface Stage {
  id: StageId;
  n: 1 | 2 | 3;
  name: string;
  /** One line under the name, in words a beginner follows. */
  line: string;
}

export const STAGES: readonly Stage[] = [
  { id: "problem", n: 1, name: "Find a specific problem", line: "Say the idea plainly, pick one group of people, and separate what you know from what you assume." },
  { id: "people", n: 2, name: "Learn from real people", line: "Ask good questions, find people you can actually reach, and write down what they said." },
  { id: "test", n: 3, name: "Run a small test", line: "Offer the smallest useful thing, define the test first, then look honestly at what happened." },
];

/**
 * The keys a mission can write to. Each one is a line on the My Idea page,
 * so the list here is also the shape of that page.
 */
export type OutputKey =
  | "idea"
  | "customerGroup"
  | "problem"
  | "workaround"
  | "known"
  | "assumed"
  | "questions"
  | "route"
  | "conversationNotes"
  | "surprises"
  | "contradictions"
  | "decision"
  | "openQuestions"
  | "offer"
  | "testHypothesis"
  | "testParticipant"
  | "testAsk"
  | "testObserve"
  | "testReview"
  | "testKind"
  | "outcomeWhat"
  | "outcomeDid"
  | "outcomeUnknown"
  | "outcomeNext";

/**
 * How a saved line should be read. The label travels with the value and
 * is set by the mission that writes it, never by how persuasive the text
 * is. "assumption" is the founder's belief; "reported" is something the
 * founder saw or heard and wrote down; "confirmed" is a thing a customer
 * actually did — paid, showed up, used it — and only a handful of fields
 * can ever carry it.
 */
export type EvidenceLabel = "assumption" | "reported" | "confirmed";

export type FieldKind = "text" | "long" | "list" | "choice";

export interface OutputField {
  key: OutputKey;
  label: string;
  hint: string;
  kind: FieldKind;
  /** For "choice". */
  options?: { value: string; text: string }[];
  /** How the saved value is labelled on the My Idea page. */
  evidence: EvidenceLabel;
  /** Whether the mission can be finished with this field still empty. */
  optional?: boolean;
}

/**
 * The one small learning interaction in a mission. Four kinds, and each
 * has a right answer the founder can learn from — a quiz whose only job
 * is to hand out points is not one of them.
 */
export type Interaction =
  | {
      kind: "choose";
      prompt: string;
      options: { text: string; good: boolean; why: string }[];
    }
  | {
      kind: "sort";
      prompt: string;
      buckets: [string, string];
      items: { text: string; bucket: 0 | 1; why: string }[];
    }
  | {
      kind: "edit";
      prompt: string;
      /** The sentence to improve. */
      before: string;
      /** What a better version does, so the founder can judge their own. */
      better: string[];
    }
  | {
      kind: "plan";
      prompt: string;
      /** The pieces a test plan needs, each with what a missing one costs. */
      pieces: { label: string; without: string }[];
    };

export interface Mission {
  id: string;
  n: number;
  stage: StageId;
  title: string;
  /** Lesson time in the app, in minutes. Never includes outside work. */
  minutes: number;
  /** Needs something to happen outside the app before it is really done. */
  outside: boolean;
  /** Why this matters, in one or two sentences, for the home card. */
  why: string;
  objective: string;
  explain: string[];
  example: { label: string; text: string }[];
  interaction?: Interaction;
  action: {
    text: string;
    /** Shown while an outside action has not happened yet. */
    pending?: string;
  };
  output: OutputField[];
  reflect: string;
  next: string;
}

/** The ten missions, in order. Ids are permanent: progress is stored against them. */
export const MISSIONS: readonly Mission[] = [
  // ── Stage 1: find a specific problem ───────────────────────────────
  {
    id: "say-it",
    n: 1,
    stage: "problem",
    title: "Explain your idea simply",
    minutes: 4,
    outside: false,
    why: "Everything after this is built on one sentence. If a stranger cannot repeat it back, nothing later will land.",
    objective: "Write one sentence that says what you want to make and who it is for.",
    explain: [
      "An idea in your head has a hundred details. On paper it has one job: to be understood by someone who has never heard it. So the first thing you write is a single sentence a stranger could repeat back correctly.",
      "This sentence is a starting hypothesis. A hypothesis is a guess you are going to check, not a promise you are going to keep. You will change it, probably more than once, and changing it is the work going well, not badly.",
      "Keep out the words that sound like a company: platform, solution, ecosystem, revolutionise. Keep in the words a customer would use at a kitchen table.",
    ],
    example: [
      { label: "Too vague", text: "A platform that helps small businesses grow." },
      { label: "Clear", text: "A way for café owners to sell prepaid coffee passes, so regulars come back on quiet days." },
    ],
    interaction: {
      kind: "edit",
      prompt: "Rewrite this so a stranger could repeat it back. Say what it does and who it is for.",
      before: "An AI-powered solution that makes life easier for busy people.",
      better: [
        "It names a specific kind of person, not \"busy people\".",
        "It says what the thing actually does, in words that person would use.",
        "There is no word in it you would have to explain.",
      ],
    },
    action: {
      text: "Write your one sentence below. If you are not sure who it is for yet, write your best guess and mark it as a guess in your head.",
    },
    output: [
      {
        key: "idea",
        label: "Your idea, in one sentence",
        hint: "What it does, and who it is for. Plain words.",
        kind: "long",
        evidence: "assumption",
      },
    ],
    reflect: "Read your sentence out loud. Which word in it would you least like to be asked about?",
    next: "Next, you pick one group of people to start with. Not everyone who might want this: one group you can reach.",
  },
  {
    id: "one-group",
    n: 2,
    stage: "problem",
    title: "Choose one initial customer group",
    minutes: 4,
    outside: false,
    why: "\"Everyone\" is nobody you can phone. A narrow first group is the difference between a plan and a wish.",
    objective: "Narrow your audience to one group of people you could realistically talk to this month.",
    explain: [
      "Founders widen their audience because it feels safer. It is the opposite. A group that includes everyone gives you nobody to ask, nowhere to look, and no way to tell whether you are right.",
      "Your first group is not your only group forever. It is the group you learn from first. Pick people you can actually reach: through someone you know, a place you already go, a community you are already in.",
      "A good first group is specific enough that you could name three real people in it, or say exactly where you would go to meet them.",
    ],
    example: [
      { label: "Too broad", text: "Small business owners." },
      { label: "Reachable", text: "Owners of independent cafés in my town, the ones with a counter and no app." },
    ],
    interaction: {
      kind: "edit",
      prompt: "Make this group small enough to reach. Add the details that tell you where to find them.",
      before: "Parents who want their kids to learn.",
      better: [
        "It says which parents: an age of child, a place, a situation.",
        "You could name where these parents already gather.",
        "It is small enough that three real people come to mind.",
      ],
    },
    action: {
      text: "Write the one group you will start with. Then add where you would go to find them, even if that is one person you know.",
    },
    output: [
      {
        key: "customerGroup",
        label: "Your first customer group",
        hint: "Specific enough that you could name three of them.",
        kind: "long",
        evidence: "assumption",
      },
    ],
    reflect: "Could you name three real people in this group right now? If not, what would make the group smaller?",
    next: "Now you write down the problem these people have, and the honest part: which bits you actually know.",
  },
  {
    id: "the-problem",
    n: 3,
    stage: "problem",
    title: "Describe the problem and the current workaround",
    minutes: 6,
    outside: false,
    why: "People already do something about this problem today. What they do, and what it costs them, tells you whether they will bother to change.",
    objective: "Write the problem in your customer's words, say what they do about it now, and separate what you know from what you assume.",
    explain: [
      "A problem worth solving already has a workaround. A workaround is what people do today instead of your thing: a spreadsheet, a cousin, a paper list, doing nothing and living with it. If there is no workaround at all, ask yourself whether it is really a problem for them or only for you.",
      "Now the honest part. Some of what you believe about this problem you have seen or heard. The rest you assume. Both are fine to write down. Mixing them up is not, because you will spend months on an assumption thinking it was a fact.",
      "An observation is something that happened that you could point to: a person said it, you watched it, a number exists. An assumption is a thing that sounds true. Most founders' problem statements are mostly assumptions, which is normal at this stage.",
    ],
    example: [
      { label: "Observation", text: "The café owner on my street keeps a paper notebook of regulars and reads it out to me." },
      { label: "Assumption", text: "Café owners would pay for something that brings regulars back." },
    ],
    interaction: {
      kind: "sort",
      prompt: "Sort each line into what it is.",
      buckets: ["Observation", "Assumption"],
      items: [
        { text: "Two of the five people I asked said they keep a list on paper.", bucket: 0, why: "It happened, and you could point to it." },
        { text: "Most café owners struggle with quiet days.", bucket: 1, why: "\"Most\" is a guess unless you counted." },
        { text: "Nobody I spoke to asked what the app would look like.", bucket: 0, why: "Something that did not happen is still an observation, if you were there." },
        { text: "People would pay about ten euros a month for this.", bucket: 1, why: "A number nobody has paid yet is an assumption." },
      ],
    },
    action: {
      text: "Write the problem, then what people do about it today. Then split what you know from what you assume. Short lines are fine.",
    },
    output: [
      { key: "problem", label: "The problem, in their words", hint: "What is hard, for whom, and when.", kind: "long", evidence: "assumption" },
      { key: "workaround", label: "What they do about it today", hint: "The spreadsheet, the cousin, the paper list, or nothing.", kind: "long", evidence: "reported" },
      { key: "known", label: "What you know", hint: "Things you have seen or heard. One per line.", kind: "list", evidence: "reported" },
      { key: "assumed", label: "What you assume", hint: "Things that sound true but you have not checked. One per line.", kind: "list", evidence: "assumption" },
    ],
    reflect: "Look at the assumptions list. Which one, if wrong, would change your idea the most? That is the first one to check.",
    next: "Stage one is done. Next you learn how to ask people about this without leading them to the answer you want.",
  },

  // ── Stage 2: learn from real people ─────────────────────────────────
  {
    id: "good-questions",
    n: 4,
    stage: "people",
    title: "Prepare a useful customer conversation",
    minutes: 6,
    outside: false,
    why: "Ask people if they like your idea and they will be polite. Ask what they did last Tuesday and they will tell you the truth.",
    objective: "Write five questions about past behaviour and current difficulty, none of which lead the person to an answer.",
    explain: [
      "People are kind. If you describe your idea and ask whether they would use it, most will say yes to be nice, and you will learn nothing. So you do not describe your idea. You ask about their life.",
      "Good questions are about the past and the present, not the future. \"When did this last happen?\" \"What did you do?\" \"What was annoying about that?\" Bad questions are about a hypothetical future: \"Would you use…\", \"How much would you pay for…\".",
      "A leading question is one that contains the answer you are hoping for. \"Don't you find it frustrating that…\" is leading. \"Tell me about the last time…\" is not. Aim for questions a person could answer in a way that disappoints you.",
    ],
    example: [
      { label: "Leading", text: "Wouldn't it be great if your regulars came back automatically?" },
      { label: "Useful", text: "Tell me about the last quiet week you had. What did you do about it, if anything?" },
    ],
    interaction: {
      kind: "choose",
      prompt: "Which question would you rather ask a café owner?",
      options: [
        { text: "Would you pay for an app that brings regulars back?", good: false, why: "It describes your idea and asks for a promise. They will be polite." },
        { text: "What did you do the last time a week was quieter than usual?", good: true, why: "It asks about something that happened. The answer can surprise you." },
        { text: "Do you agree that customer loyalty is a big problem for cafés?", good: false, why: "It contains its own answer. Almost everyone will say yes." },
      ],
    },
    action: {
      text: "Write five questions you will actually ask. Each should be about something that already happened or happens now.",
    },
    output: [
      {
        key: "questions",
        label: "Your five questions",
        hint: "About the past and the present. One per line.",
        kind: "list",
        evidence: "reported",
      },
    ],
    reflect: "Read each question and ask: could a person answer this in a way that disappoints me? If not, it is probably leading.",
    next: "Next, where you will find these people — real places and real relationships, not a list of strangers.",
  },
  {
    id: "find-them",
    n: 5,
    stage: "people",
    title: "Find a realistic route to potential customers",
    minutes: 4,
    outside: false,
    why: "The best questions are useless without a person to ask. The route to five conversations is usually shorter than it feels.",
    objective: "Name two or three real ways to reach people in your group, starting with the ones that already exist in your life.",
    explain: [
      "You do not need a hundred people. You need five conversations, and five is usually within reach of the relationships you already have, the places you already go, and the communities you are already part of.",
      "Start with the closest route: someone you know who is in the group, or knows one. Then places: a market, a meetup, a shop, a group you are in. Then communities online, where the rule is to be a member first and to ask for a conversation, not to advertise.",
      "Do not invent contact details, do not scrape lists, and do not message strangers cold about your idea. That is not a route; it is spam, and it teaches you nothing except that people ignore spam.",
    ],
    example: [
      { label: "A poor route", text: "Email a hundred cafés from a directory." },
      { label: "A realistic route", text: "The café I go to on Saturdays. My cousin, who runs a stall. The local business group on Facebook, where I have been a member for a year." },
    ],
    interaction: {
      kind: "choose",
      prompt: "Which of these is a route that will actually lead to a conversation?",
      options: [
        { text: "Buy a list of 500 restaurant owners and send them all a survey.", good: false, why: "Strangers who did not ask. Very few will answer and the ones who do will not be typical." },
        { text: "Ask the owner of the café I already go to for ten minutes after the lunch rush.", good: true, why: "A real person, a real relationship, a small ask." },
        { text: "Post the idea on a big forum and see who likes it.", good: false, why: "Likes are not conversations, and the people who like things on forums are not your group." },
      ],
    },
    action: {
      text: "Write two or three routes, closest first. For each one, write the first small step: who you would ask, or where you would go.",
    },
    output: [
      {
        key: "route",
        label: "How you will reach them",
        hint: "Closest route first. Who, or where, and the first small step.",
        kind: "list",
        evidence: "reported",
      },
    ],
    reflect: "Which route could you act on this week without anyone's permission?",
    next: "Now the part that happens outside the app: a real conversation. The next mission is where you write down what you heard.",
  },
  {
    id: "record-one",
    n: 6,
    stage: "people",
    title: "Record a real conversation",
    minutes: 5,
    outside: true,
    why: "A conversation you do not write down turns into the version you wanted to hear within a day. The notes are the evidence; the memory is not.",
    objective: "After a real conversation, write down what the person said, what surprised you, and anything that went against what you expected.",
    explain: [
      "Write notes the same day, and write what they said rather than what you concluded. \"She keeps a paper list\" is a note. \"She needs my app\" is a conclusion wearing a note's clothes.",
      "Keep people anonymous. First name or a description is enough: \"the owner of the corner café\". You do not need their surname, email or anything else, and you should not store it here.",
      "Pay special attention to two things. Surprises: anything you did not expect. And contradictions: anything that goes against your idea. Those two are the most valuable lines you will write, and the ones founders are most tempted to leave out.",
    ],
    example: [
      { label: "A note", text: "Corner café owner. Keeps regulars in a paper notebook. Said quiet weeks are \"just how it is\". Did not ask what the app looked like." },
      { label: "A surprise", text: "She was more worried about staff not turning up than about quiet days." },
    ],
    action: {
      text: "Have one conversation using your questions. Then come back and write it down here, the same day if you can.",
      pending: "No conversation yet? That is fine, and it is normal. Finish the lesson now, leave this open, and come back when it has happened. The journey waits.",
    },
    output: [
      { key: "conversationNotes", label: "What they said", hint: "Their words, not your conclusions. Keep them anonymous.", kind: "long", evidence: "reported" },
      { key: "surprises", label: "What surprised you", hint: "Anything you did not expect. One per line.", kind: "list", evidence: "reported", optional: true },
      { key: "contradictions", label: "What went against your idea", hint: "The honest part. One per line.", kind: "list", evidence: "reported", optional: true },
    ],
    reflect: "Did you describe your idea before you asked your questions? If so, treat their answers with more suspicion.",
    next: "One conversation is one conversation. Next you decide what, if anything, it changes.",
  },
  {
    id: "what-changes",
    n: 7,
    stage: "people",
    title: "Decide what the evidence changes",
    minutes: 5,
    outside: false,
    why: "Evidence is only useful if it is allowed to change your mind. This is where you let it, or say honestly why not.",
    objective: "Take one assumption and decide, from what you heard, whether to keep it, change it, or drop it.",
    explain: [
      "One conversation is not proof of anything. Five conversations that agree are a pattern. Neither is the market validating your idea; validation is a word for a thing customers do with money and time, not a word for agreement.",
      "So the decision is small. Pick one assumption from your list. Ask: did what I heard support it, go against it, or say nothing about it? Then keep it, revise it, or drop it, and write one line about why.",
      "Dropping an assumption is not a failure. It is the single most valuable thing that can happen at this stage, because it happened before you built anything. This journey counts it as progress, and so should you.",
    ],
    example: [
      { label: "The assumption", text: "Café owners worry most about quiet days." },
      { label: "The decision", text: "Revise. Two of three said staff reliability worried them more. Quiet days are real but not the top of the list." },
    ],
    interaction: {
      kind: "choose",
      prompt: "After one conversation where the owner liked the idea, what can you honestly say?",
      options: [
        { text: "The idea is validated.", good: false, why: "One person being polite is not the market doing anything." },
        { text: "One person responded well; I still know nothing about whether they would pay.", good: true, why: "That is exactly what happened, and no more." },
        { text: "I should build it now before someone else does.", good: false, why: "Nothing in one conversation tells you that." },
      ],
    },
    action: {
      text: "Pick one assumption, decide keep, revise or drop, and write why. Then list the questions that are still open.",
    },
    output: [
      {
        key: "decision",
        label: "Your decision",
        hint: "Which assumption, what you decided, and why, in a few lines.",
        kind: "long",
        evidence: "reported",
      },
      {
        key: "openQuestions",
        label: "Still open",
        hint: "What you still do not know. One per line.",
        kind: "list",
        evidence: "assumption",
      },
    ],
    reflect: "If the next three conversations all said the opposite of this one, what would you do? Knowing that now makes the next ones easier to hear.",
    next: "Stage two is done. Now you design the smallest thing you could put in front of someone to see what they actually do.",
  },

  // ── Stage 3: run a small test ────────────────────────────────────────
  {
    id: "smallest-offer",
    n: 8,
    stage: "test",
    title: "Choose the smallest useful offer",
    minutes: 5,
    outside: false,
    why: "You do not need to build the product to find out whether anyone wants it. You need to offer something small and see what they do.",
    objective: "Choose one small thing you can offer a real person, this month, that tells you something an interview cannot.",
    explain: [
      "An interview tells you what people say. A test tells you what they do. The gap between the two is where most ideas live, so at some point you have to offer something and watch.",
      "The offer should be small. A manual version, where you do the work by hand that software would do later. A demonstration of a rough prototype. A limited trial for one person. A pre-order for something that does not exist yet, clearly labelled as such.",
      "Small means you could do it this month without building the whole thing. If the smallest test you can imagine takes three months of building, you have not found the smallest test yet.",
    ],
    example: [
      { label: "Too big", text: "Build the app, launch it, and see who signs up." },
      { label: "Small enough", text: "Offer one café a hand-made prepaid pass card for a month. I keep track of the regulars in a spreadsheet myself." },
    ],
    interaction: {
      kind: "choose",
      prompt: "Which of these is the smallest test that still tells you something real?",
      options: [
        { text: "Spend two months building a proper app, then ask people to try it.", good: false, why: "Two months before you learn anything, and most of what you learn will be about the app, not the idea." },
        { text: "Do the job by hand for one customer for a few weeks and see whether they keep using it.", good: true, why: "Cheap, fast, and it measures what they do rather than what they say." },
        { text: "Ask ten people whether they would buy it if it existed.", good: false, why: "That is another interview. Useful, but it does not measure behaviour." },
      ],
    },
    action: {
      text: "Write the smallest offer you could make to one real person from your group, and what doing it would involve for you.",
    },
    output: [
      {
        key: "offer",
        label: "Your smallest offer",
        hint: "What you will offer, to whom, and what you will do by hand.",
        kind: "long",
        evidence: "reported",
      },
    ],
    reflect: "Is there a version of this offer that is half the size? If yes, why not start there?",
    next: "Before you run it, you define it. A test you define afterwards always passes.",
  },
  {
    id: "define-test",
    n: 9,
    stage: "test",
    title: "Define the test before running it",
    minutes: 6,
    outside: false,
    why: "Decide what would count as a result before you see any. Afterwards, everything looks like the result you wanted.",
    objective: "Write down the hypothesis, the person, what you will ask them to do, how you will observe it, and when you will look.",
    explain: [
      "A test has five parts. The hypothesis: what you expect to happen. The participant: one real person or a small group. The ask: the specific thing you are asking them to do. The observation: how you will know whether they did it. The review date: when you will sit down and look, honestly, at what happened.",
      "One distinction matters more than the rest. Interest is when someone says they would like it. Commitment is when they give something up for it: money, time, a name on a list, a booked slot. Interest is nice. Commitment is evidence. Decide now which one your test measures, and do not upgrade it afterwards.",
      "Dates are flexible. Put a review date so you actually look, but if life moves it, move it. Nothing here needs to happen inside a fixed number of days.",
    ],
    example: [
      { label: "Hypothesis", text: "If I offer the corner café a hand-made prepaid pass, at least five of their regulars will buy one in two weeks." },
      { label: "Observation", text: "The café owner tells me how many cards sold. I count the cash they hand me for them." },
    ],
    interaction: {
      kind: "plan",
      prompt: "A test without each of these parts is missing something. Here is what each one costs you if it is not there.",
      pieces: [
        { label: "Hypothesis", without: "you cannot tell whether it worked, because you never said what working meant" },
        { label: "Participant", without: "you end up testing on whoever is nearest, who may not be your group" },
        { label: "The ask", without: "people can be enthusiastic without ever doing anything" },
        { label: "Observation", without: "you will remember it the way you wanted it to go" },
        { label: "Review date", without: "the test never actually ends, so it never actually teaches you" },
      ],
    },
    action: {
      text: "Fill in the five parts. Then say honestly whether this test measures interest or commitment.",
    },
    output: [
      { key: "testHypothesis", label: "Hypothesis", hint: "If I offer X to Y, then Z will happen.", kind: "long", evidence: "assumption" },
      { key: "testParticipant", label: "Participant", hint: "One real person or a small group. Anonymous is fine.", kind: "text", evidence: "reported" },
      { key: "testAsk", label: "The ask", hint: "The one specific thing you will ask them to do.", kind: "text", evidence: "reported" },
      { key: "testObserve", label: "How you will observe it", hint: "What you will count or watch, and how.", kind: "text", evidence: "reported" },
      { key: "testReview", label: "When you will review it", hint: "A date, or a moment. It can move.", kind: "text", evidence: "reported" },
      {
        key: "testKind",
        label: "What this test measures",
        hint: "Be honest now, so you are not tempted later.",
        kind: "choice",
        evidence: "reported",
        options: [
          { value: "interest", text: "Interest — they say they would like it" },
          { value: "commitment", text: "Commitment — they give up money, time or a booked slot" },
        ],
      },
    ],
    reflect: "If this test measures interest, what would the commitment version look like? You may want to run that one next.",
    next: "Now run it. The last mission is where you write down what happened, whatever it was.",
  },
  {
    id: "review-test",
    n: 10,
    stage: "test",
    title: "Review the outcome and choose the next step",
    minutes: 5,
    outside: true,
    why: "The point of a test is what you do after it. Repeat, change or stop are all good answers. Pretending is the only bad one.",
    objective: "Write down what actually happened, what you still do not know, and whether you will repeat the test, change it, or stop.",
    explain: [
      "Write what happened before you write what it means. Numbers first: how many people, how many did the thing. Then what they actually did, separately from what they said. Then, only then, what you think it means.",
      "What you still do not know is a real section, not a formality. A test that answers one question usually opens two. Write them down so the next test can be aimed at them.",
      "Three honest next steps. Repeat: it worked and you want to see it again with different people. Change: something in the offer or the ask was wrong and you now know what. Stop: the evidence says this particular idea is not one people will act on. All three earn the same credit here. Stopping early, with evidence, is a founder skill.",
    ],
    example: [
      { label: "What happened", text: "Offered the pass at one café for two weeks. Three regulars bought one. Two more said they would \"next time\" and did not." },
      { label: "Next step", text: "Change. Three buyers is real, but the owner had to explain it every time. The card needs to explain itself. Try again with a clearer card, same café." },
    ],
    interaction: {
      kind: "sort",
      prompt: "Which of these are what happened, and which are what you made of it?",
      buckets: ["What happened", "What I made of it"],
      items: [
        { text: "Three people bought a card in two weeks.", bucket: 0, why: "A count of something that happened." },
        { text: "People clearly love the idea.", bucket: 1, why: "\"Clearly\" and \"love\" are interpretation." },
        { text: "Two people said they would buy one and did not.", bucket: 0, why: "It happened, even though it is disappointing." },
        { text: "The card needs a better explanation on it.", bucket: 1, why: "A reasonable conclusion, but a conclusion." },
      ],
    },
    action: {
      text: "Run the test you defined. Then come back and write down what happened, what remains unknown, and what you will do next.",
      pending: "Not run it yet? Leave this open. The lesson counts now; the real-world part counts when it has happened.",
    },
    output: [
      { key: "outcomeWhat", label: "What happened", hint: "Numbers first, then what they did, then what they said.", kind: "long", evidence: "reported" },
      {
        key: "outcomeDid",
        label: "What the participant actually did",
        hint: "Not what they said. What they did.",
        kind: "choice",
        evidence: "confirmed",
        options: [
          { value: "nothing", text: "Nothing yet" },
          { value: "interest", text: "Said they were interested" },
          { value: "committed", text: "Gave time, a name, or a booking" },
          { value: "paid", text: "Paid, or used it" },
        ],
      },
      { key: "outcomeUnknown", label: "What you still do not know", hint: "One per line. These aim the next test.", kind: "list", evidence: "assumption" },
      {
        key: "outcomeNext",
        label: "Next step",
        hint: "All three are good answers.",
        kind: "choice",
        evidence: "reported",
        options: [
          { value: "repeat", text: "Repeat it with different people" },
          { value: "change", text: "Change something and try again" },
          { value: "stop", text: "Stop this idea, with evidence" },
        ],
      },
    ],
    reflect: "What did you expect before the test, and how far off were you? The size of that gap is worth remembering.",
    next: "That is the whole road, once. Most founders walk it more than once. Your idea page keeps everything you found.",
  },
];

/** The sections of the My Idea page, in reading order, and which saved lines feed each. */
export const IDEA_SECTIONS: readonly { id: string; title: string; keys: OutputKey[] }[] = [
  { id: "idea", title: "Current idea", keys: ["idea"] },
  { id: "group", title: "First customer group", keys: ["customerGroup"] },
  { id: "problem", title: "Problem hypothesis", keys: ["problem", "known", "assumed"] },
  { id: "workaround", title: "Known workarounds", keys: ["workaround"] },
  { id: "evidence", title: "Evidence collected", keys: ["conversationNotes", "surprises", "contradictions", "outcomeWhat", "outcomeDid"] },
  { id: "open", title: "Open questions", keys: ["openQuestions", "outcomeUnknown"] },
  { id: "experiment", title: "Current experiment", keys: ["offer", "testHypothesis", "testParticipant", "testAsk", "testObserve", "testReview", "testKind"] },
  { id: "next", title: "Next decision", keys: ["decision", "outcomeNext"] },
  { id: "prep", title: "How you are asking", keys: ["questions", "route"] },
];

export const missionById = (id: string): Mission | undefined => MISSIONS.find((m) => m.id === id);
export const missionsIn = (stage: StageId): Mission[] => MISSIONS.filter((m) => m.stage === stage);
export const fieldFor = (key: OutputKey): OutputField | undefined => {
  for (const m of MISSIONS) for (const f of m.output) if (f.key === key) return f;
  return undefined;
};
