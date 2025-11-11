import fs from 'fs';
import path from 'path';
import { ValidationError, JsonError } from './errors';
import { QuestionJSON } from '../types';


export function validatePathExists(filePath: string, errorMessage?: string): boolean {
    if (!fs.existsSync(filePath)) {
        throw new ValidationError(
            errorMessage || `Path does not exist: ${filePath}`,
            'path'
        );
    }
    return true;
}

export function validateFileExtension(
    filePath: string,
    expectedExtension: string,
    errorMessage?: string
): boolean {
    const ext = path.extname(filePath);
    if (ext !== expectedExtension) {
        throw new ValidationError(
            errorMessage || `Expected ${expectedExtension} file but got ${ext}`,
            'fileExtension'
        );
    }
    return true;
}

export function validateNotEmpty(value: string, fieldName: string): boolean {
    if (!value || value.trim() === '') {
        throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
    }
    return true;
}


export function validateJsonFile(filePath: string): unknown {
    try {
        validatePathExists(filePath);
        validateFileExtension(filePath, '.json');
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new JsonError(
            `Invalid JSON file: ${(error as Error).message}`,
            filePath
        );
    }
}


export function validateQuestionStructure(
    question: unknown,
    index: number
): question is QuestionJSON {
    if (typeof question !== 'object' || question === null) {
        throw new ValidationError(
            `Question at index ${index} is not a valid object`,
            'question'
        );
    }

    const q = question as Partial<QuestionJSON>;

    if (typeof q.id !== 'number') {
        throw new ValidationError(
            `Question at index ${index} is missing or has invalid 'id' property`,
            'question.id'
        );
    }

    if (!q.question || typeof q.question !== 'string') {
        throw new ValidationError(
            `Question at index ${index} is missing or has invalid 'question' property`,
            'question.question'
        );
    }

    if (!q.options || typeof q.options !== 'object') {
        throw new ValidationError(
            `Question at index ${index} is missing or has invalid 'options' property`,
            'question.options'
        );
    }

    const optionsKeys = Object.keys(q.options);
    if (optionsKeys.length === 0) {
        throw new ValidationError(
            `Question at index ${index} has empty options`,
            'question.options'
        );
    }

    const isTrueFalse =
        optionsKeys.length === 2 &&
        optionsKeys.includes('a') &&
        optionsKeys.includes('b') &&
        q.options['a'] === 'True' &&
        q.options['b'] === 'False';

    if (!isTrueFalse && optionsKeys.length < 2) {
        throw new ValidationError(
            `Question at index ${index} must have at least 2 options`,
            'question.options'
        );
    }

    const allStrings = optionsKeys.every(
        (key) => typeof q.options![key] === 'string'
    );
    if (!allStrings) {
        throw new ValidationError(
            `Question at index ${index} has invalid option values`,
            'question.options'
        );
    }

    if (!q.answer || typeof q.answer !== 'string') {
        throw new ValidationError(
            `Question at index ${index} is missing or has invalid 'answer' property`,
            'question.answer'
        );
    }

    return true;
}

export function validateQuizQuestions(questions: unknown): questions is QuestionJSON[] {
    if (!Array.isArray(questions)) {
        throw new ValidationError('Quiz JSON must contain an array of questions', 'questions');
    }

    questions.forEach((question, index) => {
        validateQuestionStructure(question, index);
    });

    return true;
}


export function validateQuizJsonFile(filePath: string): QuestionJSON[] {
    const content = validateJsonFile(filePath);
    validateQuizQuestions(content);
    return content as QuestionJSON[];
}


export function isString(value: unknown): value is string {
    return typeof value === 'string';
}


export function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}

export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
