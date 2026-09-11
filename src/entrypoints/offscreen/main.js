// Preserve JabRef's translation engine and bundled Zotero translators.
import { withLocation } from "../../utils/pageDocument.js";

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== "paperboxTranslate" || sender.id !== browser.runtime.id) return;
  return (async () => {
    try {
      const doc = withLocation(new DOMParser().parseFromString(message.html, "text/html"), message.url);
      const engine = await createTranslateEngine(message.url);
      const detected = await engine.detect(doc);
      // Collection pages require an item-selection UI; ask users to open the
      // individual paper instead of silently importing an entire result list.
      const infos = detected.filter(info => info.itemType !== "multiple");
      if (!infos.length) return { error: "논문 상세 페이지에서 실행해 주세요." };
      const translators = infos.map(info => {
        const translator = new Zotero.Translator({ ...info }); translator.file = { path: info.path }; return translator;
      });
      const result = await engine.translate(doc, translators);
      return { items: result.items };
    } catch (e) { return { error: String(e) }; }
  })();
});
