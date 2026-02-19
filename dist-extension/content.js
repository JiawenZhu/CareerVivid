const s=window.location.hostname.includes("linkedin.com"),l=window.location.hostname.includes("indeed.com"),i=`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #1f2937 0%, #000000 100%);
  color: white;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 9999;
`,p=`
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #374151 0%, #111827 100%);
`;function c(n,o,t){const e=document.createElement("button");return e.className="careervivid-btn",e.innerHTML=`
    ${o}
    <span>${n}</span>
  `,e.style.cssText=i,e.addEventListener("mouseenter",()=>{e.style.cssText=i+p}),e.addEventListener("mouseleave",()=>{e.style.cssText=i}),e.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),t()}),e}function u(){try{if(s){const n=document.querySelector(".job-details-jobs-unified-top-card__job-title")?.textContent?.trim()||document.querySelector(".jobs-unified-top-card__job-title")?.textContent?.trim(),o=document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim()||document.querySelector(".jobs-unified-top-card__company-name")?.textContent?.trim(),t=document.querySelector(".job-details-jobs-unified-top-card__primary-description-container")?.textContent?.trim()||document.querySelector(".jobs-unified-top-card__primary-description-container")?.textContent?.trim(),e=document.querySelector("#job-details")?.textContent?.trim()||"";if(n&&o)return{title:n,company:o,location:t||"",description:e,url:window.location.href}}else if(l){const n=document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim(),o=document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim(),t=document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim(),e=document.querySelector("#jobDescriptionText")?.textContent?.trim()||"";if(n&&o)return{title:n,company:o,location:t||"",description:e,url:window.location.href}}}catch(n){console.error("CareerVivid Extraction Error:",n)}return null}function a(){if(document.querySelector(".careervivid-btn"))return;const n='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>',o=t=>{t.textContent="Saving...";const e=u();e?chrome.runtime.sendMessage({type:"SAVE_JOB",job:e},r=>{r?.success?(t.innerHTML="✓ Saved",t.style.background="#10B981",t.style.borderColor="#059669"):(t.textContent="Error",setTimeout(()=>t.innerHTML=`${n} Save Job`,2e3))}):t.textContent="No Data"};if(s){const t=document.querySelector(".jobs-apply-button--top-card")||document.querySelector(".jobs-unified-top-card__action-container");if(t){const e=c("Save Job",n,()=>o(e));t.appendChild(e)}}else if(l){const t=document.querySelector('[data-testid="indeedApply-button"]')||document.querySelector("#indeedApplyButton");if(t?.parentElement){const e=document.createElement("div");e.style.cssText="display: flex; gap: 8px; margin-top: 12px;";const r=c("Save Job",n,()=>o(r));e.appendChild(r),t.parentElement.insertAdjacentElement("afterend",e)}}}chrome.runtime.onMessage.addListener((n,o,t)=>{if(n.type==="EXTRACT_JOB_DATA"){const e=u();t({job:e})}return!0});window.location.href.includes("careervivid.app/newresume")&&window.location.href.includes("source=extension_tailor")&&chrome.storage.local.get(["pending_tailor_jd"],n=>{n.pending_tailor_jd});function d(){a(),new MutationObserver(()=>a()).observe(document.body,{childList:!0,subtree:!0})}document.readyState==="complete"?d():window.addEventListener("load",d);
