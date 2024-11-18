import { User } from '../models/entities/User';
import { AppDataSource } from '../models/repository/Datasource';
import { MembershipRecord } from '../models/entities/MembershipRecord';

class MembershipController {
    async isValidUser(user: User): Promise<boolean> {
        try {
            const membershipRepository = (await AppDataSource.getInstace()).getRepository(MembershipRecord);
            const existRecord = await membershipRepository.findOne({ where: { userId: user.id } });
            if (existRecord) return true;
        } catch (error) {
            console.error(`Error validating: ${error}`);
        }

        return false;
    }
}

export default new MembershipController;