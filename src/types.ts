import ora from 'ora';

/**
 * Configuration structure for mkquiz CLI
 */
export interface Config {
    projectPath: string;
    templateFile: string;
    allQuizzezJsonPath: string;
}

/**
 * Structure of a quiz question in JSON format
 */
export interface QuestionJSON {
    id: number;
    question: string;
    options: Record<string, string>;
    answer: string;
    [key: string]: unknown;
}

/**
 * Year options for quizzes
 */
export type YearOption = '1st' | '2nd' | '3rd' | '4th';

/**
 * Quiz type options
 */
export type QuizTypeOption = 'Midterm' | 'Final';

/**
 * Question type options
 */
export type QuestionTypeOption = 'MCQ' | 'TF' | 'QB';

/**
 * Structure representing quiz metadata
 */
export interface QuizData {
    type: QuestionTypeOption;
    path: string | null;
    published: boolean;
    JSON: string | null;
}

/**
 * Year record structure in AllQuizzes
 */
export interface YearRecord {
    [quizName: string]: {
        [quizFor: string]: QuizData[];
    };
}

/**
 * Structure of the all quizzes JSON file
 */
export type AllQuizzes = Array<{
    Year: Record<string, YearRecord>;
}>;

/**
 * Ora spinner type
 */
export type OraSpinner = ReturnType<typeof ora>;

/**
 * Variables used in template processing
 */
export interface TemplateVars {
    quizName: string;
    quizFor: string;
    questionsCount: number;
    duration: number;
    jsonPath: string | null;
}

/**
 * Answer type for add quiz prompt
 */
export interface AddQuizAnswers {
    quizName: string;
    quizFor: QuizTypeOption;
    questionType: QuestionTypeOption;
    year: YearOption;
    jsonPath: string;
    published: boolean;
}

/**
 * Answer type for config prompt
 */
export interface ConfigAnswers {
    projectPath: string;
    allQuizzezJsonPath: string;
    templateFile: string;
}

/**
 * Selected quiz value for removal
 */
export interface SelectedQuizValue {
    subject: string;
    examType: string;
    quizType: string;
    path: string | null;
    JSON: string | null;
}
