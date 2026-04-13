// Esta es la construccion del contenido del email de verificacion, 
// es decir el cuerpo de lo que nos va a llegar por email para verificacion
//aparentemente esto va en el back y no en el front porque es el backend el que se encarga de enviar el email, 
// entonces es el backend el que arma el contenido del email y lo envia usando la funcion sendVerificationEmail 
// que esta en emailService.js
//Cualquier cosa despues le preguntamos al profe

const buildVerificationEmailContent = ({ name, verificationUrl }) => {
  return {
    subject: 'Activa tu cuenta de TicoAutos',
    text: `Hola ${name}. Abre este enlace para activar tu cuenta: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #18181b; line-height: 1.5;">
        <h2>Activa tu cuenta</h2>
        <p>Hola ${name},</p>
        <p>Tu cuenta fue creada correctamente pero todavia esta pendiente de activacion.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:6px;">
            Activar cuenta
          </a>
        </p>
        <p>Si no solicitaste este registro, puedes ignorar este correo.</p>
      </div>
    `
  };
};

module.exports = {
  buildVerificationEmailContent
};