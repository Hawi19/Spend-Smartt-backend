import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, token) => {
  const verificationLink = `http://localhost:5173/verify?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "hawigirma1996@gmail.com",
      pass: "dqly nono hcet laji",
    },
  });

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
