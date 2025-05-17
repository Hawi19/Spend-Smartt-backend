import nodemailer from "nodemailer";

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hawigirma1996@gmail.com", // Your email address
    pass: "dqly nono hcet laji", // Your email password
  },
});

// Function to send verification email
export const sendVerificationEmail = async (email, token) => {
  const verificationLink = `https://spend-smart-frontend-cpad.vercel.app/verify?token=${token}`;

  const mailOptions = {
    from: "hawigirma1996@gmail.com",
    to: email,
    subject: "Email Verification",
    html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully.");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

// Function to send reset code email
export const sendResetCodeEmail = async (email, resetCode) => {
  const mailOptions = {
    from: "hawigirma1996@gmail.com",
    to: email,
    subject: "Password Reset Code",
    html: `<p>Your password reset code is: <strong>${resetCode}</strong></p>
           <p>Please use this code to reset your password within the next 15 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Reset code email sent successfully.");
  } catch (error) {
    console.error("Error sending reset code email:", error);
  }
};
