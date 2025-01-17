import { Request, Response } from 'express';
import { User } from '../models/entities/User';
import { AppDataSource } from '../models/repository/Datasource';
import { MembershipRecord } from '../models/entities/MembershipRecord';
import { checkReqUser, getDateFromToday, getDateNDaysAhead, getValidatedPageInfo, isValidUrl, sortValidator } from '../util/checker';
import { Membership } from '../models/entities/Membership';
import { Subscribe } from '../models/entities/Subscribe';
import { v4 as uuidv4 } from 'uuid';
import { Discount } from '../models/entities/Discount';
import { decrypt, Frequency_Number, Frequency_String, rsaEncrypt, verifySinglePaySignature, verifySubscriptionSignature } from '../util/momo';
import { getSubscriptionToken, singlePayAPI, manageSubscription, membershipPayment, initSubscriptionAPI } from '../services/momo';
import { sendMail } from '../services/email';
import Logger from '../util/logger';
import { scheduleTaskJob, TimeDelay } from '../services/tasks';

class MembershipController {
    async isValidUser(user: User): Promise<Membership | null> {
        try {
            const membershipRepository = (await AppDataSource.getInstance()).getRepository(MembershipRecord);
            const existRecord = await membershipRepository.findOne({ where: { userId: user.id }, relations: ['membership'] });
            if (existRecord) return existRecord.membership;
        } catch (error) {
            console.error(`Error validating: ${error}`);
            return null;
        }

        return null;
    }

    async checkMembership(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Failed to validate authenticated user" });
                return;
            }

            const membershipRecordRepository = (await AppDataSource.getInstance()).getRepository(MembershipRecord);
            const membershipData = await membershipRecordRepository.findOne({ where: { userId: req.user.id }, relations: ['membership'] });

            if (!membershipData) {
                res.status(200).json({ message: `${req.user.name} don't have membership`, data: null });
                return;
            }

            res.status(200).json({ message: `${req.user.name} is membership`, data: membershipData });

        } catch (error: any) {
            res.status(500).json({ message: "Failed to fetch subcribe data." });
        }
    }

    // Insert new membership
    async insertMembership(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { name, rank, price, allowNew } = req.body;

        try {
            const membershipRepository = (await AppDataSource.getInstance()).getRepository(Membership);

            // Check if a membership with the same name exists
            const existingMembership = await membershipRepository.findOne({ where: { name } });
            if (existingMembership) {
                res.status(409).json({ message: 'Membership name already exists', data: existingMembership });
                return;
            }

            const newMembership = membershipRepository.create({ name, rank, price, allowNew });
            const insertedMembership = await membershipRepository.save(newMembership);

            res.status(201).json({ message: "Insert success", data: insertedMembership });
        } catch (error) {
            console.error('Error inserting membership:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Edit an existing membership
    async editMembership(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { id } = req.params;
        const { rank, price, allowNew } = req.body;

        try {
            const membershipRepository = (await AppDataSource.getInstance()).getRepository(Membership);
            const membership = await membershipRepository.findOne({ where: { id: Number(id) } });

            if (!membership) {
                res.status(404).json({ message: 'Membership not found' });
                return;
            }

            membership.rank = rank !== undefined ? rank : membership.rank;
            membership.price = price !== undefined ? price : membership.price;
            membership.allowNew = allowNew != undefined ? allowNew : membership.allowNew;

            const updatedMembership = await membershipRepository.save(membership);
            res.status(200).json({ message: "Update success", data: updatedMembership });
        } catch (error) {
            console.error('Error editing membership:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Hide a membership (soft delete)
    async hideMembership(req: Request, res: Response): Promise<void> {
        if (!checkReqUser(req, res)) return;

        const { id } = req.params;

        try {
            const membershipRepository = (await AppDataSource.getInstance()).getRepository(Membership);
            const membership = await membershipRepository.findOne({ where: { id: Number(id) } });

            if (!membership) {
                res.status(404).json({ message: 'Membership not found' });
                return;
            }

            membership.allowNew = 0; // Assuming 0 means hidden/inactive
            await membershipRepository.save(membership);

            res.status(200).json({ message: 'Membership hidden successfully' });
        } catch (error) {
            console.error('Error hiding membership:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async all(req: Request, res: Response): Promise<void> {
        try {
            const membershipRepository = (await AppDataSource.getInstance()).getRepository(Membership);
            const { page, pageSize, offset } = getValidatedPageInfo(req.query);
            const { sort, order, warnings } = sortValidator(req.query.sort as string, req.query.order as string, Membership);

            const [memberships, total] = await membershipRepository.findAndCount({
                take: pageSize,
                skip: offset,
                order: {
                    [sort]: order.toUpperCase() as 'ASC' | 'DESC'
                }
            });

            const formattedMemberships = memberships.map(membership => ({
                id: membership.id,
                name: membership.name,
                rank: membership.rank,
                allowNew: membership.allowNew,
                price: membership.price,
                description: membership.Description(),
            }));

            res.status(200).json({
                message: "fetch success",
                data: formattedMemberships,
                total,
                page,
                pageSize,
                warnings
            });
        } catch (error) {
            console.error('Error getting membership list:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async fetch(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const membershipRepository = (await AppDataSource.getInstance()).getRepository(Membership);

            const membership = await membershipRepository.findOne({ where: { id: Number(id) } });

            if (!membership) {
                res.status(404).json({ message: 'Membership not found' });
                return;
            }

            res.status(200).json({
                message: "Success",
                data: membership,
            });
        } catch (error) {
            console.error('Error getting membership info:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async initSubscription(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Failed to get authentication info" });
            return;
        }

        const warning: string[] = [];
        let discountStatus: number = -1;
        let discount: Discount | null = null;
        let curUser: User | null = null;

        try {
            const { membershipId, discountId } = req.body;

            if (!membershipId) {
                res.status(400).json({ message: "Invalid request" });
                return;
            }

            const membershipRecordRepository = (await AppDataSource.getInstance()).getRepository(MembershipRecord);
            const membershipRepository = (await AppDataSource.getInstance()).getRepository(Membership);
            const userRepository = (await AppDataSource.getInstance()).getRepository(User);
            const discountRepository = (await AppDataSource.getInstance()).getRepository(Discount);
            const subscribeRepository = (await AppDataSource.getInstance()).getRepository(Subscribe);

            const [isMembership, existsMembership] = await Promise.all([
                membershipRecordRepository.findOne({ where: { userId: req.user.id } }),
                membershipRepository.findOne({ where: { id: membershipId } })
            ]);

            if (isMembership) {
                res.status(409).json({ message: "User is already subscribed" });
                return;
            }

            if (!existsMembership) {
                res.status(404).json({ message: "Membership ID not found" });
                return;
            }

            if ((existsMembership.allowNew & Membership.NEW) === 0) {
                res.status(403).json({ message: "Requested subscription is no longer allow new subscribe" });
                return;
            }

            const subscribe = new Subscribe();
            subscribe.id = uuidv4();
            subscribe.userId = req.user.id;
            subscribe.membershipId = existsMembership.id;

            if (discountId) {
                const [foundDiscount, user] = await Promise.all([
                    discountRepository.findOne({ where: { id: discountId } }),
                    userRepository.findOne({ where: { id: req.user.id }, relations: ['discounts'] })
                ]);

                if (!foundDiscount) {
                    warning.push(`Discount ${discountId} not found`);
                } else {
                    if (!user) {
                        res.status(500).json({ message: "Error when applying discount" });
                        return;
                    }

                    const discountUsed = user.discounts.some(d => d.id === foundDiscount.id);

                    if (discountUsed) {
                        warning.push(`${user.name} already used ${foundDiscount.name}`);
                        subscribe.totalPrice = existsMembership.price;
                    } else if (foundDiscount.status === 0) {
                        warning.push(`${foundDiscount.name} is no longer usable`);
                        subscribe.totalPrice = existsMembership.price;
                    } else {
                        curUser = user;
                        discount = foundDiscount;
                        subscribe.discountId = foundDiscount.id;
                        discountStatus = foundDiscount.id;
                        subscribe.totalPrice = existsMembership.price - (existsMembership.price * foundDiscount.ratio);
                    }
                }
            } else {
                subscribe.totalPrice = existsMembership.price;
            }

            subscribe.date = (new Date()).toISOString().split('T')[0];

            const initMomoPayment = await initSubscriptionAPI({
                partnerCode: process.env.MOMO_PARTNER_CODE as string,
                requestId: subscribe.id,
                amount: subscribe.totalPrice,
                orderId: subscribe.id,
                orderInfo: `${existsMembership}`,
                redirectUrl: `${process.env.FRONT_END_ADDR}${process.env.FRONE_END_REDIRECT_PATH}`,
                ipnUrl: `${process.env.BACK_END_ADDR}/membership/confSubscription`,
                partnerClientId: `${req.user.id}`,
                extraData: "",
                requestType: "subscription",
                subscriptionInfo: {
                    name: existsMembership.name,
                    expiryDate: getDateFromToday(Frequency_Number.MONTHLY),
                    frequency: Frequency_String.MONTHLY,
                    nextPaymentDate: getDateFromToday(Frequency_Number.MONTHLY),
                    partnerSubsId: `${existsMembership.id}`,
                    type: "VARIABLE",
                    recurringAmount: existsMembership.price * 2,
                    subsOwner: req.user.name
                },
                lang: "vi"
            });

            let payUrl = null, deeplink = null, qrCodeUrl = null;

            if (!initMomoPayment) {
                res.status(400).json({ message: "Failed to create payment" });
                return;
            }

            const toDatabase = subscribeRepository.create(subscribe);
            await subscribeRepository.save(toDatabase);

            if (curUser && discount) {
                curUser.discounts.push(discount);

                await userRepository.save(curUser);
            }

            payUrl = initMomoPayment.payUrl;
            deeplink = initMomoPayment.deeplink;
            qrCodeUrl = initMomoPayment.qrCodeUrl;

            res.status(200).json({
                message: "Init subscription success",
                data: {
                    ID: subscribe.id,
                    MembershipInfo: {
                        ID: existsMembership.id,
                        Name: existsMembership.name,
                        Describe: existsMembership.Description(),
                        Price: existsMembership.price,
                    },
                    DiscountApplied: discountStatus,
                    TotalPrice: subscribe.totalPrice,
                    PayUrl: payUrl,
                    DeepLink: deeplink,
                    QrCodeUrl: qrCodeUrl,
                },
                warning
            });

        } catch (error) {
            console.error("Error while init subscription:", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async paymentConfirm(req: Request, res: Response): Promise<void> {
        try {
            if (!verifySubscriptionSignature(req.body)) {
                res.status(400).json({ message: "Invalid request" });
                return;
            }

            res.status(204).send();

            const { partnerCode, callbackToken, requestId, orderId, partnerClientId, transId } = req.body;
            const lang: string = "vi";

            const subscribeRepository = (await AppDataSource.getInstance()).getRepository(Subscribe);
            const subscribe = await subscribeRepository.findOne({ where: { id: orderId }, relations: ['user'] });

            if (!subscribe) {
                console.error("Unexpected deletion of subscription", orderId);
                return;
            }

            subscribe.transId = transId;
            await subscribeRepository.save(subscribe);


            const membershipRecordRepository = (await AppDataSource.getInstance()).getRepository(MembershipRecord);

            if (!subscribe.membershipId) {
                console.error("This subscribe is not membership");
                return;
            }

            const newRecord = new MembershipRecord();
            newRecord.userId = subscribe.userId;
            newRecord.membershipId = subscribe.membershipId;

            const formattedDate = getDateFromToday(30);
            newRecord.expireDate = formattedDate;
            const getTokenAPIResult = await getSubscriptionToken({ partnerCode, callbackToken, requestId, orderId, partnerClientId, lang });

            if (!getTokenAPIResult) {
                console.error("Failed to get Token");
            } else {
                newRecord.token = getTokenAPIResult.aesToken;
                newRecord.partnerClientId = getTokenAPIResult.partnerClientId;
            }

            membershipRecordRepository.save(newRecord);
            await sendMail(subscribe.user.email, "Membership registing successful", "Payment notification");
        } catch (error) {
            console.error("Error while confirming subcription payment:", error);
            res.status(204).send();
        }
    }

    async autoRenewMembership(): Promise<void> {
        const logger = Logger.getInstance();

        logger.info("Start daily auto renew membership:", (new Date()).toISOString().split('T')[0]);

        const membershipRecordRepository = (await AppDataSource.getInstance()).getRepository(MembershipRecord);
        const membershipRepository = (await AppDataSource.getInstance()).getRepository(Membership);
        const subscribeRepository = (await AppDataSource.getInstance()).getRepository(Subscribe);

        const toDay = (new Date()).toISOString().split('T')[0];
        const partnerCode = process.env.MOMO_PARTNER_CODE as string;

        const checkRecords = await membershipRecordRepository.find({ where: { expireDate: toDay }, relations: ['user'] });

        for (const record of checkRecords) {
            try {
                logger.info(`Start auto renew check for [${record.user.id}]: [${record.user.name}]`);
                if (!record.token || !record.partnerClientId) {
                    logger.warn(`[${record.user.id}]: [${record.user.name}] auto renew has been turned of`);
                    Promise.all([
                        membershipRecordRepository.remove(record),
                        await sendMail(record.user.email, "Your subscription expired", "Payment notification")
                    ])
                    continue;
                }

                const membership = await membershipRepository.findOne({ where: { id: record.membershipId } });

                if (!membership) {
                    logger.error("Failed to get membership info, membership no longer exists in database");
                    continue;
                }

                if ((membership.allowNew & Membership.RENEW) === 0) {
                    logger.warn("Membership no longer allow renew, remove membership record");
                    Promise.all([
                        membershipRecordRepository.remove(record),
                        sendMail(record.user.email, "Your subscription expired", "Payment notification")
                    ]);
                    continue;
                }

                const { value, initialOrderId } = decrypt(record.token);
                const newSubscription = new Subscribe();
                newSubscription.id = uuidv4();
                newSubscription.userId = record.userId;
                newSubscription.membershipId = record.membershipId;
                newSubscription.totalPrice = membership.price;
                newSubscription.date = toDay;

                const formattedDate = getDateFromToday(30);

                const paymentResponse = await membershipPayment({
                    amount: membership.price,
                    extraData: "",
                    lang: "vi",
                    orderId: newSubscription.id,
                    orderInfo: JSON.stringify(membership),
                    partnerClientId: record.partnerClientId,
                    partnerCode: partnerCode,
                    requestId: newSubscription.id,
                    token: rsaEncrypt({ value, initialOrderId }),
                    nextPaymentDate: formattedDate
                });

                if (!paymentResponse) {
                    logger.error("Failed to request payment, extend expire date to next day");
                    record.expireDate = getDateFromToday(1);
                    await membershipRecordRepository.save(record);
                } else {
                    logger.info("Transaction result:", paymentResponse);

                    if (paymentResponse.resultCode === 0) {
                        logger.info("Transaction success");

                        record.expireDate = formattedDate;
                        await membershipRecordRepository.save(record);

                        newSubscription.transId = paymentResponse.transId;
                        await Promise.all([
                            await sendMail(record.user.email, "Your subscription has been renewed", "Payment notification"),
                            subscribeRepository.save(newSubscription)
                        ]);
                    } else {
                        logger.warn("Transaction failed:", paymentResponse.message);

                        await Promise.all([
                            await sendMail(record.user.email, "Auto renew subscription failed, please renew your subscription manually", "Payment notification"),
                            membershipRecordRepository.remove(record)
                        ]);
                    }

                }

                logger.info("Daily auto renew membership done");
            } catch (error) {
                console.error("Error while renew membership", error);
                continue;
            }
        }
    }

    async cancelMembership(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Failed to get authentication info" });
            return;
        }

        try {
            const membershipRecordRepository = (await AppDataSource.getInstance()).getRepository(MembershipRecord);
            const membership = await membershipRecordRepository.findOne({ where: { userId: req.user.id } });

            if (!membership) {
                res.status(400).json({ message: "User is not a membership" });
                return;
            }

            if (!membership.token || !membership.partnerClientId) {
                res.status(200).json({ message: "User already canceled membership" });
                return;
            }

            const partnerCode = process.env.MOMO_PARTNER_CODE as string;
            const { value, initialOrderId } = decrypt(membership.token);
            const cancelPayment = await manageSubscription({
                orderId: uuidv4(),
                lang: "vi",
                partnerClientId: membership.partnerClientId,
                partnerCode: partnerCode,
                token: rsaEncrypt({ value, initialOrderId }),
                requestId: uuidv4(),
                action: "cancel"
            });

            console.log("Cancel payment of membership:", initialOrderId);
            console.log("Cancel result:", cancelPayment);

            membership.token = null;
            await membershipRecordRepository.save(membership);
            res.status(200).json({ message: "Cancel success" });

        } catch (error) {
            console.error("Error while cancling membership", error);
            res.status(500).json({ message: "Server error" });
        }

    }

    async create(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            res.status(500).json({ message: "Authentication error" });
            return;
        }

        try {
            const { membershipId, discountName } = req.body;

            if (!membershipId) {
                res.status(400).json({ message: "Invalid request" });
                return;
            }

            const dataSource = await AppDataSource.getInstance();
            const discountRepository = dataSource.getRepository(Discount);
            const userRepository = dataSource.getRepository(User);
            const membershipRecordRepository = dataSource.getRepository(MembershipRecord);
            const membershipRepository = dataSource.getRepository(Membership);
            const subscribeRepository = dataSource.getRepository(Subscribe);

            const alreadyMembership = await membershipRecordRepository.findOne({ where: { userId: req.user.id }, relations: ['membership'] });

            const foundMembership = await membershipRepository.findOne({ where: { id: membershipId } });

            if (!foundMembership) {
                res.status(404).json({ message: "Membership not found" });
                return;
            }

            const newSubscription = new Subscribe();
            newSubscription.id = uuidv4();
            newSubscription.userId = req.user.id;
            newSubscription.date = (new Date).toISOString().split('T')[0];

            if (alreadyMembership) {
                if (alreadyMembership.membershipId === membershipId) {
                    if ((foundMembership.allowNew & Membership.RENEW) === 0) {
                        res.status(403).json({ message: "Requested subscription is no longer allowed to extend" });
                        return;
                    }

                    newSubscription.membershipId = membershipId;
                    newSubscription.totalPrice = foundMembership.price;
                } else {
                    const priceDifference = foundMembership.price - alreadyMembership.membership.price;

                    if (priceDifference <= 0) {
                        alreadyMembership.membershipId = foundMembership.id;
                        await membershipRecordRepository.save(alreadyMembership);
                        res.status(200).json({ message: "Change membership success, no additional charge" });
                        await sendMail(req.user.email, "Your membership has changed", "Membership change notification");
                        return;
                    }

                    newSubscription.membershipId = foundMembership.id;
                    newSubscription.totalPrice = priceDifference;
                }
            } else {
                if ((foundMembership.allowNew & Membership.NEW) === 0) {
                    res.status(403).json({ message: "Requested subscription is no longer allow new subscribe" });
                    return;
                }

                newSubscription.membershipId = foundMembership.id;
                newSubscription.totalPrice = foundMembership.price;
            }


            const warning: string[] = [];
            let discount: Discount | null = null;
            let curUser: User | null = null;
            let discountStatus: number = -1;

            if (discountName) {
                const foundDiscount = await discountRepository.findOne({ where: { name: discountName } });
                if (!foundDiscount) {
                    warning.push(`Discount ${discountName} not found`);
                } else {
                    const user = await userRepository.findOne({ where: { id: req.user.id }, relations: ['discounts'] });
                    if (!user) {
                        res.status(500).json({ message: "Error when apply discount" });
                        return;
                    }

                    const discountUsed = user.discounts.some(d => d.id === foundDiscount.id);

                    if (discountUsed) {
                        warning.push(`${user.name} already used ${foundDiscount.name}`);
                    } else if (foundDiscount.status === 0) {
                        warning.push(`${foundDiscount.name} is no longer usable`);
                    } else {
                        curUser = user;
                        discount = foundDiscount;
                        discountStatus = foundDiscount.id;
                        newSubscription.totalPrice = newSubscription.totalPrice - (newSubscription.totalPrice * foundDiscount.ratio);
                    }
                }
            }

            const initMomoPayment = await singlePayAPI({
                partnerCode: process.env.MOMO_PARTNER_CODE as string,
                requestId: newSubscription.id,
                amount: newSubscription.totalPrice,
                orderId: newSubscription.id,
                orderInfo: "Pay with momo",
                redirectUrl: `${process.env.FRONT_END_ADDR}${process.env.FRONE_END_REDIRECT_PATH}`,
                ipnUrl: `${process.env.BACK_END_ADDR}/membership/confirm`,
                requestType: "captureWallet",
                extraData: "",
                lang: "vi",
            });

            let payUrl = null, deeplink = null, qrCodeUrl = null;

            if (!initMomoPayment) {
                res.status(400).json({
                    message: "Failed to create payment",
                });

                return;
            }

            await subscribeRepository.save(newSubscription);
            if (curUser && discount) {
                curUser.discounts.push(discount);
                await userRepository.save(curUser);
            }

            payUrl = initMomoPayment.payUrl;
            deeplink = initMomoPayment.deeplink;
            qrCodeUrl = initMomoPayment.qrCodeUrl;

            res.status(200).json({
                message: "Success",
                data: {
                    ID: newSubscription.id,
                    TotalPrice: newSubscription.totalPrice,
                    DiscountApply: discountStatus,
                    PayUrl: payUrl,
                    DeepLink: deeplink,
                    QrCodeUrl: qrCodeUrl
                },
                warning,
            })

            scheduleTaskJob(TimeDelay.TWO_HOURS, this.timeout, newSubscription.id);

        } catch (error) {
            console.error("Error while creating membership payment", error);
            res.status(500).json({ message: "Error while creating order" });
        }
    }

    async confirm(req: Request, res: Response): Promise<void> {
        const { orderId, resultCode, transId, message } = req.body;

        const logger = Logger.getInstance();

        const isValidSignature = verifySinglePaySignature(req.body);
        if (!isValidSignature) {
            res.status(400).json({ message: "Invalid signature" });
            return;
        }
        res.status(204).send();

        try {
            const dataSource = await AppDataSource.getInstance();
            const subscribeRepository = dataSource.getRepository(Subscribe);

            const subscribe = await subscribeRepository.findOne({ where: { id: orderId }, relations: ['user'] });

            if (!subscribe) {
                logger.error("Unexpected removal of bill:", orderId);
                return;
            }

            if (!subscribe.membershipId) {
                logger.error(`${subscribe.id} is not membership transaction`);
                return;
            }

            if (resultCode === 0) {
                const membershipRecordRepository = dataSource.getRepository(MembershipRecord);
                const membership = await membershipRecordRepository.findOne({ where: { userId: subscribe.userId } });

                if (membership) {
                    if (subscribe.membershipId !== membership.membershipId) {
                        membership.membershipId = subscribe.membershipId;
                        sendMail(subscribe.user.email, "Your membership has changed", "Membership change notification");
                    } else {
                        membership.expireDate = getDateNDaysAhead(membership.expireDate, 30);
                        sendMail(subscribe.user.email, `Your membership has been extended to ${membership.expireDate}`, "Membership extend notification");
                    }

                    await membershipRecordRepository.save(membership);
                } else {
                    const newMembership = new MembershipRecord();

                    newMembership.userId = subscribe.userId;
                    newMembership.membershipId = subscribe.membershipId;
                    newMembership.expireDate = getDateFromToday(30);
                    sendMail(
                        subscribe.user.email,
                        `Your membership has successfully registered, valid until ${newMembership.expireDate}`,
                        "Membership register notification"
                    );
                    await membershipRecordRepository.save(newMembership);
                }

                subscribe.transId = transId;
                await subscribeRepository.save(subscribe);

            } else {
                await sendMail(subscribe.user.email, "Subscribe failed", "Payment notification");

                logger.warn(`Bill ${orderId} has failed with code ${resultCode}: ${message}`);

                if (subscribe.discount) {
                    await dataSource
                        .createQueryBuilder()
                        .relation(User, 'discounts')
                        .of(subscribe.userId)
                        .remove(subscribe.discountId);
                }

                await subscribeRepository.remove(subscribe);
            }
        } catch (error) {
            console.error('Error handling IPN:', error);
        }
    }

    async timeout(id: string): Promise<void> {
        const dataSource = await AppDataSource.getInstance();
        const subscribeRepository = dataSource.getRepository(Subscribe);
        const logger = Logger.getInstance();

        try {
            const subscribe = await subscribeRepository.findOne({ where: { id } });

            if (!subscribe) {
                logger.error(`${id} has been deleted`);
                return;
            }

            if (subscribe.transId) {
                logger.info(`${id} success`);
                return;
            }

            logger.warn(`${id} subscribe timeout, begin removal`);

            if (subscribe.discountId) {
                await dataSource
                    .createQueryBuilder()
                    .relation(User, 'discounts')
                    .of(subscribe.userId)
                    .remove(subscribe.discountId);
            }

            await subscribeRepository.remove(subscribe);

            logger.warn(`${id} removed`);

        } catch (error) {
            logger.error("Error while checking subscribe timeout");
        }
    }

}

export default new MembershipController;
