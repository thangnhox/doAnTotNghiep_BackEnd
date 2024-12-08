import cron from 'node-cron';
import MembershipController from '../controllers/MembershipController';


export function initCron(): void {

    cron.schedule('0 0 * * *', async () => {
        console.log("Start daily auto renew membership:", (new Date()).toISOString().split('T')[0]);
        await MembershipController.autoRenewMembership();
        console.log("Daily auto renew membership done");
    })
    
}