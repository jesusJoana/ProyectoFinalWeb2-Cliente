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
npm run dev
```

URL local:

```text
http://localhost:5173
```

Rutas principales:

- `/`
- `/installations`
- `/sports`
- `/weather-records`

## Configuración

La URL base de la API se ajusta en `public/js/config.js`.

Por defecto, el cliente consume la API en:

```text
http://localhost:3000
```
