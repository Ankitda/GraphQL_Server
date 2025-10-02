import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_MAIL,
    pass: process.env.GOOGLE_MAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(
  to: string,
  subject: string,
  html: string
) {
  try {
    const info = await transporter.sendMail({
      from: `E-shop <${process.env.GOOGLE_MAIL}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    throw error;
  }
}
