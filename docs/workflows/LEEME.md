# Workflows de GitHub Actions

Estos dos archivos van en `.github/workflows/`. Están acá porque la sesión que armó el repo no tiene permitido escribir configuración de CI en tu máquina, y está bien que así sea. Para activarlos:

```
mkdir -p .github/workflows && git mv docs/workflows/*.yml .github/workflows/ && git commit -m "ci: activar workflows"
```

- `ci.yml`: tipos, tests y build en cada push; publica `dist/` en GitHub Pages desde `main` (activar Pages → Source: GitHub Actions en la configuración del repo).
- `datos.yml`: todos los lunes corre `npm run datos:sync` y, si huertapp cambió, abre un PR con el reporte.
