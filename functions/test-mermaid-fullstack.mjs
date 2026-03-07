import mermaid from 'mermaid';
import { readFileSync } from 'fs';

mermaid.initialize({ startOnLoad: false });

async function test() {
    try {
        const content = readFileSync('/Users/jiawenzhu/careervivid/careervivid-fullstack.mmd', 'utf8');
        const mermaidContent = content.split('---').pop().trim();
        await mermaid.parse(mermaidContent);
        console.log("Success with valid diagram (no errors thrown)!");
    } catch (e) {
        const msg = e.message || "";
        if (msg.includes("DOMPurify")) {
            console.log("Success! Bypassed DOMPurify crash. The syntax is valid.");
        } else {
            console.error("Caught true syntax error:", msg);
        }
    }
}
test();
