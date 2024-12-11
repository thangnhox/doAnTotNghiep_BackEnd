import axios from "axios";
import { generateAutoPaymentSignature, generateGetTokenSignature, generateSinglePaymentSignature, generateManageSignature, generateSubscriptionSignature } from "../util/momo";
import Logger from "../util/logger";

interface getSubscriptionTokenRequestFormat {
    partnerCode: string,
    callbackToken: string,
    requestId: string,
    orderId: string,
    partnerClientId: string,
    lang: string,
}

interface getSubscriptionTokenResponseFormat {
    partnerCode: string,
    requestId: string,
    orderId: string,
    aesToken: string,
    resultCode: number,
    partnerClientId: string,
    responseTime: number,
    message: string,
};

export async function getSubscriptionToken(data: getSubscriptionTokenRequestFormat): Promise<getSubscriptionTokenResponseFormat | null> {

    const postData = {
        partnerCode: data.partnerCode,
        callbackToken: data.callbackToken,
        requestId: data.requestId,
        orderId: data.orderId,
        partnerClientId: data.partnerClientId,
        lang: data.lang,
        signature: generateGetTokenSignature(data),
    };

    try {
        const momoHost = process.env.MOMO_HOST;
        const response = await axios.post<getSubscriptionTokenResponseFormat>(`https://${momoHost}/v2/gateway/api/subscription/create`, postData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.data;

    } catch (error) {
        console.error("Error while getting subscription token:", error);
        return null;
    }
}

interface autoPaymentRequestFormat {
    partnerCode: string,
    orderId: string,
    amount: number,
    requestId: string,
    token: string,
    partnerClientId: string,
    orderInfo: string,
    extraData: string,
    nextPaymentDate: string,
    lang: string
}

interface autoPaymentResponseFormat {
    partnerCode: string,
    orderId: string,
    requestId: string,
    amount: number,
    transId: string,
    responseTime: number,
    partnerClientId: string,
    resultCode: number,
    message: string
}

export async function membershipPayment(data: autoPaymentRequestFormat): Promise<autoPaymentResponseFormat | null> {
    const postData = {
        partnerCode: data.partnerCode,
        orderId: data.orderId,
        amount: data.amount,
        requestId: data.requestId,
        token: data.token,
        partnerClientId: data.partnerClientId,
        orderInfo: data.orderInfo,
        extraData: data.extraData,
        nextPaymentDate: data.nextPaymentDate,
        lang: data.lang,
        signature: generateAutoPaymentSignature(data),
    };

    try {
        const momoHost = process.env.MOMO_HOST;
        const response = await axios.post<autoPaymentResponseFormat>(`https://${momoHost}/v2/gateway/api/subscription/pay`, postData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.data;

    } catch (error) {
        console.error("Error while request membership payment:", error);
        return null;
    }
}

interface manageDataRequest {
    partnerCode: string,
    requestId: string,
    orderId: string,
    token: string,
    partnerClientId: string,
    lang: string,
    action: string,
}

interface manageDataResponse {
    partnerCode: string,
    requestId: string,
    message: string,
    resultCode: number,
    partnerClientId: string,
    responseTime: number,
}

export async function manageSubscription(data: manageDataRequest): Promise<manageDataResponse | null> {
    const postData = {
        partnerCode: data.partnerCode,
        orderId: data.orderId,
        requestId: data.requestId,
        token: data.token,
        partnerClientId: data.partnerClientId,
        lang: data.lang,
        signature: generateManageSignature(data),
    };

    try {
        const momoHost = process.env.MOMO_HOST;
        const response = await axios.post<manageDataResponse>(`https://${momoHost}/v2/gateway/api/subscription/pay`, postData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.data;

    } catch (error) {
        console.error("Error while request manage token API:", error);
        return null;
    }
}


interface SinglePaymentDataRequestFormat {
    partnerCode: string;
    requestId: string;
    amount: number;
    orderId: string;
    orderInfo: string;
    redirectUrl: string;
    ipnUrl: string;
    requestType: string;
    extraData: string;
    lang: string;
}

interface SinglePaymentDataResponseFormat {
    partnerCode: string;
    requestId: string;
    orderId: string;
    amount: number;
    responseTime: number;
    message: string;
    resultCode: number;
    payUrl: string;
    deeplink: string | null;
    qrCodeUrl: string | null;
}

export async function singlePayAPI(data: SinglePaymentDataRequestFormat): Promise<SinglePaymentDataResponseFormat | null> {
    const postData = {
        ...data,
        signature: generateSinglePaymentSignature(data),
    };

    try {
        const momoHost = process.env.MOMO_HOST;
        const response = await axios.post<SinglePaymentDataResponseFormat>(`https://${momoHost}/v2/gateway/api/create`, postData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.data;

    } catch (error) {
        console.error("Error while request single pay:", error);
        return null;
    }
}

interface SubscriptionInfoRequestFormat {
    name: string;
    partnerSubsId: string;
    subsOwner: string;
    type: string;
    recurringAmount: number;
    frequency: string;
    nextPaymentDate: string;
    expiryDate: string;
}

interface InitSubscriptionDataRequestFormat {
    partnerCode: string;
    requestId: string;
    amount: number;
    orderId: string;
    orderInfo: string;
    redirectUrl: string;
    ipnUrl: string;
    partnerClientId: string;
    extraData: string;
    requestType: string;
    subscriptionInfo: SubscriptionInfoRequestFormat;
    lang: string;
}

interface InitSubscriptionDataResponseFormat {
    partnerCode: string;
    requestId: string;
    orderId: string;
    amount: number;
    payUrl: string;
    deeplink: string | null;
    qrCodeUrl: string | null;
    resultCode: number;
    message: string;
    responseTime: number;
    partnerClientId: string;
}

export async function initSubscriptionAPI(data: InitSubscriptionDataRequestFormat): Promise<InitSubscriptionDataResponseFormat | null> {
    const postData = {
        ...data,
        signature: generateSubscriptionSignature(data),
    };

    try {
        const momoHost = process.env.MOMO_HOST;

        Logger.getInstance().info(`Request body: ${postData}`);

        const response = await axios.post<InitSubscriptionDataResponseFormat>(`https://${momoHost}/v2/gateway/api/create`, postData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.data;

    } catch (error) {
        console.error("Error while request create subscription:", error);
        Logger.getInstance().error(`Response: ${error}`);
        return null;
    }
}