import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}


const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);


const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Console output
        new winston.transports.Console({
            format: consoleFormat,
        }),
    ],
});


export const log = {

    info: (message: string, meta?: Record<string, unknown>) => {
        logger.info(message, meta);
    },


    warn: (message: string, meta?: Record<string, unknown>) => {
        logger.warn(message, meta);
    },


    error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
        if (error instanceof Error) {
            logger.error(message, { error: error.message, stack: error.stack, ...meta });
        } else {
            logger.error(message, { error: String(error), ...meta });
        }
    },


    debug: (message: string, meta?: Record<string, unknown>) => {
        logger.debug(message, meta);
    },


    success: (message: string, meta?: Record<string, unknown>) => {
        logger.info(`✓ ${message}`, meta);
    },
};

export default log;
