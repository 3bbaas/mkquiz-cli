import fs from 'fs';
import { AllQuizzes, QuizData } from '../types';
import { JsonError } from './errors';
import { validateJsonFile } from './validation';
import log from './logger';


export function loadJsonFile<T>(filePath: string): T {
    try {
        const content = validateJsonFile(filePath);
        return content as T;
    } catch (error) {
        log.error('Failed to load JSON file', error, { path: filePath });
        throw new JsonError(
            `Failed to load JSON file: ${(error as Error).message}`,
            filePath
        );
    }
}


export function saveJsonFile(filePath: string, data: unknown): void {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
        log.debug('JSON file saved', { path: filePath });
    } catch (error) {
        log.error('Failed to save JSON file', error, { path: filePath });
        throw new JsonError(
            `Failed to save JSON file: ${(error as Error).message}`,
            filePath
        );
    }
}


export function loadAllQuizzes(filePath: string): AllQuizzes {
    const data = loadJsonFile<AllQuizzes>(filePath);
    
    if (!Array.isArray(data) || data.length === 0) {
        throw new JsonError('All quizzes JSON must be a non-empty array', filePath);
    }
    
    return data;
}


export function saveAllQuizzes(filePath: string, data: AllQuizzes): void {
    saveJsonFile(filePath, data);
}


export function ensureQuizStructure(
    allQuizzes: AllQuizzes,
    year: string,
    quizName: string,
    quizFor: string
): void {
    const root = allQuizzes[0];
    
    if (!root.Year[year]) {
        root.Year[year] = {};
        log.debug('Created year structure', { year });
    }
    
    if (!root.Year[year][quizName]) {
        root.Year[year][quizName] = {};
        log.debug('Created quiz name structure', { year, quizName });
    }
    
    if (!root.Year[year][quizName][quizFor]) {
        root.Year[year][quizName][quizFor] = [];
        log.debug('Created quiz type structure', { year, quizName, quizFor });
    }
}


export function addQuizToStructure(
    allQuizzes: AllQuizzes,
    year: string,
    quizName: string,
    quizFor: string,
    quizData: QuizData
): void {
    ensureQuizStructure(allQuizzes, year, quizName, quizFor);
    const root = allQuizzes[0];
    root.Year[year][quizName][quizFor].push(quizData);
    log.info('Quiz added to structure', { year, quizName, quizFor, type: quizData.type });
}

export function removeQuizFromStructure(
    allQuizzes: AllQuizzes,
    year: string,
    quizName: string,
    quizFor: string,
    quizType: string
): boolean {
    const root = allQuizzes[0];
    const yearQuizzes = root.Year[year]?.[quizName]?.[quizFor];
    
    if (!yearQuizzes) {
        log.warn('Quiz not found in structure', { year, quizName, quizFor, quizType });
        return false;
    }
    
    const quizIndex = yearQuizzes.findIndex((q: QuizData) => q.type === quizType);
    if (quizIndex === -1) {
        log.warn('Quiz type not found', { year, quizName, quizFor, quizType });
        return false;
    }
    
    yearQuizzes.splice(quizIndex, 1);
    log.info('Quiz removed from structure', { year, quizName, quizFor, quizType });
    
    if (yearQuizzes.length === 0) {
        delete root.Year[year][quizName][quizFor];
        log.debug('Removed empty quiz type structure', { year, quizName, quizFor });
    }
    
    if (Object.keys(root.Year[year][quizName] ?? {}).length === 0) {
        delete root.Year[year][quizName];
        log.debug('Removed empty quiz name structure', { year, quizName });
    }
    
    return true;
}


export function getQuizzesForYear(
    allQuizzes: AllQuizzes,
    year: string
): Record<string, Record<string, QuizData[]>> | null {
    const root = allQuizzes[0];
    return root.Year[year] || null;
}


export function countQuizzesByName(quizzes: string[], name: string): number {
    return quizzes.reduce((count, x) => (x === name ? count + 1 : count), 0);
}


export function getExistingQuizzes(
    allQuizzes: AllQuizzes,
    year: string,
    quizName: string,
    quizFor: string
): string[] {
    const root = allQuizzes[0];
    const quizArray = root.Year?.[year]?.[quizName]?.[quizFor];
    
    if (!quizArray) {
        return [];
    }
    
    return quizArray.map((q: QuizData) => `${quizName} ${q.type}`);
}
