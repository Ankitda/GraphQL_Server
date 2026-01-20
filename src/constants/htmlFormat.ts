export const verificationCodeInHtml = (
  verificationCode: string
) => `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 16px; color: #333;">Dear User,</p>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="text-align: center; margin: 20px 0; display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <p style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          ${verificationCode}
        </p>
        <p style="font-size: 16px; color: #333;">Your verification code is valid for 10 minutes.</p>
      </div>
      <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Thank you,<br>Your Company Team</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
      </footer>
    </div>`;

export const resetPasswordInHtml = (resetLink: string) =>
  `<div style="font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 50vh;">
      <div style="background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); max-width: 400px; width: 100%; text-align: center;">
        <h2 style="font-size: 20px; margin-bottom: 15px; color: #333333;">Reset Your Password</h2>
        <p style="font-size: 15px; color: #555555; margin-bottom: 20px;">We’ve sent you a secure link to reset your password. Please click the button below to proceed.</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; transition: background-color 0.3s ease;">Reset Password</a>
        <p style="margin-top: 15px; font-size: 13px; color: #777777;">⚠️ This link will expire in <span style="color: #d32f2f; font-weight: 600;">15 minutes</span>.</p>
      </div>
  </div>`;

export const accountVerificationInHtml = (label: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
    <h2 style="color: #4CAF50; text-align: center;">${label} Verified</h2>
    <p style="font-size: 16px; color: #333;">Dear User,</p>
    <p style="font-size: 16px; color: #333;">Your ${label} has been successfully verified.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="#" style="display: inline-block; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #4CAF50; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Go to Dashboard</a>
    </div>
    <p style="font-size: 16px; color: #333;">If you did not create an account, please ignore this email.</p>
    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
      <p>Thank you,<br>Your Company Team</p>
      <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
    </footer>
  </div>
`;

export const passwordChangeInHtml = (name: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
  <h2 style="color: #4CAF50; text-align: center;">Password Change Successful</h2>
  <p style="font-size: 16px; color: #333;">Dear ${name},</p>
  <p style="font-size: 16px; color: #333;">Your password has been successfully changed.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="#" style="display: inline-block; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #4CAF50; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Go to Dashboard</a>
  </div>
  <p style="font-size: 16px; color: #333;">If you did not request this change, please contact support.</p>
  <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
    <p>Thank you,<br>Your Company Team</p>
    <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
  </footer>
</div>

`;

export const callAccountDeactivationInHtml = (username : string, deactivationDate : Date) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Deactivation Requested</h2>
        <p>Hi ${username},</p>
        <p>We received a request to deactivate your account. Your account will be deactivated on <strong>${deactivationDate.toLocaleString()}</strong>.</p>
        <p>If you didn't request this or changed your mind, you can cancel the deactivation anytime before the scheduled date by logging into your account.</p>
        <p>If you have any questions, please contact our support team.</p>
        <br/>
        <p>Best regards,<br/>The Team</p>
      </div>
    `;

export const cancelAccountDeactivationInHtml = (userName : string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Deactivation Cancelled</h2>
        <p>Hi ${userName},</p>
        <p>Your account deactivation request has been successfully cancelled. Your account will remain active.</p>
        <p>If you have any questions, please contact our support team.</p>
        <br/>
        <p>Best regards,<br/>The Team</p>
      </div>
    `;
