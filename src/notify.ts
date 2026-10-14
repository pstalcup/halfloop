import { print, visitUrl } from "kolmafia";

import { args } from "./util";

export type NotifyOptions = {
  title: string;
  tags?: string[];
  priority?: 1 | 2 | 3 | 4 | 5;
};

function ntfyUrl(topic: string): string {
  // Accept either a bare topic (published to ntfy.sh) or a full URL for a self-hosted server
  const base = /^https?:\/\//.test(topic) ? topic : `https://ntfy.sh/${topic}`;
  return `${base.replace(/\/+$/, "")}/publish`;
}

/**
 * Send a push notification through ntfy (https://ntfy.sh) if the ntfy arg is set.
 * Uses ntfy's GET publish endpoint since KoLmafia form-encodes POST bodies.
 * Never throws: a failed notification should not take down the run.
 */
export function notify(message: string, { title, tags = [], priority = 3 }: NotifyOptions): void {
  if (!args.ntfy) return;

  const params: [string, string][] = [
    ["message", message],
    ["title", title],
    ["priority", `${priority}`],
    ...(tags.length > 0 ? [["tags", tags.join(",")] as [string, string]] : []),
  ];
  const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");

  try {
    visitUrl(`${ntfyUrl(args.ntfy)}?${query}`, false, true);
  } catch (e) {
    print(`Failed to send ntfy notification: ${e}`, "red");
  }
}
