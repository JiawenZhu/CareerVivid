import{r as d,j as a}from"./main-Bi0Ei0w3.js";import{R as w}from"./ResumePreview-DDWIOQcJ.js";import"./types-C3IBSKjb.js";import"./InlineEdit-DZd6Scr2.js";import"./pen-BDBs_6MJ.js";import"./link-BhQT70ww.js";import"./mail-TURoK-Rd.js";import"./send-B-WXdUxM.js";import"./video-DvvOWLCy.js";import"./youtube-DPssPfR1.js";import"./twitter-BrsgoJMC.js";import"./linkedin-DJ3yEV_I.js";import"./globe-cx_xjewK.js";import"./map-pin-DPpu8ZWV.js";import"./code-ClBPHmQt.js";import"./graduation-cap-e9Lh-ZpC.js";import"./star-DKH07wdV.js";const m=()=>{if(typeof window>"u")return null;const r=window.location.hash||"",s=r.indexOf("?");if(s===-1)return null;const n=new URLSearchParams(r.substring(s+1)).get("data");if(!n)return null;try{const o=n.replace(/-/g,"+").replace(/_/g,"/"),i=o.length%4===0?o:o+"=".repeat(4-o.length%4),e=atob(i);return JSON.parse(e)}catch(o){return console.warn("Failed to decode PDF preview payload",o),null}},H=()=>{const[r,s]=d.useState(()=>m()),[l,n]=d.useState(null);d.useEffect(()=>{window.__PDF_STATUS__="ready",window.__RENDER_PAYLOAD__=t=>{t?.resumeData&&t?.templateId?(s(t),n(null)):n("Invalid resume payload received")};const e=window.__PENDING_PAYLOAD__;return e&&(s(e),window.__PENDING_PAYLOAD__=void 0),()=>{window.__RENDER_PAYLOAD__=void 0}},[]),d.useEffect(()=>{(async()=>{if(r){try{await document.fonts.ready}catch(t){console.warn("Font loading timeout or error",t)}requestAnimationFrame(()=>{requestAnimationFrame(()=>{window.__PDF_STATUS__="rendered"})})}else window.__PDF_STATUS__="ready"})()},[r]);const i=(()=>{if(!r)return null;{const e={Merriweather:"Times New Roman, serif","Crimson Text":"Times New Roman, serif",Inter:"Arial, Helvetica, sans-serif",Roboto:"Arial, Helvetica, sans-serif"};return{...r,resumeData:{...r.resumeData,bodyFont:e[r.resumeData.bodyFont]||"Arial, Helvetica, sans-serif",titleFont:e[r.resumeData.titleFont]||"Arial, Helvetica, sans-serif"}}}})();return d.useEffect(()=>{const e=document.body,t=document.documentElement,c=e.style.margin,p=e.style.backgroundColor,u=e.style.padding,f=t.style.margin,y=t.style.padding,g=t.style.backgroundColor;return e.style.margin="0",e.style.padding="0",e.style.backgroundColor="#e5e7eb",t.style.margin="0",t.style.padding="0",t.style.backgroundColor="#e5e7eb",()=>{e.style.margin=c,e.style.padding=u,e.style.backgroundColor=p,t.style.margin=f,t.style.padding=y,t.style.backgroundColor=g}},[]),d.useEffect(()=>{if(!r){const e=m();e&&(s(e),n(null))}},[r]),a.jsxs("div",{className:"pdf-preview-viewport",children:[a.jsx("style",{children:`
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
      `}),a.jsx("div",{className:"pdf-sheet","data-pdf-sheet":!0,children:i?a.jsx(w,{resume:i.resumeData,template:i.templateId}):a.jsxs("div",{className:"h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4",children:[a.jsx("p",{className:"text-lg font-semibold",children:"Waiting for resume data…"}),l&&a.jsx("p",{className:"text-sm text-red-500",children:l}),a.jsxs("p",{className:"text-sm max-w-xs",children:["This page is used by the PDF renderer. If you're testing manually, append a base64 encoded payload to the URL using the ",a.jsx("code",{children:"?data="})," query parameter."]})]})})]})};export{H as default};
