import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false });

async function test() {
    try {
        await mermaid.parse(`flowchart TB\nA-->B`);
        console.log("Success with valid diagram!");
    } catch (e) {
        console.error("Caught error:", e.message || e);
    }
}
test();
