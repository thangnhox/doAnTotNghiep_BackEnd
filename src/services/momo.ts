import axios from "axios";
import { generateAutoPaymentSignature, generateGetTokenSignature, generateInitPaymentSignature, generateManageSignature } from "../util/momo";

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
        console.error("Error while getting subscription token:", error);
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
        console.error("Error while getting subscription token:", error);
        return null;
    }
}


interface InitPaymentDataRequestFormat {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    orderInfo: string;
    extraData: string;
    requestType: string;
    redirectUrl: string;
    ipnUrl: string;
    lang: string;
}

interface InitPaymentDataResponseFormat {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    responseTime: number;
    message: string;
    resultCode: number;
    payUrl: string;
    deeplink: string;
    qrCodeUrl: string;
}

export async function initPayment(data: InitPaymentDataRequestFormat): Promise<InitPaymentDataResponseFormat | null> {
    const postData = {
        ...data,
        signature: generateInitPaymentSignature(data),
    };

    try {
        const momoHost = process.env.MOMO_HOST;
        const response = await axios.post<InitPaymentDataResponseFormat>(`https://${momoHost}/v2/gateway/api/create`, postData, {
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
