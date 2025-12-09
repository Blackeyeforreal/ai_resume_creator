"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAgent = void 0;
var ollama_1 = require("@langchain/community/llms/ollama");
var prompts_1 = require("@langchain/core/prompts");
var AIAgent = /** @class */ (function () {
    function AIAgent() {
        this.model = new ollama_1.Ollama({
            baseUrl: "http://localhost:11434",
            model: "llama3",
            temperature: 0.2,
        });
    }
    AIAgent.prototype.analyzeJobDescription = function (jdText) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, chain, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = prompts_1.PromptTemplate.fromTemplate("\n      You are an expert technical recruiter and resume strategist.\n      Analyze the following Job Description (JD) and extract the top 5 technical skills, top 3 soft skills, and the core mission of the role.\n      \n      Job Description:\n      {jdText}\n      \n      Output the analysis in a concise JSON format like:\n      {{\n        \"tech_skills\": [\"Skill1\", \"Skill2\"],\n        \"soft_skills\": [\"Skill1\", \"Skill2\"],\n        \"mission\": \"Brief mission statement\"\n      }}\n    ");
                        chain = prompt.pipe(this.model);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, chain.invoke({ jdText: jdText })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        console.error("AI Error:", error_1);
                        return [2 /*return*/, JSON.stringify({ error: "Failed to analyze JD. Ensure Ollama is running." })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AIAgent.prototype.tailorResumeSection = function (sectionName, currentContent, jdAnalysis) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, chain, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = prompts_1.PromptTemplate.fromTemplate("\n      You are a professional resume writer. Your goal is to rewrite the \"{sectionName}\" section of a resume to better align with a target job.\n\n      Target Job Analysis:\n      {jdAnalysis}\n\n      Current Section Content (LaTeX format):\n      {currentContent}\n\n      Instructions:\n      1. Keep the LaTeX formatting exactly as is (e.g., \\item, \\textbf).\n      2. Rewrite bullet points to emphasize relevant skills from the JD.\n      3. Use the STAR method (Situation, Task, Action, Result) if implied by the content.\n      4. Do not invent false information, but highlight existing relevant experience.\n      5. Output ONLY the valid LaTeX code for this section. Do not include markdown code blocks.\n\n      Rewritten Section:\n    ");
                        chain = prompt.pipe(this.model);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, chain.invoke({ sectionName: sectionName, currentContent: currentContent, jdAnalysis: jdAnalysis })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.replace(/```latex/g, '').replace(/```/g, '').trim()];
                    case 3:
                        error_2 = _a.sent();
                        console.error("AI Error:", error_2);
                        return [2 /*return*/, currentContent];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AIAgent;
}());
exports.AIAgent = AIAgent;
