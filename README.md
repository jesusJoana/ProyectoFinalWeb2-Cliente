# Cliente Web

Cliente independiente para consumir `sports-facilities-api`.

## Estructura

El cliente está organizado como servidor web clásico:

- `views/` para páginas HTML
- `public/css/styles.css` para estilos
- `public/js/` para scripts de navegador
- módulos JS pequeños para la lógica de acceso a la API y el renderizado

## Uso

```bash
npm install
npm run test
```

Después, el cliente se servirá desde el servidor local del proyecto.

## Configuración

La URL base de la API se ajusta en `public/js/config.js`.
