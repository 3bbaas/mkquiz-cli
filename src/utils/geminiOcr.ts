import { GoogleGenerativeAI } from '@google/generative-ai';
import log from './logger';
import { MkquizError } from './errors';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Interface for quiz questions
 */
export interface QuizQuestion {
  id: number;
  question: string;
  options: Record<string, string>;
  answer: string;
}

/**
 * Extract quiz questions from PDF using Gemini AI
 */
export class GeminiOcrService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new MkquizError('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-1.5-pro which supports PDF and multimodal inputs
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Generate the prompt for quiz extraction
   */
  private generatePrompt(): string {
    return `You are an expert at extracting quiz questions from documents. 

Analyze the provided document and extract ALL quiz questions you find. For each question:

1. Extract the question text exactly as it appears
2. Extract all answer options
3. Identify the correct answer
4. For mathematical formulas or symbols, convert them to KaTeX format (LaTeX syntax)
   Examples:
   - Fractions: \\frac{a}{b}
   - Superscripts: x^2 or x^{10}
   - Subscripts: x_1 or x_{10}
   - Greek letters: \\alpha, \\beta, \\gamma
   - Square root: \\sqrt{x}
   - Summation: \\sum_{i=1}^{n}
   - Integrals: \\int_{a}^{b}

Return ONLY a valid JSON array in this exact format:
[
  {
    "id": 1,
    "question": "What does HTML stand for?",
    "options": {
      "a": "Hyper Text Markup Language",
      "b": "Home Tool Markup Language",
      "c": "Hyperlinks and Text Markup Language"
    },
    "answer": "a"
  },
  {
    "id": 2,
    "question": "What is the derivative of $x^2$?",
    "options": {
      "a": "$2x$",
      "b": "$x$",
      "c": "$x^2$"
    },
    "answer": "a"
  }
]

Important rules:
- Use sequential IDs starting from 1
- Options keys must be lowercase letters (a, b, c, d, etc.)
- The "answer" field must match one of the option keys
- Wrap math expressions in $ symbols for inline math or $$ for display math
- Return ONLY the JSON array, no additional text or explanation
- If no questions are found, return an empty array []`;
  }

  /**
   * Extract text and questions from PDF buffer
   */
  async extractQuestionsFromPDF(pdfBuffer: Buffer): Promise<QuizQuestion[]> {
    try {
      log.info('Starting PDF extraction with Gemini AI...');

      // Convert PDF buffer to base64
      const base64PDF = pdfBuffer.toString('base64');

      // Create the content with inline data
      const imagePart = {
        inlineData: {
          data: base64PDF,
          mimeType: 'application/pdf',
        },
      };

      const prompt = this.generatePrompt();

      log.debug('Sending PDF to Gemini API...');
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      log.debug('Received response from Gemini API');
      log.debug(`Response text: ${text.substring(0, 200)}...`);

      // Extract JSON from the response
      const questions = this.parseQuestionsFromResponse(text);

      log.info(`Successfully extracted ${questions.length} questions from PDF`);
      return questions;
    } catch (error: any) {
      log.error('Failed to extract questions from PDF', error);
      throw new MkquizError(
        `Failed to extract questions from PDF: ${error.message}`
      );
    }
  }

  /**
   * Parse questions from Gemini API response
   */
  private parseQuestionsFromResponse(text: string): QuizQuestion[] {
    try {
      // Try to find JSON array in the response
      // Sometimes the model includes markdown code blocks
      let jsonText = text.trim();

      // Remove markdown code blocks if present
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      }

      // Try to find array brackets
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonText = arrayMatch[0];
      }

      // Parse the JSON
      const questions = JSON.parse(jsonText);

      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      // Validate each question
      const validatedQuestions: QuizQuestion[] = questions.map(
        (q: any, index: number) => {
          if (!q.id || !q.question || !q.options || !q.answer) {
            throw new Error(
              `Invalid question at index ${index}: missing required fields`
            );
          }

          if (typeof q.options !== 'object') {
            throw new Error(
              `Invalid question at index ${index}: options must be an object`
            );
          }

          if (!q.options[q.answer]) {
            throw new Error(
              `Invalid question at index ${index}: answer key "${q.answer}" not found in options`
            );
          }

          return {
            id: q.id,
            question: q.question,
            options: q.options,
            answer: q.answer,
          };
        }
      );

      return validatedQuestions;
    } catch (error: any) {
      log.error('Failed to parse questions from response', error);
      throw new MkquizError(
        `Failed to parse questions from response: ${error.message}`
      );
    }
  }

  /**
   * Save questions to a JSON file
   */
  async saveQuestionsToFile(
    questions: QuizQuestion[],
    outputPath: string
  ): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });

      // Write questions to file
      await fs.writeFile(
        outputPath,
        JSON.stringify(questions, null, 2),
        'utf-8'
      );

      log.info(`Saved ${questions.length} questions to ${outputPath}`);
    } catch (error: any) {
      log.error('Failed to save questions to file', error);
      throw new MkquizError(
        `Failed to save questions to file: ${error.message}`
      );
    }
  }
}

/**
 * Create a new Gemini OCR service instance
 */
export function createGeminiOcrService(apiKey: string): GeminiOcrService {
  return new GeminiOcrService(apiKey);
}
