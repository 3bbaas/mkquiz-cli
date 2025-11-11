import path from 'path';


export function normalizeQuizPath(fullPath: string): string | null {
    const normalized = fullPath.replace(/\\/g, '/');
    const match = normalized.match(/\/quizzes\/.*$/);
    return match ? match[0] : null;
}

export function sanitizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '_');
}

export function sanitizeNameStrict(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
}


export function forwardSlashes(inputPath: string): string {
    return inputPath.replace(/\\/g, '/');
}


export function ensureLeadingSlash(inputPath: string): string {
    return inputPath.startsWith('/') ? inputPath : '/' + inputPath;
}


export function normalizePath(inputPath: string): string {
    return ensureLeadingSlash(forwardSlashes(inputPath));
}


export function buildQuizFolderPath(
    projectPath: string,
    year: string,
    quizFor: string,
    quizName: string
): string {
    const sanitized = sanitizeName(quizName);
    return path.join(projectPath, 'quizzes', year, quizFor.toLowerCase(), sanitized);
}


export function buildJsonPath(quizFolderPath: string, quizName: string): string {
    const sanitized = sanitizeNameStrict(quizName);
    return path.join(quizFolderPath, `${sanitized}.json`);
}
