# Cliente Web

Cliente independiente para consumir `sports-facilities-api`.

## Estructura

El cliente está organizado como servidor web clásico:

- `views/` para páginas HTML
- `public/css/styles.css` para estilos
- `public/js/` para scripts de navegador
- módulos JS pequeños para la lógica de acceso a la API y el renderizado

## Situación actual

El cliente ya permite demostrar los flujos principales del proyecto:

- pantalla de inicio con comprobación de estado de la API;
- listado, filtros, paginación y detalle de instalaciones;
- consulta meteorológica bajo demanda desde una instalación;
- consulta del histórico meteorológico con filtros, ordenación y paginación;
- gestión del catálogo global de deportes;
- creación, edición y borrado de instalaciones;
- asociación y eliminación de deportes del catálogo dentro de una instalación.

La sección `/sports` gestiona el catálogo global de deportes. Para indicar qué deportes se practican en una instalación se usa el formulario de `/installations`, seleccionando deportes existentes del catálogo.

Las siguientes iteraciones se centran en mejorar experiencia de usuario, revisar textos y estados, integrar búsqueda avanzada cuando la API cierre `q`, y preparar la entrega final.

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
