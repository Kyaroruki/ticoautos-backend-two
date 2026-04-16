const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendVerificationCode(phone, code) {
  const to = process.env.TESTMODE === 'true' ? process.env.TEST_PHONE : phone;

  return client.messages.create({
    body: `TicoAutos - Your verification code is: ${code}`,
    to,
    from: process.env.TWILIO_PHONE_NUMBER
  });
}

module.exports = { sendVerificationCode };