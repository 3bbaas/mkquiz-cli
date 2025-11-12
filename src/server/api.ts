import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { loadConfig, saveConfig, configExists, loadAndValidateConfig } from '../utils/configManager';
import { loadAllQuizzes, saveAllQuizzes, addQuizToStructure, removeQuizFromStructure, getQuizzesForYear } from '../utils/jsonUtils';
import { validateQuizJsonFile } from '../utils/validation';
import { copyJSONToTarget, ensureQuizFolder, writeFile, rmvQuizFolder } from '../utils/fileUtils';
import { processTemplate } from '../lib/templateProcessor';
import { normalizeQuizPath } from '../utils/pathUtils';
import { Config, AddQuizAnswers, QuizData, YearOption } from '../types';
import { MkquizError } from '../utils/errors';
import log from '../utils/logger';
import { createGeminiOcrService } from '../utils/geminiOcr';

const app = express();

// Configure multer to preserve file extensions
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure uploads directory exists
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads', { recursive: true });
        }
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

/**
 * Error handling middleware
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    log.error('API Error', err);
    
    if (err instanceof MkquizError) {
        res.status(400).json({ error: err.message, type: err.name });
    } else {
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});

/**
 * GET /api/config - Get current configuration
 */
app.get('/api/config', (req: Request, res: Response) => {
    try {
        if (!configExists()) {
            return res.status(404).json({ error: 'Configuration not found' });
        }
        
        const config = loadConfig();
        res.json(config);
    } catch (error) {
        log.error('Failed to get config', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * POST /api/config - Save configuration
 */
app.post('/api/config', (req: Request, res: Response) => {
    try {
        const { projectPath, templateFile, allQuizzezJsonPath } = req.body;
        
        if (!projectPath || !templateFile || !allQuizzezJsonPath) {
            return res.status(400).json({ error: 'Missing required configuration fields' });
        }
        
        const config: Config = {
            projectPath,
            templateFile,
            allQuizzezJsonPath
        };
        
        saveConfig(config);
        log.info('Configuration saved via API');
        res.json({ success: true, config });
    } catch (error) {
        log.error('Failed to save config', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * GET /api/quizzes - Get all quizzes
 */
app.get('/api/quizzes', (req: Request, res: Response) => {
    try {
        const config = loadAndValidateConfig();
        const allQuizzes = loadAllQuizzes(config.allQuizzezJsonPath);
        res.json(allQuizzes);
    } catch (error) {
        log.error('Failed to get quizzes', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * GET /api/quizzes/:year - Get quizzes for a specific year
 */
app.get('/api/quizzes/:year', (req: Request, res: Response) => {
    try {
        const { year } = req.params;
        const config = loadAndValidateConfig();
        const allQuizzes = loadAllQuizzes(config.allQuizzezJsonPath);
        const yearData = getQuizzesForYear(allQuizzes, year);
        
        if (!yearData) {
            return res.status(404).json({ error: `No quizzes found for ${year} year` });
        }
        
        res.json(yearData);
    } catch (error) {
        log.error('Failed to get quizzes for year', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * POST /api/quizzes - Add a new quiz
 */
app.post('/api/quizzes', upload.single('jsonFile'), async (req: Request, res: Response) => {
    try {
        const { quizName, quizFor, questionType, year, published } = req.body;
        const file = req.file;
        
        if (!quizName || !quizFor || !questionType || !year || !file) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const config = loadAndValidateConfig();
        const { projectPath, templateFile, allQuizzezJsonPath } = config;
        
        // Validate the uploaded JSON file
        const quizQuestions = validateQuizJsonFile(file.path);
        const questionsCount = quizQuestions.length;
        
        // Load all quizzes
        const allQuizzes = loadAllQuizzes(allQuizzezJsonPath);
        
        // Determine quiz name with suffix if needed
        const baseQuizName = `${quizName} ${questionType}`;
        const quizFolderName = baseQuizName; // Simplified for now
        
        // Create quiz folder
        const quizFolderPath = await ensureQuizFolder(
            projectPath,
            year,
            quizFor,
            quizFolderName,
            null
        );
        
        if (!quizFolderPath) {
            // Clean up uploaded file
            fs.unlinkSync(file.path);
            return res.status(400).json({ error: 'Failed to create quiz folder' });
        }
        
        // Copy JSON file
        const jsonTargetPath = await copyJSONToTarget(
            quizFolderPath,
            file.path,
            `${quizName}_${questionType}`
        );
        
        // Calculate duration
        const duration = Math.floor((questionsCount / 10) * 4) + 1;
        
        // Process template
        const indexHtml = processTemplate(templateFile, {
            quizName,
            quizFor,
            questionsCount,
            duration,
            jsonPath: normalizeQuizPath(jsonTargetPath),
        });
        
        // Write index.html
        writeFile(path.join(quizFolderPath, 'index.html'), indexHtml);
        
        // Add to structure
        const quizData: QuizData = {
            type: questionType,
            path: normalizeQuizPath(quizFolderPath),
            published: published === 'true' || published === true,
            JSON: normalizeQuizPath(jsonTargetPath),
        };
        
        addQuizToStructure(allQuizzes, year, quizName, quizFor, quizData);
        saveAllQuizzes(allQuizzezJsonPath, allQuizzes);
        
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        
        log.success('Quiz added via API', { name: quizName, year, type: questionType });
        res.json({ success: true, quiz: quizData, questionsCount });
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
        log.error('Failed to add quiz', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * DELETE /api/quizzes - Remove quiz(zes)
 */
app.delete('/api/quizzes', async (req: Request, res: Response) => {
    try {
        const { quizzes } = req.body; // Array of {year, subject, examType, quizType, path}
        
        if (!Array.isArray(quizzes) || quizzes.length === 0) {
            return res.status(400).json({ error: 'No quizzes specified for removal' });
        }
        
        const config = loadAndValidateConfig();
        const { projectPath, allQuizzezJsonPath } = config;
        const allQuizzes = loadAllQuizzes(allQuizzezJsonPath);
        
        let removed = 0;
        
        for (const quiz of quizzes) {
            const { year, subject, examType, quizType, path: quizPath } = quiz;
            
            // Remove folder
            if (quizPath) {
                await rmvQuizFolder(projectPath, quizPath);
            }
            
            // Remove from structure
            removeQuizFromStructure(allQuizzes, year, subject, examType, quizType);
            removed++;
        }
        
        // Save updated data
        saveAllQuizzes(allQuizzezJsonPath, allQuizzes);
        
        log.success(`Removed ${removed} quiz(zes) via API`);
        res.json({ success: true, removed });
    } catch (error) {
        log.error('Failed to remove quizzes', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * POST /api/quizzes/from-pdf - Extract quiz from PDF using Gemini AI
 */
app.post('/api/quizzes/from-pdf', upload.single('pdfFile'), async (req: Request, res: Response) => {
    let tempJsonPath: string | null = null;
    
    try {
        const { quizName, quizFor, questionType, year, published, geminiApiKey } = req.body;
        const file = req.file;
        
        if (!quizName || !quizFor || !questionType || !year || !file) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Get API key from request or environment
        const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(400).json({ 
                error: 'Gemini API key is required. Provide it in the form or set GEMINI_API_KEY environment variable.' 
            });
        }
        
        log.info('Processing PDF with Gemini AI...', { quizName, year, type: questionType });
        
        // Read PDF file
        const pdfBuffer = fs.readFileSync(file.path);
        
        // Extract questions using Gemini
        const geminiService = createGeminiOcrService(apiKey);
        const questions = await geminiService.extractQuestionsFromPDF(pdfBuffer);
        
        if (questions.length === 0) {
            // Clean up
            fs.unlinkSync(file.path);
            return res.status(400).json({ error: 'No questions found in the PDF' });
        }
        
        // Save questions to temporary JSON file
        tempJsonPath = path.join('uploads', `quiz-${Date.now()}.json`);
        await geminiService.saveQuestionsToFile(questions, tempJsonPath);
        
        const config = loadAndValidateConfig();
        const { projectPath, templateFile, allQuizzezJsonPath } = config;
        
        // Validate the generated JSON
        const quizQuestions = validateQuizJsonFile(tempJsonPath);
        const questionsCount = quizQuestions.length;
        
        // Load all quizzes
        const allQuizzes = loadAllQuizzes(allQuizzezJsonPath);
        
        // Determine quiz name
        const baseQuizName = `${quizName} ${questionType}`;
        const quizFolderName = baseQuizName;
        
        // Create quiz folder
        const quizFolderPath = await ensureQuizFolder(
            projectPath,
            year,
            quizFor,
            quizFolderName,
            null
        );
        
        if (!quizFolderPath) {
            throw new MkquizError('Failed to create quiz folder');
        }
        
        // Copy JSON to target
        const jsonTargetPath = await copyJSONToTarget(
            quizFolderPath,
            tempJsonPath,
            `${quizName}_${questionType}`
        );
        
        // Calculate duration
        const duration = Math.floor((questionsCount / 10) * 4) + 1;
        
        // Process template
        const indexHtml = processTemplate(templateFile, {
            quizName,
            quizFor,
            questionsCount,
            duration,
            jsonPath: normalizeQuizPath(jsonTargetPath),
        });
        
        // Write index.html
        await writeFile(path.join(quizFolderPath, 'index.html'), indexHtml);
        
        // Create quiz data
        const quizData: QuizData = {
            type: questionType,
            path: normalizeQuizPath(quizFolderPath),
            published: published === 'true' || published === true,
            JSON: normalizeQuizPath(jsonTargetPath),
        };
        
        // Add to structure
        addQuizToStructure(allQuizzes, year, quizName, quizFor, quizData);
        
        // Save updated data
        saveAllQuizzes(allQuizzezJsonPath, allQuizzes);
        
        // Clean up
        fs.unlinkSync(file.path);
        if (tempJsonPath) {
            fs.unlinkSync(tempJsonPath);
        }
        
        log.success('Quiz created from PDF via API', { 
            name: quizName, 
            year, 
            type: questionType,
            questionsCount 
        });
        
        res.json({ 
            success: true, 
            quiz: quizData, 
            questionsCount,
            message: `Successfully extracted ${questionsCount} questions from PDF` 
        });
    } catch (error) {
        // Clean up uploaded files on error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
        if (tempJsonPath) {
            try {
                fs.unlinkSync(tempJsonPath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
        log.error('Failed to process PDF', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

/**
 * GET /api/gemini-key - Get Gemini API key from environment
 */
app.get('/api/gemini-key', (req: Request, res: Response) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            // Return masked key for security (only show first/last few characters)
            const maskedKey = apiKey.length > 8 
                ? `${apiKey.slice(0, 4)}${'*'.repeat(apiKey.length - 8)}${apiKey.slice(-4)}`
                : '*'.repeat(apiKey.length);
            res.json({ 
                apiKey: apiKey, // Send full key for form field
                hasKey: true,
                maskedKey: maskedKey 
            });
        } else {
            res.json({ hasKey: false });
        }
    } catch (error) {
        res.json({ hasKey: false });
    }
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Clean up old temporary files in uploads directory
 */
function cleanupOldTempFiles() {
    try {
        const uploadsDir = 'uploads';
        if (!fs.existsSync(uploadsDir)) {
            return;
        }

        const files = fs.readdirSync(uploadsDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        let cleaned = 0;
        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            try {
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(filePath);
                    cleaned++;
                }
            } catch (e) {
                // Ignore errors for individual files
            }
        });

        if (cleaned > 0) {
            log.info(`Cleaned up ${cleaned} old temporary file(s)`);
        }
    } catch (error) {
        log.error('Error cleaning up temporary files', error);
    }
}

/**
 * Start the server
 */
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export function startServer(port: number = PORT) {
    // Clean up old temporary files on startup
    cleanupOldTempFiles();

    app.listen(port, () => {
        log.info(`mkquiz web server started on http://localhost:${port}`);
        console.log(`\n🚀 mkquiz Web GUI: http://localhost:${port}`);
        console.log(`📊 API Endpoints: http://localhost:${port}/api`);
        console.log(`❤️  Health Check: http://localhost:${port}/api/health\n`);
    });
}

export default app;
