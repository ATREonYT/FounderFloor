"use client";

/**
 * The guided tour: one instruction at a time, bottom-center above the emote
 * bar, advancing as the player actually does each thing. Skippable. When the
 * last step lands the floor page marks the tutorial done, which completes the
 * "First steps" quest.
 *
 * Every instruction that names a control comes from controlCopy() rather
 * than being written twice here. Telling somebody on a phone to "press E"
 * is not a small mistake — it is the first thing they read, it does not
 * work, and there is no way for them to know the site is not broken.
 */

import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/types";
import { controlCopy, type DeviceInfo } from "@/lib/device";

function stepCopy(
  step: OnboardingStep,
  device: DeviceInfo,
): { title: string; body: string } {
  const c = controlCopy(device);
  switch (step) {
    case "move":
      return { title: "Walk around", body: c.walk };
    case "interact":
      return { title: "Find a stand", body: c.interact };
    case "talk":
      return {
        title: "Say something",
        body: "Ask the founder a question — type in the chat that just opened.",
      };
    case "emote":
      return { title: "React", body: c.react };
    case "connect":
      return {
        title: "Make it count",
        body: "Like them? Hit Connect on the stand card — they go in your contact list.",
      };
  }
}

export default function TutorialCoach({
  done,
  device,
  onSkip,
}: {
  /** Steps already completed. */
  done: OnboardingStep[];
  /** Drives which controls the copy names. */
  device: DeviceInfo;
  onSkip: () => void;
}) {
  const current = ONBOARDING_STEPS.find((s) => !done.includes(s));
  if (!current) return null;
  const idx = ONBOARDING_STEPS.indexOf(current);
  const copy = stepCopy(current, device);

  return (
    <div className="glass anim-in pointer-events-auto w-[320px] max-w-[calc(100vw-24px)] border-l-2 border-l-accent p-3 shadow-float">
      <div className="flex items-baseline justify-between gap-2">
        <span className="micro text-accent">
          Tour · {idx + 1}/{ONBOARDING_STEPS.length}
        </span>
        <button
          type="button"
          onClick={onSkip}
          // 44px of tappable height around a 10px label: the old one was
          // the exact size of the text, which on a phone means missing it.
          className="micro -my-2 -mr-1 min-h-[44px] px-2 text-muted hover:text-ink"
        >
          skip tour
        </button>
      </div>
      <p className="mt-1 font-display text-base leading-tight">{copy.title}</p>
      <p className="mt-0.5 text-sm leading-snug text-muted">{copy.body}</p>
    </div>
  );
}
