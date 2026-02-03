import{r as i,j as a}from"./main-BEc7sVU2.js";import{R as w}from"./ResumePreview-CGTy__pj.js";import"./types-C3IBSKjb.js";import"./InlineEdit-LXaiIIc8.js";import"./pen-CDP9jQDD.js";import"./link-fr0uO6pY.js";import"./mail-C8AWi2yh.js";import"./send-BU04lBHk.js";import"./briefcase-BA81y1Cf.js";import"./video-n-qxSk9V.js";import"./youtube-DXIyuMbX.js";import"./twitter-BkzJSFqN.js";import"./linkedin-KoM4kuTt.js";import"./globe-DgZdGzus.js";import"./map-pin-OOBizwV5.js";import"./code-DFGvkwP7.js";import"./user-z_w8hJb6.js";import"./graduation-cap-CWgYxLce.js";import"./star-D73ZxPTB.js";const m=()=>{if(typeof window>"u")return null;const r=window.location.hash||"",s=r.indexOf("?");if(s===-1)return null;const n=new URLSearchParams(r.substring(s+1)).get("data");if(!n)return null;try{const o=n.replace(/-/g,"+").replace(/_/g,"/"),d=o.length%4===0?o:o+"=".repeat(4-o.length%4),e=atob(d);return JSON.parse(e)}catch(o){return console.warn("Failed to decode PDF preview payload",o),null}},L=()=>{const[r,s]=i.useState(()=>m()),[l,n]=i.useState(null);i.useEffect(()=>{window.__PDF_STATUS__="ready",window.__RENDER_PAYLOAD__=t=>{t?.resumeData&&t?.templateId?(s(t),n(null)):n("Invalid resume payload received")};const e=window.__PENDING_PAYLOAD__;return e&&(s(e),window.__PENDING_PAYLOAD__=void 0),()=>{window.__RENDER_PAYLOAD__=void 0}},[]),i.useEffect(()=>{(async()=>{if(r){try{await document.fonts.ready}catch(t){console.warn("Font loading timeout or error",t)}requestAnimationFrame(()=>{requestAnimationFrame(()=>{window.__PDF_STATUS__="rendered"})})}else window.__PDF_STATUS__="ready"})()},[r]);const d=(()=>{if(!r)return null;{const e={Merriweather:"Times New Roman, serif","Crimson Text":"Times New Roman, serif",Inter:"Arial, Helvetica, sans-serif",Roboto:"Arial, Helvetica, sans-serif"};return{...r,resumeData:{...r.resumeData,bodyFont:e[r.resumeData.bodyFont]||"Arial, Helvetica, sans-serif",titleFont:e[r.resumeData.titleFont]||"Arial, Helvetica, sans-serif"}}}})();return i.useEffect(()=>{const e=document.body,t=document.documentElement,c=e.style.margin,p=e.style.backgroundColor,u=e.style.padding,f=t.style.margin,y=t.style.padding,g=t.style.backgroundColor;return e.style.margin="0",e.style.padding="0",e.style.backgroundColor="#e5e7eb",t.style.margin="0",t.style.padding="0",t.style.backgroundColor="#e5e7eb",()=>{e.style.margin=c,e.style.padding=u,e.style.backgroundColor=p,t.style.margin=f,t.style.padding=y,t.style.backgroundColor=g}},[]),i.useEffect(()=>{if(!r){const e=m();e&&(s(e),n(null))}},[r]),a.jsxs("div",{className:"pdf-preview-viewport",children:[a.jsx("style",{children:`
        @page { size: A4; margin: 0; }
        .pdf-preview-viewport {
          margin: 0;
          padding: 0;
          background: #e5e7eb;
        }
        .pdf-sheet {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          margin: 0 auto;
          overflow: visible;
        }
        .pdf-sheet .shadow-lg,
        .pdf-sheet [class*="shadow-"] {
          box-shadow: none !important;
        }
      `}),a.jsx("div",{className:"pdf-sheet","data-pdf-sheet":!0,children:d?a.jsx(w,{resume:d.resumeData,template:d.templateId}):a.jsxs("div",{className:"h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4",children:[a.jsx("p",{className:"text-lg font-semibold",children:"Waiting for resume data…"}),l&&a.jsx("p",{className:"text-sm text-red-500",children:l}),a.jsxs("p",{className:"text-sm max-w-xs",children:["This page is used by the PDF renderer. If you're testing manually, append a base64 encoded payload to the URL using the ",a.jsx("code",{children:"?data="})," query parameter."]})]})})]})};export{L as default};
