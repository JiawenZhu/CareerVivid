const { prompt } = require("enquirer");

async function main() {
    let pasteBuffer = [];
    console.log("Try pasting multiple lines. Press Enter again to submit.");
    
    async function ask() {
        const start = Date.now();
        const response = await prompt({
            type: "input",
            name: "query",
            message: pasteBuffer.length > 0 ? "... " : "> "
        });
        const duration = Date.now() - start;
        
        let input = response.query;

        if (duration < 30) { // Fast resolve = pasted from buffer
            pasteBuffer.push(input);
            return ask();
        } else {
            // Slow resolve = user typed or waited
            if (pasteBuffer.length > 0) {
                if (input) pasteBuffer.push(input);
                input = pasteBuffer.join("\n");
                pasteBuffer = []; // reset
            }
            
            if (input.trim() === "exit") process.exit(0);
            
            console.log("\n----- SUBMITTED -----");
            console.log(input);
            console.log("---------------------\n");
            
            return ask();
        }
    }
    
    await ask();
}

main();
