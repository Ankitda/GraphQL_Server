import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendMessage = async (to: string, body: string) => {
  try {
    const { sid } = await twilioClient.messages.create({
      body,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
  } catch (error) {
    throw error;
  }
};
