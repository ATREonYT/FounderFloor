/**
 * The digest: what the run found, as something a person reads over coffee.
 *
 * Markdown for the file on disk, HTML for the email. Both carry the same
 * thing per lead: where it is, what it says, why it matched, and a draft
 * you still have to finish. The permalink comes first in every entry
 * because the only correct first action is to go and read the original
 * post in its own context.
 */

import { needsEdit } from "./draft.mjs";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/**
 * Only http(s) may reach an href. Permalinks for HN, Bluesky and the Reddit
 * API are built by us, but an RSS feed supplies its own <link> — and a feed
 * is somebody else's input. `javascript:` in a mail client is mostly inert,
 * which is not the same as safe.
 */
const safeUrl = (u) => {
  try {
    const p = new URL(String(u));
    return p.protocol === "http:" || p.protocol === "https:" ? p.href : "";
  } catch {
    return "";
  }
};

const trim = (s, n) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

const age = (iso) => {
  const h = (Date.now() - new Date(iso).getTime()) / 3.6e6;
  if (!Number.isFinite(h)) return "";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m old`;
  if (h < 48) return `${Math.round(h)}h old`;
  return `${Math.round(h / 24)}d old`;
};

/**
 * @param {Array} leads
 * @param {{stats: object, ranAt: string, sources: object}} meta
 */
export function markdownDigest(leads, meta) {
  const L = [];
  L.push(`# Leadwatch — ${new Date(meta.ranAt).toISOString().slice(0, 16).replace("T", " ")} UTC`);
  L.push("");
  if (!leads.length) {
    L.push("Nothing new cleared the bar this run. That is the normal result most days;");
    L.push("a listener that finds something every time is a listener with its threshold");
    L.push("set too low.");
  } else {
    L.push(`**${leads.length} new ${leads.length === 1 ? "lead" : "leads"}.** Read the post before you reply to it.`);
  }
  L.push("");

  const srcLine = Object.entries(meta.sources || {})
    .map(([k, v]) => `${k} ${v.ok ? `${v.items} items` : `FAILED (${v.error})`}`)
    .join(" · ");
  if (srcLine) L.push(`_Sources: ${srcLine}_`);
  if (meta.overflow) {
    L.push(
      `_${meta.overflow} more cleared the bar than this digest shows (maxLeadsPerRun). ` +
        `They are NOT lost — they will be offered again next run._`,
    );
  }
  L.push(
    `_Queue: ${meta.stats.new} waiting, ${meta.stats.replied} replied, ${meta.stats.skipped} skipped, ${meta.stats.seen} items seen all time._`,
  );
  L.push("");

  for (const lead of leads) {
    L.push("---");
    L.push("");
    L.push(`## ${trim(lead.title, 110) || "(untitled)"}`);
    L.push("");
    L.push(`- **Link:** ${safeUrl(lead.url) || "(no usable link)"}`);
    L.push(`- **Where:** ${lead.source}${lead.channel ? ` · ${lead.channel}` : ""} · ${lead.author || "unknown"} · ${age(lead.createdAt)}`);
    L.push(`- **Why it matched:** ${lead.why}`);
    L.push("");
    if (lead.body) {
      L.push("> " + trim(lead.body, 600).replace(/\n/g, "\n> "));
      L.push("");
    }
    L.push("**Draft reply** " + (needsEdit(lead.draft) ? "— _finish the bracketed line first_" : ""));
    L.push("");
    L.push("```");
    L.push(lead.draft);
    L.push("```");
    L.push("");
  }
  return L.join("\n");
}

export function htmlDigest(leads, meta) {
  const rows = leads
    .map(
      (lead) => `
    <article style="border:1px solid #E4DFD3;border-radius:10px;padding:16px;margin:0 0 16px">
      <h2 style="margin:0 0 8px;font:600 17px/1.35 -apple-system,Segoe UI,Roboto,sans-serif;color:#23201A">
        <a href="${esc(safeUrl(lead.url))}" style="color:#23201A;text-decoration:none">${esc(trim(lead.title, 110) || "(untitled)")}</a>
      </h2>
      <p style="margin:0 0 10px;font:400 12px/1.5 ui-monospace,Menlo,monospace;color:#6F6A5E;text-transform:uppercase;letter-spacing:.06em">
        ${esc(lead.source)}${lead.channel ? " &middot; " + esc(lead.channel) : ""} &middot; ${esc(lead.author || "unknown")} &middot; ${esc(age(lead.createdAt))}
      </p>
      <p style="margin:0 0 10px;font:400 13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#6F6A5E">
        <strong style="color:#D9480F">Why:</strong> ${esc(lead.why)}
      </p>
      ${
        lead.body
          ? `<blockquote style="margin:0 0 12px;padding:8px 12px;border-left:3px solid #E4DFD3;font:400 13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#23201A">${esc(trim(lead.body, 500))}</blockquote>`
          : ""
      }
      <p style="margin:0 0 6px;font:600 12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#23201A">
        Draft reply${needsEdit(lead.draft) ? ' <span style="color:#A8384A;font-weight:400">— finish the bracketed line first</span>' : ""}
      </p>
      <pre style="margin:0;padding:12px;background:#F2EFE7;border-radius:8px;white-space:pre-wrap;font:400 12px/1.6 ui-monospace,Menlo,monospace;color:#23201A">${esc(lead.draft)}</pre>
      <p style="margin:12px 0 0"><a href="${esc(safeUrl(lead.url))}" style="display:inline-block;background:#C0410C;color:#fff;text-decoration:none;padding:9px 16px;border-radius:8px;font:600 13px/1 -apple-system,Segoe UI,Roboto,sans-serif">Open the post</a></p>
    </article>`,
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#F2EFE7">
  <div style="max-width:660px;margin:0 auto">
    <p style="margin:0 0 4px;font:400 11px/1.5 ui-monospace,Menlo,monospace;color:#6F6A5E;text-transform:uppercase;letter-spacing:.12em">FounderFloor &middot; leadwatch</p>
    <h1 style="margin:0 0 16px;font:600 22px/1.25 Georgia,serif;color:#23201A">
      ${leads.length ? `${leads.length} new ${leads.length === 1 ? "lead" : "leads"}` : "Nothing new this run"}
    </h1>
    ${
      leads.length
        ? ""
        : `<p style="font:400 14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#6F6A5E">That is the normal result most days. A listener that finds something every time has its threshold set too low.</p>`
    }
    ${rows}
    <p style="margin:20px 0 0;font:400 12px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#6F6A5E">
      Queue: ${meta.stats.new} waiting &middot; ${meta.stats.replied} replied &middot; ${meta.stats.skipped} skipped &middot; ${meta.stats.seen} seen all time.<br>
      Nothing here has been sent to anyone. Replies are yours to make, in the thread, as you.
    </p>
  </div></body></html>`;
}
