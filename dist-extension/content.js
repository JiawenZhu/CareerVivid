const u=window.location.hostname.includes("linkedin.com"),m=window.location.hostname.includes("indeed.com"),s=`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
`,b=`
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
`;function r(t,n){const e=document.createElement("button");return e.className="careervivid-btn",e.innerHTML=`
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </svg>
    ${t}
  `,e.style.cssText=s,e.addEventListener("mouseenter",()=>{e.style.cssText=s+b}),e.addEventListener("mouseleave",()=>{e.style.cssText=s}),e.addEventListener("click",n),e}function c(){if(u){const t=document.querySelector(".job-details-jobs-unified-top-card__job-title")?.textContent?.trim(),n=document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim(),e=document.querySelector(".job-details-jobs-unified-top-card__primary-description-container")?.textContent?.trim();if(t&&n)return{title:t,company:n,location:e||"",url:window.location.href}}else if(m){const t=document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim(),n=document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim(),e=document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim();if(t&&n)return{title:t,company:n,location:e||"",url:window.location.href}}return null}function d(){if(!document.querySelector(".careervivid-btn")){if(u){const t=document.querySelector(".jobs-apply-button--top-card");if(t){const n=r("Fill with CareerVivid",()=>{chrome.runtime.sendMessage({type:"OPEN_RESUME_PICKER"})}),e=r("Save Job",()=>{const o=c();o&&(chrome.runtime.sendMessage({type:"SAVE_JOB",job:o}),e.textContent="✓ Saved!",e.style.background="#22C55E")});t.appendChild(n),t.appendChild(e)}}else if(m){const t=document.querySelector('[data-testid="indeedApply-button"]');if(t?.parentElement){const n=document.createElement("div");n.style.cssText="display: flex; gap: 8px; margin-top: 12px;";const e=r("Fill with CareerVivid",()=>{chrome.runtime.sendMessage({type:"OPEN_RESUME_PICKER"})}),o=r("Save Job",()=>{const i=c();i&&(chrome.runtime.sendMessage({type:"SAVE_JOB",job:i}),o.textContent="✓ Saved!",o.style.background="#22C55E")});n.appendChild(e),n.appendChild(o),t.parentElement.insertAdjacentElement("afterend",n)}}}}function f(t){Object.entries({firstName:['[name*="first"]','[id*="first"]','[placeholder*="First"]'],lastName:['[name*="last"]','[id*="last"]','[placeholder*="Last"]'],email:['[type="email"]','[name*="email"]','[id*="email"]'],phone:['[type="tel"]','[name*="phone"]','[id*="phone"]'],city:['[name*="city"]','[id*="city"]'],summary:['[name*="summary"]','[name*="about"]',"textarea"]}).forEach(([e,o])=>{const i=t.personalDetails?.[e];if(i)for(const p of o){const a=document.querySelector(p);if(a&&!a.value){a.value=i,a.dispatchEvent(new Event("input",{bubbles:!0})),a.dispatchEvent(new Event("change",{bubbles:!0}));break}}})}chrome.runtime.onMessage.addListener((t,n,e)=>{switch(t.type){case"FILL_FORM":f(t.data),e({success:!0});break;case"EXTRACT_JOB_DATA":const o=c();e({job:o});break}return!0});function l(){d(),new MutationObserver(()=>{d()}).observe(document.body,{childList:!0,subtree:!0})}document.readyState==="complete"?l():window.addEventListener("load",l);
