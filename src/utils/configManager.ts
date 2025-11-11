import fs from 'fs';
import path from 'path';
import { Config } from '../types';
import { ConfigError, FileSystemError } from './errors';
import { validatePathExists, validateFileExtension, isObject } from './validation';
import log from './logger';

const CONFIG_FILENAME = '.mkquizrc';

/**
 * Gets the path to the configuration file
 */
export function getConfigPath(): string {
    return path.join(process.cwd(), CONFIG_FILENAME);
}

/**
 * Checks if configuration file exists
 */
export function configExists(): boolean {
    return fs.existsSync(getConfigPath());
}

/**
 * Validates the structure of a config object
 */
export function validateConfig(config: unknown): config is Config {
    if (!isObject(config)) {
        throw new ConfigError('Configuration must be an object');
    }

    const c = config as Partial<Config>;

    if (!c.projectPath || typeof c.projectPath !== 'string') {
        throw new ConfigError('Configuration missing or invalid projectPath');
    }

    if (!c.templateFile || typeof c.templateFile !== 'string') {
        throw new ConfigError('Configuration missing or invalid templateFile');
    }

    if (!c.allQuizzezJsonPath || typeof c.allQuizzezJsonPath !== 'string') {
        throw new ConfigError('Configuration missing or invalid allQuizzezJsonPath');
    }

    return true;
}

/**
 * Loads and validates the configuration file
 */
export function loadConfig(): Config {
    const configPath = getConfigPath();

    if (!configExists()) {
        log.error('Configuration file not found', undefined, { path: configPath });
        throw new ConfigError(
            `Configuration not found at ${configPath}. Run 'mkquiz config' first.`
        );
    }

    try {
        const configRaw = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configRaw);
        
        validateConfig(config);
        
        log.debug('Configuration loaded successfully', { config });
        return config as Config;
    } catch (error) {
        if (error instanceof ConfigError) {
            throw error;
        }
        log.error('Failed to load configuration', error);
        throw new ConfigError(
            `Invalid configuration file: ${(error as Error).message}`
        );
    }
}

/**
 * Saves configuration to file
 */
export function saveConfig(config: Config): void {
    try {
        validateConfig(config);
        const configPath = getConfigPath();
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        log.success('Configuration saved', { path: configPath });
    } catch (error) {
        log.error('Failed to save configuration', error);
        throw new FileSystemError(
            `Failed to save configuration: ${(error as Error).message}`,
            getConfigPath()
        );
    }
}

/**
 * Validates configuration paths exist
 */
export function validateConfigPaths(config: Config): void {
    try {
        validatePathExists(config.projectPath, 'Project path does not exist');
    } catch (error) {
        throw new ConfigError(`Project path does not exist: ${config.projectPath}`);
    }

    try {
        validatePathExists(config.templateFile, 'Template file does not exist');
        validateFileExtension(config.templateFile, '.html');
    } catch (error) {
        throw new ConfigError(`Template file invalid or does not exist: ${config.templateFile}`);
    }

    try {
        validatePathExists(config.allQuizzezJsonPath, 'All quizzes JSON path does not exist');
        validateFileExtension(config.allQuizzezJsonPath, '.json');
    } catch (error) {
        throw new ConfigError(
            `All quizzes JSON file invalid or does not exist: ${config.allQuizzezJsonPath}`
        );
    }

    log.debug('Configuration paths validated successfully');
}

/**
 * Loads and validates configuration with path checks
 */
export function loadAndValidateConfig(): Config {
    const config = loadConfig();
    validateConfigPaths(config);
    return config;
}
