import "../popup/style.css";
import { settings } from "../../utils/paperbox.js";
const $ = id => document.getElementById(id);
const config = await settings(); $("url").value = config.paperboxUrl; $("token").value = config.paperboxToken;
$("save").onclick = async () => {
  try {
    const url = new URL($("url").value.trim());
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw Error("HTTPS 또는 로컬 주소를 입력하세요.");
    if (url.username || url.password || url.search || url.hash) throw Error("서버 기본 주소를 입력하세요.");
    await browser.storage.local.set({ paperboxUrl: url.href.replace(/\/$/, ""), paperboxToken: $("token").value.trim() });
    $("status").textContent = "저장했습니다. 논문 페이지에서 확장을 여세요.";
  } catch (e) { $("status").textContent = e.message; }
};
