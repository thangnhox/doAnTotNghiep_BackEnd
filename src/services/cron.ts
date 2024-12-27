import cron from 'node-cron';
import MembershipController from '../controllers/MembershipController';
import DiscountController from '../controllers/DiscountController';
import Logger from '../util/logger';


export function initCron(): void {
    const logger = Logger.getInstance();

    cron.schedule('0 0 * * *', async () => {
        logger.info("Start daily jobs");
        await Promise.all([
            MembershipController.autoRenewMembership(),
            DiscountController.dailyExpireCheck(),
        ])
        logger.info("Daily jobs completed");
    })
    
}