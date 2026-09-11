export function toInput(item) {
  const metadata = { type: "article-journal", title: item.title || "미확인 문헌" };
  const fields = { publicationTitle: "container-title", volume: "volume", issue: "issue",
    pages: "page", abstractNote: "abstract", url: "URL", DOI: "DOI" };
  for (const [source, target] of Object.entries(fields)) if (item[source]) metadata[target] = item[source];
  const authors = (item.creators || []).filter(c => c.creatorType === "author")
    .map(c => c.fieldMode === 1 ? { literal: c.lastName } : { family: c.lastName, given: c.firstName || "" });
  if (authors.length) metadata.author = authors;
  const date = String(item.date || "").match(/\b(18\d{2}|19\d{2}|20\d{2})\b/);
  if (date) metadata.issued = { "date-parts": [[Number(date[1])]] };
  const pmid = String(item.extra || "").match(/(?:^|\n)PMID:\s*(\d+)/i)?.[1];
  if (pmid) metadata.PMID = pmid;
  const pdf = (item.attachments || []).find(a => a.mimeType === "application/pdf" && /^https?:/.test(a.url || ""));
  return { metadata, doi: item.DOI || undefined, pmid, url: pdf?.url || item.url || undefined };
}

export async function settings() {
  return browser.storage.local.get({ paperboxUrl: "http://127.0.0.1:8765", paperboxToken: "" });
}

export async function api(path, body) {
  const config = await settings();
  if (!config.paperboxToken) throw Error("설정에서 접속 키를 입력하세요.");
  const response = await fetch(config.paperboxUrl.replace(/\/$/, "") + path, {
    method: "POST", headers: { Authorization: "Bearer " + config.paperboxToken,
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }) },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) { const error = Error(result.error?.message || "등록 실패"); error.code = result.error?.code; throw error; }
  return result;
}
