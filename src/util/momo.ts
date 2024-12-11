import crypto from 'crypto';
import fs from 'fs';
import NodeRSA from 'node-rsa';

const secretKey = process.env.MOMO_SECRET as string;
const accessKey = process.env.MOMO_ACCESS as string;
const iv = Buffer.alloc(16); // 16-byte buffer filled with zeros

export enum Frequency_String {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    BI_WEEKLY = "BI_WEEKLY",
    MONTHLY = "MONTHLY",
    BI_MONTHLY = "BI_MONTHLY",
    QUARTERLY = "QUARTERLY",
    SEMI_ANNUALLY = "SEMI_ANNUALLY"
}

export enum Frequency_Number {
    DAILY = 1,
    WEEKLY = 7,
    BI_WEEKLY = 14,
    MONTHLY = 30,
    BI_MONTHLY = 60,
    QUARTERLY = 90,
    SEMI_ANNUALLY = 180
}

interface SubscriptionDataToVerify {
    partnerCode: string;
    requestId: string;
    amount: number;
    orderId: string;
    orderType: string;
    orderInfo: string;
    partnerClientId: string;
    callbackToken: string;
    transId: number;
    resultCode: number;
    message: string;
    payType: string;
    responseTime: number;
    extraData: string;
    signature: string;
}

interface SubscriptionData {
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
}

interface singlePayDataToVery {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    orderInfo: string;
    orderType: string;
    transId: number;
    resultCode: number;
    message: string;
    payType: string;
    responseTime: number;
    extraData: string;
    signature: string;
};

interface SinglePaymentData {
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

interface DataToSign {
    partnerCode: string;
    callbackToken: string;
    requestId: string;
    orderId: string;
    partnerClientId: string;
    lang?: string;
}

interface AutoPaymentData {
    amount: number;
    extraData: string;
    orderId: string;
    orderInfo: string;
    partnerClientId: string;
    partnerCode: string;
    requestId: string;
    token: string;
}

interface ManageData {
    partnerCode: string;
    requestId: string;
    orderId: string;
    token: string;
    partnerClientId: string;
    lang: string;
    action: string;
}

export function verifySubscriptionSignature(data: SubscriptionDataToVerify): boolean {
    const {
        partnerCode, orderId, requestId, amount, orderInfo, orderType,
        partnerClientId, callbackToken, transId, resultCode, message,
        payType, responseTime, extraData, signature
    } = data;

    const rawData = `accessKey=${accessKey}&amount=${amount}&callbackToken=${callbackToken}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerClientId=${partnerClientId}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const generatedSignature = crypto.createHmac('sha256', secretKey).update(rawData).digest('hex');
    return generatedSignature === signature;
}

export function verifySinglePaySignature(data: singlePayDataToVery): boolean {
    const {
        amount, extraData, message, orderId, orderInfo, orderType, partnerCode, payType, requestId, responseTime, resultCode, signature, transId
    } = data;

    const rawData = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const generatedSignature = crypto.createHmac('sha256', secretKey).update(rawData).digest('hex');
    return generatedSignature === signature;
}

export function generateGetTokenSignature(data: DataToSign): string {
    const { partnerCode, callbackToken, requestId, orderId, partnerClientId, lang } = data;

    const rawData = `accessKey=${accessKey}&callbackToken=${callbackToken}&orderId=${orderId}&partnerClientId=${partnerClientId}&partnerCode=${partnerCode}&requestId=${requestId}`;

    const generatedSignature = crypto.createHmac('sha256', secretKey).update(rawData).digest('hex');
    return generatedSignature;
}

export function generateAutoPaymentSignature(data: AutoPaymentData): string {
    const { amount, extraData, orderId, orderInfo, partnerClientId, partnerCode, requestId, token } = data;

    const rawData = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&orderId=${orderId}&orderInfo=${orderInfo}&partnerClientId=${partnerClientId}&partnerCode=${partnerCode}&requestId=${requestId}&token=${token}`;

    const generatedSignature = crypto.createHmac('sha256', secretKey).update(rawData).digest('hex');
    return generatedSignature;
}

export function generateManageSignature(data: ManageData): string {
    const { orderId, partnerClientId, partnerCode, requestId, token } = data;

    const rawData = `accessKey=${accessKey}&orderId=${orderId}&partnerClientId=${partnerClientId}&partnerCode=${partnerCode}&requestId=${requestId}&token=${token}`;
    const generatedSignature = crypto.createHmac('sha256', secretKey).update(rawData).digest('hex');
    return generatedSignature;
}

export function generateSubscriptionSignature(data: SubscriptionData): string {
    const { 
        amount, extraData, ipnUrl, orderId, orderInfo, partnerClientId, partnerCode, redirectUrl, requestId, requestType
    } = data;

    const rawData = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerClientId=${partnerClientId}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const generatedSignature = crypto.createHmac('sha256', secretKey).update(rawData).digest('hex');
    return generatedSignature;
}

export function generateSinglePaymentSignature(data: SinglePaymentData): string {
    const rawSignature = `accessKey=${accessKey}&amount=${data.amount}&extraData=${data.extraData}&ipnUrl=${data.ipnUrl}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&partnerCode=${data.partnerCode}&redirectUrl=${data.redirectUrl}&requestId=${data.requestId}&requestType=${data.requestType}`;
    
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
    
    return signature;
}


export function decrypt(encrypted: string): { value: string; initialOrderId: string; userAlias: string; profileId: string } {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const jsonObj = JSON.parse(decrypted);
    return { ...jsonObj, userAlias: 'defaultAlias', profileId: 'defaultProfileId' };
}

// Load public key from file
const publicKeyPem = fs.readFileSync(process.env.MOMO_PUBKEY as string, 'utf-8');
const publicKey = new NodeRSA(publicKeyPem, 'pkcs8-public', { encryptionScheme: 'pkcs1' });

// RSA Encryption
export function rsaEncrypt(data: { value: string; initialOrderId: string }): string {
    const jsonString = JSON.stringify(data);
    const encrypted = publicKey.encrypt(jsonString, 'base64');
    return encrypted;
} 

