/**
 * FounderFloor — the category shelf.
 *
 * One curated list, used everywhere a business names its lane: the stand
 * editor offers these to PICK rather than type, the directory's filter
 * chips grow from what stands actually chose, and the operator console
 * filters its Businesses list by them.
 *
 * Why picked-not-typed: with a free text field, three founders in the same
 * lane write "Fintech", "finance app" and "Payments", and every surface
 * that groups by category — the directory chips, the admin filter — sees
 * three lanes of one instead of one lane of three. A shelf of fixed labels
 * is what makes grouping mean anything.
 *
 * The escape hatch stays: the editor's last option is a write-in, because
 * a list that claims to cover every business in the world is lying and the
 * founder it lies to is exactly the one doing something new. Write-ins are
 * capped at 30 chars by the form and 32 by the server's sanitizer.
 *
 * Ordering is deliberate: roughly how often each lane shows up in an
 * early-stage hall, so the common picks sit at the top of the menu and the
 * long tail scrolls. Renaming an entry later does NOT rename stands that
 * already chose it — the string is stored on the startup — so treat these
 * labels as append-mostly.
 */
export const CATEGORIES: string[] = [
  "Websites & Web Apps",
  "Mobile Apps",
  "SaaS & B2B Tools",
  "AI & Machine Learning",
  "Dev Tools & Infrastructure",
  "Finance & Fintech",
  "E-commerce & Marketplaces",
  "Marketing & Sales",
  "Design & Creative",
  "Media & Content",
  "Games & Entertainment",
  "Music & Audio",
  "Education & Courses",
  "Health & Fitness",
  "Food & Drink",
  "Travel & Local",
  "Social & Community",
  "Productivity",
  "Hardware & IoT",
  "Real Estate & Construction",
  "Logistics & Delivery",
  "Legal & Compliance",
  "HR & Hiring",
  "Sustainability & Climate",
  "Agencies & Services",
  "Nonprofit & Community",
];

/** True when this exact label is on the shelf (write-ins are not). */
export function isPresetCategory(v: string): boolean {
  return CATEGORIES.includes(v);
}
