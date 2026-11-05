import { useEffect } from "react";

export type MetaTag = { name: string; content: string } | { property: string; content: string };

/**
 * Sets the document title and upserts <meta> tags for the current page.
 * Replaces TanStack Router's per-route `head()`; pass a module-level array so
 * the effect only re-runs when the page changes.
 */
export function usePageMeta(title: string, meta: readonly MetaTag[] = []) {
  useEffect(() => {
    document.title = title;
    for (const tag of meta) {
      const [attr, key]: [string, string] =
        "name" in tag ? ["name", tag.name] : ["property", tag.property];
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", tag.content);
    }
  }, [title, meta]);
}
