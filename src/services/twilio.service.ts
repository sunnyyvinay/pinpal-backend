import twilio from 'twilio';
import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "VA";

const client = twilio(accountSid, authToken);

export const sendVerificationCodeService = async (phoneNumber: string) => {
  try {
    const response = await client.verify.v2.services(verifyServiceSid).verifications.create({
      to: phoneNumber,
      channel: 'sms',
    });
    return response;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

export const verifyCodeService = async (phoneNumber: string, code: string) => {
  try {
    const response = await client.verify.v2.services(verifyServiceSid).verificationChecks.create({
      to: phoneNumber,
      code: code,
    });
    return response;
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};