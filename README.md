# TicoAutos Backend

API REST para TicoAutos. Maneja autenticación con JWT, publicación de vehículos, subida de imágenes y preguntas/respuestas entre comprador y vendedor.

## Stack

- Node.js
- Express
- MongoDB + Mongoose
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

## Variables de entorno

Crear `.env` en la raíz:

```env
PORT=3000
DATABASE_URL=mongodb://127.0.0.1:27017/ticoautos
JWT_SECRET=tu_clave_secreta
```

## Autenticación

Las rutas protegidas usan:

```http
Authorization: Bearer <token>
```

## Reglas 

- Un usuario no puede preguntar por su propio vehículo
- No se puede crear otra pregunta si la anterior sigue pendiente sin respuesta
- Solo el dueño del vehículo puede responder
- Cada pregunta admite una sola respuesta
- Solo el dueño puede editar, eliminar o marcar como vendido un vehículo
