import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { LatexProcessor } from './engine/latexProcessor.js';
import { AIAgent } from './engine/aiAgent.js';
import { splitLatexIntoSections } from './engine/latexProcessorOnSteroids.js'
import { fixInvalidBackslashes } from './engine/util.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Engines
const latexProcessor = new LatexProcessor();
const aiAgent = new AIAgent();

// Setup Multer for file uploads (if needed later)
const upload = multer();

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI Resume Backend is running' });
});

app.post('/parse', async (req, res) => {
    try {
        const { latex } = req.body;
        if (!latex) {
            return res.status(400).json({ error: 'No latex content provided' });
        }
        const sections = await aiAgent.parseLatext(latex);     // await aiAgent.parseLatext(latex);// latexProcessor.parseSections(latex);
        try {
            const parsed = fixInvalidBackslashes(sections);
            const jsonParsed = JSON.parse(parsed);
            res.json(jsonParsed);
            console.log(jsonParsed);
        } catch (error) {
            console.error(error);
            res.json({ raw: sections });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Parsing failed' });
    }
});

app.post('/analyze', async (req, res) => {
    try {
        const { jdText } = req.body;
        if (!jdText) {
            return res.status(400).json({ error: 'No JD text provided' });
        }
        const result = await aiAgent.analyzeJobDescription(jdText);
        try {
            const parsed = JSON.parse(result);
            res.json(parsed);
        } catch {
            res.json({ raw: result });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

app.post('/tailor', async (req, res) => {
    try {
        const { sectionName, currentContent, jdAnalysis } = req.body;
        if (!sectionName || !currentContent || !jdAnalysis) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let analysisStr = typeof jdAnalysis === 'string' ? jdAnalysis : JSON.stringify(jdAnalysis);

        const rewritten = await aiAgent.tailorResumeSection(sectionName, currentContent, analysisStr);
        res.json({ content: rewritten });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Tailoring failed' });
    }
});

app.post('/compile', async (req, res) => {
    res.status(501).json({ error: 'Not implemented: Local PDF compilation requires pdflatex.' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
