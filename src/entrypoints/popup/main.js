import "./style.css";
import { api, toInput } from "../../utils/paperbox.js";
const $ = id => document.getElementById(id);
let items = [], selectedPaperId, pending;
const labels = { ready: "검색 준비됨", indexing: "검색 준비 중", retry_needed: "검색 처리 대기·재시도 필요", no_pdf: "PDF 없음", needs_text: "텍스트 추출 필요" };
function show(text) { $("status").textContent = text; }
function identity() { selectedPaperId = null; const p = items[$("papers").value]; $("identity").textContent = p ? (p.DOI || p.url || "서지 확인 필요") : ""; }
async function register(body) {
  if (!body.project_ids) body.project_ids = [...$("project").selectedOptions].map(o => o.value);
  try {
    const paper = await api("/api/tools/paper_add", body);
    selectedPaperId = paper.paper_id;
    show(`${paper.title}\n${paper.has_pdf ? "PDF 보관됨" : "서지 등록됨 · PDF 직접 업로드 가능"}\n${labels[paper.index_status] || paper.index_status}${paper.warning ? "\n" + paper.warning : ""}`);
    pending = null; $("choice").hidden = true;
    return paper;
  } catch (error) {
    if (error.code === "pdf_choice_required") { pending = body; const pid = error.message.match(/paper_id=([0-9a-f-]+)/)?.[1]; if (pid) pending.paper_id = pid; $("choice").hidden = false; }
    throw error;
  }
}
$("papers").onchange = identity;
$("options").onclick = () => browser.runtime.openOptionsPage();
$("save").onclick = async () => { $("save").disabled = true; try { show("보관 중…"); await register(toInput(items[$("papers").value])); } catch (e) { show(e.message); } finally { $("save").disabled = false; } };
$("upload").onclick = async () => {
  $("upload").disabled = true;
  try {
    const files = [...$("files").files];
    for (const file of files) {
      show(file.name + " 업로드 중…");
      const form = new FormData(); form.append("file", file);
      const uploaded = await api("/api/upload", form);
      const body = { upload_id: uploaded.upload_id };
      // One chosen PDF may complete the selected webpage's bibliography. Several
      // PDFs are independent papers and must not all attach to the selected one.
      if (files.length === 1) {
        if (selectedPaperId) body.paper_id = selectedPaperId;
        else if (items[$("papers").value]) Object.assign(body, toInput(items[$("papers").value]));
      }
      await register(body);
    }
  } catch (e) { show(e.message); } finally { $("upload").disabled = false; }
};
for (const action of ["replace", "supplement"]) $(action).onclick = async () => {
  if (!pending) return;
  try { await register({ ...pending, pdf_action: action }); } catch (e) { show(e.message); }
};
(async () => {
  try {
    const result = await browser.runtime.sendMessage({ type: "paperboxDetect" });
    if (result.error) throw Error(result.error);
    items = result.items || [];
    $("papers").replaceChildren(...items.map((p, i) => new Option(p.title || "미확인 문헌", i)));
    identity(); $("save").disabled = !items.length;
    show(result.warning || "서지를 확인하고 보관하세요.");
  } catch (e) { show(e.message); }
  try { const result = await api("/api/tools/project_list", {}); $("project").append(...result.projects.map(p => new Option(p.name, p.project_id))); }
  catch (e) { show(e.message); }
})();
