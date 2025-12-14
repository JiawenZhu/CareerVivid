"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssr = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Note: These paths are relative to the functions folder after deployment
// Note: These paths are relative to the functions/lib folder after compilation
// In deployment, we copy 'dist' into 'functions/dist'
// So from 'lib/ssr.js', we need to go up one level to find 'dist'
const clientDistPath = path.join(__dirname, '../dist/client');
const serverDistPath = path.join(__dirname, '../dist/server');
// Create Express app
const app = (0, express_1.default)();
// Serve static assets
app.use(express_1.default.static(clientDistPath, { index: false }));
// SSR Handler
app.get(/(.*)/, async (req, res) => {
    try {
        const url = req.originalUrl;
        // Read the index.html template
        let template = fs.readFileSync(path.join(clientDistPath, 'index.html'), 'utf-8');
        // Load the server entry module
        // Note: We need to point to the built server entry file
        // In production, this will be in dist/server/entry-server.js
        const renderModule = await Promise.resolve(`${path.join(serverDistPath, 'entry-server.js')}`).then(s => __importStar(require(s)));
        const render = renderModule.render;
        // Render the app shell
        const appHtml = render(url, {}); // context can be added here
        // Inject the app shell into the template
        const html = template.replace(`<!--ssr-outlet-->`, appHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    }
    catch (e) {
        console.error('SSR Error:', e);
        // Fallback to CSR if SSR fails? Or just error 500
        // For now, let's log and send error
        res.status(500).end(e.message);
    }
});
// Export SSR function with explicit region
exports.ssr = functions.region('us-west1').https.onRequest(app);
//# sourceMappingURL=ssr.js.map