const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const base = process.env.TEST_URL || 'http://127.0.0.1:3001';
const results = [];
let token;
let id;
async function request(method, path, body, auth = token) {
  const r = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: 'Bearer ' + auth } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, data };
}
async function check(name, fn) {
  try {
    await fn();
    results.push({ prueba: name, resultado: 'OK' });
    console.log('OK | ' + name);
  } catch (e) {
    results.push({ prueba: name, resultado: 'ERROR', detalle: e.message });
    throw e;
  }
}
(async () => {
  await check('GET / devuelve Hello World!', async () => {
    const r = await request('GET', '/', null, null);
    assert.equal(r.status, 200);
    assert.equal(r.data, 'Hello World!');
  });
  await check('Swagger expone login y los cinco endpoints CRUD', async () => {
    const r = await request('GET', '/api-json', null, null);
    assert.equal(r.status, 200);
    assert.ok(r.data.paths['/auth/login'].post);
    for (const m of ['get', 'post']) assert.ok(r.data.paths['/users'][m]);
    for (const m of ['get', 'patch', 'delete'])
      assert.ok(r.data.paths['/users/{id}'][m]);
  });
  await check('GET /users sin token devuelve 401', async () =>
    assert.equal((await request('GET', '/users', null, null)).status, 401),
  );
  await check('Login con contraseña incorrecta devuelve 401', async () =>
    assert.equal(
      (
        await request(
          'POST',
          '/auth/login',
          { email: 'admin@clase.local', password: 'Incorrecta123!' },
          null,
        )
      ).status,
      401,
    ),
  );
  await check('Login válido devuelve JWT con sub, email y role', async () => {
    const r = await request(
      'POST',
      '/auth/login',
      { email: 'admin@clase.local', password: 'Practica123!' },
      null,
    );
    assert.equal(r.status, 200);
    token = r.data.access_token;
    const p = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
    assert.equal(p.email, 'admin@clase.local');
    assert.equal(p.role, 'ADMIN');
    assert.equal(p.exp - p.iat, 3600);
    assert.ok(p.sub);
  });
  await check('JWT inválido devuelve 401', async () =>
    assert.equal((await request('GET', '/users', null, 'invalid')).status, 401),
  );
  await check('JWT vencido devuelve 401', async () => {
    const { JwtService } = require('@nestjs/jwt');
    require('dotenv').config();
    const expired = new JwtService({ secret: process.env.JWT_SECRET }).sign(
      { sub: 1 },
      { expiresIn: -1 },
    );
    assert.equal((await request('GET', '/users', null, expired)).status, 401);
  });
  await check('GET /users autorizado no devuelve contraseñas', async () => {
    const r = await request('GET', '/users');
    assert.equal(r.status, 200);
    assert.ok(r.data.length >= 2);
    assert.ok(r.data.every((u) => !('password' in u)));
  });
  const email = 'prueba-' + Date.now() + '@clase.local';
  await check('POST /users crea un usuario, devuelve 201', async () => {
    const r = await request('POST', '/users', {
      email,
      name: 'Prueba CRUD',
      password: 'Practica123!',
      tenantId: 1,
    });
    assert.equal(r.status, 201);
    id = r.data.id;
    assert.equal(r.data.email, email);
    assert.ok(!('password' in r.data));
  });
  await check('GET /users/:id consulta el usuario creado', async () => {
    const r = await request('GET', '/users/' + id);
    assert.equal(r.status, 200);
    assert.equal(r.data.id, id);
  });
  await check('Correo duplicado devuelve 409', async () =>
    assert.equal(
      (
        await request('POST', '/users', {
          email,
          password: 'Practica123!',
          tenantId: 1,
        })
      ).status,
      409,
    ),
  );
  await check('DTO inválido devuelve 400', async () =>
    assert.equal(
      (
        await request('POST', '/users', {
          email: 'invalido',
          password: '123',
          tenantId: 1,
        })
      ).status,
      400,
    ),
  );
  await check('Tenant inexistente devuelve 400', async () =>
    assert.equal(
      (
        await request('POST', '/users', {
          email: 'tenant-' + Date.now() + '@clase.local',
          password: 'Practica123!',
          tenantId: 999999,
        })
      ).status,
      400,
    ),
  );
  await check('PATCH /users/:id modifica nombre y contraseña', async () => {
    const r = await request('PATCH', '/users/' + id, {
      name: 'Usuario actualizado',
      password: 'Nueva123!',
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.name, 'Usuario actualizado');
  });
  await check('La nueva contraseña permite iniciar sesión', async () =>
    assert.equal(
      (
        await request(
          'POST',
          '/auth/login',
          { email, password: 'Nueva123!' },
          null,
        )
      ).status,
      200,
    ),
  );
  await check('La contraseña almacenada es un hash bcrypt', async () => {
    const prisma = new PrismaClient();
    try {
      const u = await prisma.user.findUnique({ where: { id } });
      assert.notEqual(u.password, 'Nueva123!');
      assert.ok(await bcrypt.compare('Nueva123!', u.password));
    } finally {
      await prisma.$disconnect();
    }
  });
  await check('DELETE /users/:id elimina el usuario de prueba', async () =>
    assert.equal((await request('DELETE', '/users/' + id)).status, 200),
  );
  await check('Consultar el usuario eliminado devuelve 404', async () =>
    assert.equal((await request('GET', '/users/' + id)).status, 404),
  );
  await check('Parámetro id inválido devuelve 400', async () =>
    assert.equal((await request('GET', '/users/abc')).status, 400),
  );
  console.log('\n19 pruebas correctas.');
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() =>
    fs.writeFileSync(
      '../evidencias/resultados-pruebas.json',
      JSON.stringify(results, null, 2),
    ),
  );
