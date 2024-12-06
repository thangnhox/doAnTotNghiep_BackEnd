import crypto from from "crypto";

export function verifySignature(data: any): boolean {
	const { partnerCode, orderId, requestId, amount, orderInfo, orderType, partnerClientId, callbackToken, transId, resultCode, message, payType, responseTime, extraData, signature } = data;

	const secret = process.env.MOMO_SECRET;
	const access = process.env.MOMO_ACCESS;

	const rawData = `accessKey=${access}&amount=${amount}&callbackToken=${callbackToken}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerClientId=${partnerClientId}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

	const generatedSignature = crypto.createHmac('sha256', secretKey).update(rawData).digest('hex');

	return generatedSignature === signature;
}

