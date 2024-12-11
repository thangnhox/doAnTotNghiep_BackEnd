import * as fs from 'fs';

// Log Levels
enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

class Logger {
    private static instance: Logger;
    private logFilePath!: string;

    private constructor() { }

    public static init(logFileName: string = "Server.log"): void {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        Logger.instance.logFilePath = logFileName;
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            throw new Error("Logger not initialized. Call init() first.");
        }
        return Logger.instance;
    }

    private writeLog(level: LogLevel, message: string): void {
        const timestamp = new Date().toLocaleString('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const logMessage = `[${timestamp}] [${level}] ${message}\n`;

        fs.appendFile(this.logFilePath, logMessage, (err) => {
            if (err) {
                console.error(`Failed to write log: ${err.message}`);
            }
        });
    }


    public info(...args: any[]): void {
        this.writeLog(LogLevel.INFO, args.join(' '));
    }

    public warn(...args: any[]): void {
        this.writeLog(LogLevel.WARN, args.join(' '));
    }

    public error(...args: any[]): void {
        this.writeLog(LogLevel.ERROR, args.join(' '));
    }
}

export default Logger;
