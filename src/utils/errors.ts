/**
 * Base error class for mkquiz CLI
 */
export class MkquizError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error thrown when configuration is missing or invalid
 */
export class ConfigError extends MkquizError {
    constructor(message: string = 'Configuration error occurred') {
        super(message);
    }
}

/**
 * Error thrown when file system operations fail
 */
export class FileSystemError extends MkquizError {
    constructor(message: string, public readonly path?: string) {
        super(message);
    }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends MkquizError {
    constructor(message: string, public readonly field?: string) {
        super(message);
    }
}

/**
 * Error thrown when JSON parsing or manipulation fails
 */
export class JsonError extends MkquizError {
    constructor(message: string, public readonly jsonPath?: string) {
        super(message);
    }
}

/**
 * Error thrown when template processing fails
 */
export class TemplateError extends MkquizError {
    constructor(message: string, public readonly templatePath?: string) {
        super(message);
    }
}

/**
 * Error thrown when a quiz operation fails
 */
export class QuizOperationError extends MkquizError {
    constructor(message: string, public readonly quizName?: string) {
        super(message);
    }
}
