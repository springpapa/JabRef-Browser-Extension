// Paperbox transport for the pinned JabRef/Zotero translation engine (AGPL-3.0).
import { defineBackground } from "wxt/utils/define-background";

export default defineBackground(() => {
  let offscreenPending;
  async function offscreen() {
    if (await browser.offscreen.hasDocument()) return;
    if (!offscreenPending) offscreenPending = browser.offscreen.createDocument({
      url: browser.runtime.getURL("offscreen.html"), reasons: ["DOM_PARSER"],
      justification: "Extract bibliography from the page the user selected",
    }).finally(() => { offscreenPending = null; });
    await offscreenPending;
  }

  browser.runtime.onMessage.addListener(async (message, sender) => {
    // Requests originate only from this extension's UI, never a web page.
    if (message.type !== "paperboxDetect" || sender.id !== browser.runtime.id) return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/.test(tab.url || "")) return { error: "논문 웹페이지에서 실행하세요." };
    let page;
    try {
      const result = await browser.scripting.executeScript({ target: { tabId: tab.id },
        func: () => ({ html: document.documentElement.outerHTML, contentType: document.contentType }) });
      page = result[0]?.result;
    } catch { /* The browser's PDF viewer does not permit script injection. */ }
    if (!page || page.contentType === "application/pdf") return { items: [{ title: tab.title, url: tab.url,
      attachments: [{ url: tab.url, mimeType: "application/pdf" }] }] };
    await offscreen();
    const result = await browser.runtime.sendMessage({ type: "paperboxTranslate", url: tab.url, html: page.html });
    if (result?.items?.length) return result;
    return { items: [{ title: tab.title, url: tab.url }], warning: result?.error || "서지를 확인해 주세요." };
  });
});
