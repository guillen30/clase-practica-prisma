# Flujo de desarrollo

Las ramas permanentes son `develop`, `qa` y `master`.

- `develop` integra el trabajo de las ramas `feature/*`.
- `qa` recibe una versión de `develop` para verificar compilación y pruebas.
- `master` conserva la versión validada que se entrega.

El flujo de promoción es `feature/* -> develop -> qa -> master`.
Cada integración conserva un commit de merge para que el historial muestre
de dónde viene el cambio y cuándo se promocionó. No se reescribe el historial
de las ramas permanentes.

## Trabajar en un cambio

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/nombre-del-cambio
# editar y verificar
npm run build
npm test
git add .
git commit -m "feat: describir el cambio"
git push -u origin feature/nombre-del-cambio
```

Para cambios posteriores, abrir un pull request hacia `develop`. Una vez
revisado y con CI correcto, integrar con merge commit. Después, promocionar
`develop` hacia `qa` y `qa` hacia `master`, repitiendo la validación.

`npm test` necesita que la API esté encendida. El workflow de GitHub Actions
prepara una base nueva, arranca la API y ejecuta las 19 comprobaciones.
Los resultados se guardan como artefactos del workflow; no se versionan.

## Convenciones

Usar commits que describan el cambio: `feat`, `fix`, `docs`, `test` o `ci`.
Las credenciales de ejecución van en `.env`, excluido de Git. Se versionan
el esquema, las migraciones y `.env.example`. La base SQLite, las dependencias,
los archivos compilados y los logs locales no se suben.
