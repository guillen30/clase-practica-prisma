# Clase practica

Proyecto local basado en las guias GD_S7_S1, GD_S7_S2 y GD_S8_S1_FinalNode.
NestJS 11 + Prisma 6.19.3 + SQLite + Swagger + JWT.

## Ejecutar

Desde esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env
node -e "const fs=require('fs');const crypto=require('crypto');const p='.env';fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('CAMBIAR_POR_UN_SECRETO_ALEATORIO',crypto.randomBytes(32).toString('hex')))"
node -e "const fs=require('fs');fs.closeSync(fs.openSync('prisma/dev.db','a'))"
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run build
npm run start:prod
```

Para desarrollo: `npm run start:dev`.

Swagger: http://127.0.0.1:3001/api
Inicio: http://127.0.0.1:3001/
El puerto 3001 se eligio porque 3000 estaba ocupado por otra aplicacion.

En una segunda terminal, con el servidor encendido: `npm test`.
Las pruebas usan `TEST_URL` si se necesita otra direccion.

## Datos de prueba

- admin@clase.local / Practica123!
- usuario@clase.local / Practica123!
- Tenant: Clase practica (id 1 en una base nueva).

Son credenciales locales de demostracion. El seeder usa upsert y bcrypt.
El archivo .env de esta copia local ya esta configurado. No se incluye en el ZIP.

## Swagger

1. Expandir POST /auth/login, pulsar Try it out y Execute.
2. Copiar el access_token recibido.
3. Pulsar Authorize, pegar el token sin el prefijo Bearer y aplicar.
4. Probar GET /users y las operaciones de crear, consultar, modificar y eliminar.
5. Retirar la autorizacion y verificar HTTP 401.

Ejemplo de POST /users:

```json
{"email":"nuevo@clase.local","name":"Nuevo Usuario","password":"Practica123!","tenantId":1}
```

PATCH /users/{id}: `{"name":"Nombre actualizado"}`.
DELETE elimina realmente el usuario indicado: utilizar un registro de prueba.

## Estructura

- prisma/: esquema, dos migraciones y seeder.
- src/prisma/: cliente compartido mediante inyeccion de dependencias.
- src/users/: DTO, controlador y servicio CRUD.
- src/auth/: login, JWT, estrategia y guard.
- src/main.ts: Swagger y validacion global.
- test/practica.cjs: 19 verificaciones HTTP y de persistencia.

Todos los endpoints /users exigen JWT. Las respuestas no incluyen password.
El rol se incorpora al JWT, pero no se aplica una politica de permisos por rol
ni aislamiento por tenant: ese alcance supera las tres guias de esta practica.

Se conservaron commits locales por hitos. No se publico en GitHub ni se envio a Teams.
