const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const { buildVerificationEmailContent } = require('./emailTemplates');

//Aqui decimos que el token expora en 24 horas
const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const FRONTEND_BASE_URL = (process.env.FRONTEND_BASE_URL );

const createVerificationTokenData = () => {
  const verificationTokenEmail = crypto.randomBytes(32).toString('hex');

  return {
    verificationTokenEmail,
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)
  };
};

const buildVerificationUrl = (token) => {
  // encodeURIComponent evita que el token rompa la URL por caracteres raros.
  return `${FRONTEND_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;
};

const sendVerificationEmail = async ({ to, name, verificationUrl }) => {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    throw new Error('Missing SendGrid environment configuration');
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // Aqui solo armamos el contenido del correo 
  const emailContent = buildVerificationEmailContent({ name, verificationUrl });

  // Y aqui enviamos el correo usando la API de SendGrid
  await sgMail.send({
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME
    },
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  });
};

module.exports = {
  buildVerificationUrl,
  createVerificationTokenData,
  sendVerificationEmail
};