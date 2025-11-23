"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamGeminiResponse = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const generative_ai_1 = require("@google/generative-ai");
const cors_1 = __importDefault(require("cors"));
const corsHandler = (0, cors_1.default)({ origin: true });
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
const END_MARKER = "__END_GEMINI__";
exports.streamGeminiResponse = (0, https_1.onRequest)({
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    region: "us-west1",
    memory: "1GiB",
    invoker: "public",
}, async (req, res) => {
    corsHandler(req, res, async () => {
        var _a, e_1, _b, _c;
        var _d, _e, _f;
        res.setHeader("Access-Control-Allow-Origin", "*");
        if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.status(204).end();
            return;
        }
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        const payload = (_f = (_e = (_d = req.body) === null || _d === void 0 ? void 0 : _d.data) !== null && _e !== void 0 ? _e : req.body) !== null && _f !== void 0 ? _f : {};
        let { modelName = "gemini-2.5-flash", contents, config, systemInstruction, } = payload;
        if (!systemInstruction && (config === null || config === void 0 ? void 0 : config.systemInstruction)) {
            systemInstruction = config.systemInstruction;
            delete config.systemInstruction;
        }
        if (!contents) {
            res.status(400).send("Missing contents payload.");
            return;
        }
        try {
            const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey.value());
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: config,
                systemInstruction,
            });
            const result = await model.generateContentStream({ contents });
            res.setHeader("Content-Type", "text/plain");
            res.setHeader("Transfer-Encoding", "chunked");
            let aggregatedText = "";
            try {
                for (var _g = true, _h = __asyncValues(result.stream), _j; _j = await _h.next(), _a = _j.done, !_a; _g = true) {
                    _c = _j.value;
                    _g = false;
                    const chunk = _c;
                    const chunkText = chunk.text();
                    if (chunkText) {
                        aggregatedText += chunkText;
                        res.write(chunkText);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_g && !_a && (_b = _h.return)) await _b.call(_h);
                }
                finally { if (e_1) throw e_1.error; }
            }
            const finalResponse = await result.response;
            const jsonResponse = typeof finalResponse.toJSON === "function"
                ? finalResponse.toJSON()
                : finalResponse;
            const payloadJson = JSON.stringify({
                response: jsonResponse,
                text: aggregatedText,
            });
            res.write(`\n${END_MARKER}${payloadJson}`);
            res.end();
        }
        catch (error) {
            console.error("Gemini Proxy Error:", error);
            if (!res.headersSent) {
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.status(500).json({ error: error.message || "Gemini proxy failed" });
            }
            else {
                res.end();
            }
        }
    });
});
//# sourceMappingURL=geminiProxy.js.map