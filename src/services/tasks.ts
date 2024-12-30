import Logger from "../util/logger";

export enum TimeDelay {
    FIVE_MINUTES = 5 * 60 * 1000, // 5 minutes in milliseconds
    THIRTY_MINUTES = 30 * 60 * 1000, // 30 minutes in milliseconds
    ONE_HOUR = 60 * 60 * 1000, // 1 hour in milliseconds
    TWO_HOURS = 2 * 60 * 60 * 1000, // 2 hours in milliseconds
}

// delay set in miliseconds, use TimeDelay to set if you don't know how long it should be
export function scheduleTaskJob<T extends any[]>(delay: number, job: (...args: T) => Promise<void>, ...args: T) {
    const logger = Logger.getInstance();

    setTimeout(async () => {
        try {
            logger.info(`Starting task ${job.name} with arguments: ${JSON.stringify(args)}`);
            await job(...args);
            logger.info(`Job ${job.name} completed successfully!`);
        } catch (error) {
            logger.error(`Error running the job ${job.name}:`, error);
        }
    }, delay);
}
