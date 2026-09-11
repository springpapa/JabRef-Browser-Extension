import { readFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import { beforeAll, expect, it } from "vitest";
import { toInput } from "../src/utils/paperbox.js";
import { withLocation } from "../src/utils/pageDocument.js";

it("preserves metadata and picks the actual PDF attachment", () => {
  const input = toInput({ title: "Verified title", DOI: "10.1234/paper", date: "2025-03-01",
    creators: [{ creatorType: "author", firstName: "J", lastName: "Kim" }],
    attachments: [{ mimeType: "text/html", url: "https://example.org/snapshot" },
      { mimeType: "application/pdf", url: "https://example.org/paper.pdf" }] });
  expect(input.url).toBe("https://example.org/paper.pdf");
  expect(input.metadata.author[0]).toEqual({ given: "J", family: "Kim" });
  expect(input.metadata.issued["date-parts"]).toEqual([[2025]]);
  expect(toInput({ title: "Unknown" }).metadata).not.toHaveProperty("issued");
});

beforeAll(() => {
  const dom = new JSDOM('<html><head><meta name="citation_title" content="A real metadata fixture">' +
    '<meta name="citation_author" content="Kim, Ji"><meta name="citation_doi" content="10.1234/fixture">' +
    '<meta name="citation_journal_title" content="Fixture Journal"><meta name="citation_publication_date" content="2025/03/01">' +
    '<meta name="citation_pdf_url" content="https://example.org/paper.pdf"></head><body></body></html>',
    { url: "https://example.org/article" });
  for (const name of ["document", "window", "DOMParser", "XPathResult", "Node", "Element", "XMLSerializer", "XMLHttpRequest"]) globalThis[name] = dom.window[name];
  globalThis.browser = { runtime: { getURL: p => p.includes("sandbox.js") ? "/sandbox.js" : path.resolve("translators/zotero", p.replace(/^\/?translators\//, "")) }, storage: { sync: { get: async () => ({}) } } };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => String(url).startsWith(process.cwd()) ? new Response(await readFile(String(url), "utf8")) : realFetch(url, options);
});

it("runs the bundled metadata translator against a page snapshot", async () => {
  const { createTranslateEngine } = await import("../src/utils/translateEngine.js");
  const snapshot = withLocation(new DOMParser().parseFromString(document.documentElement.outerHTML, "text/html"), document.location.href);
  const engine = await createTranslateEngine(snapshot.location.href);
  const infos = await engine.detect(snapshot);
  const chosen = infos.find(info => info.label === "Embedded Metadata");
  expect(chosen).toBeDefined();
  const translator = new Zotero.Translator({ ...chosen }); translator.file = { path: chosen.path };
  const result = await engine.translate(snapshot, [translator]);
  expect(result.items[0].title).toBe("A real metadata fixture");
  expect(result.items[0].DOI).toBe("10.1234/fixture");
}, 20000);
