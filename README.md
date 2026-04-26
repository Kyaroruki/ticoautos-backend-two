# TicoAutos Backend

API REST para TicoAutos. Maneja autenticación con JWT, publicación de vehículos, subida de imágenes y preguntas/respuestas entre comprador y vendedor.

## Stack

- Node.js
- Express
- MongoDB + Mongoose
- GraphQL (Apollo server)
- JWT
- bcryptjs

## Requisitos

- Node.js 18+
- MongoDB
- npm

## Instalación y ejecución

```bash
npm install
npm run dev
npm start
```

Servidor: `http://localhost:3000`
Base API: `http://localhost:3000/api`
GraphQL: `http://localhost:3000/graphql`


## Variables de entorno

Crear `.env` en la raíz:

```env
PORT=3000
DATABASE_URL=mongodb://127.0.0.1:27017/ticoautos
JWT_SECRET=clave_secreta
PADRON_DB_NAME=padron
PADRON_COLLECTION=padron
SENDGRID_API_KEY=api_key_de_sendgrid
SENDGRID_FROM_EMAIL=correo_verificado_en_sendgrid
SENDGRID_FROM_NAME=TicoAutos
FRONTEND_BASE_URL=http://localhost:3001
```

La consulta de padron es solo local con MongoDB.
Se está usando `padron.padron`. 

## Registro con padron

- `GET /api/auth/identity/:identifyNumber`: valida la cedula en el padron y devuelve nombre y apellidos.
- Si la cedula no existe en el padron, el usuario no se registra.
- Los datos `name` y `lastname` se toman del padron, no del frontend.

## Autenticación

Las rutas protegidas usan:

```http
Authorization: Bearer <token>
```
## Arquitectura

El backend es híbrido:

### REST (Express)

Se utiliza para:

Autenticación (login, registro, 2FA)
Creación, edición y eliminación de vehiculos
Subir imagenes
### GraphQL (Apollo Server)

Se utiliza para:

Consultas de datos (GET)
Listado de vehículos
Detalles de vehículo
Preguntas y respuestas

## Reglas 

- Un usuario no puede preguntar por su propio vehículo
- No se puede crear otra pregunta si la anterior sigue pendiente sin respuesta
- Solo el dueño del vehículo puede responder
- Cada pregunta admite una sola respuesta
- Solo el dueño puede editar, eliminar o marcar como vendido un vehículo
