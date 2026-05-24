import nodemailer from "nodemailer";
import logger from "../config/logger.config";
import { serverConfig } from "../config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: serverConfig.MAIL_USER,
    pass: serverConfig.MAIL_PASS,
  },
});

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async (options: SendEmailOptions) => {
  if (!serverConfig.MAIL_USER || !serverConfig.MAIL_PASS) {
    logger.error("Email credentials are not configured");
    throw new Error("Email credentials are not configured");
  }

  const fromAddress = serverConfig.MAIL_FROM || serverConfig.MAIL_USER;

  await transporter.sendMail({
    from: fromAddress,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};
