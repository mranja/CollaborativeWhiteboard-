const nodemailer = require('nodemailer');

const sendInviteEmail = async (email, boardTitle, inviteLink, inviterName) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email is not configured. Invite link:', inviteLink);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Flowboard" <${process.env.EMAIL_USER || 'no-reply@flowboard.com'}>`,
    to: email,
    subject: `Join ${inviterName} on Flowboard: ${boardTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px">
        <h2 style="color: #4f46e5">You're Invited to Collaborate!</h2>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has invited you to collaborate on the whiteboard: <strong>${boardTitle}</strong>.</p>
        <p>Click the button below to accept the invitation and start flowing:</p>
        <div style="text-align: center; margin: 30px 0">
          <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block">Accept Invitation</a>
        </div>
        <p style="color: #64748b; font-size: 12px">This link will expire in 7 days.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0" />
        <p style="color: #94a3b8; font-size: 10px; text-align: center">&copy; 2026 Flowboard | Creativity in Real-time</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Invite email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending invite email:', error);
    return false;
  }
};

module.exports = { sendInviteEmail };
