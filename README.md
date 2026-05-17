# ProyectoFinalWeb2-Cliente

Cliente web independiente para consumir la API REST `sports-facilities-api` del repositorio `ProyectoFinalWeb2`.

## Integrantes del grupo

- Inés Del Río García
- Encarnación Teresa González Buitrago
- Jesús Joana Azuara
- Lucía Sorní Scaletti

## Funcionalidad

El cliente permite demostrar los flujos principales del proyecto desde una interfaz web:

- comprobar el estado de la API;
- listar instalaciones deportivas con filtros y paginación;
- consultar el detalle de una instalación;
- consultar meteorología bajo demanda de una instalación;
- consultar histórico meteorológico con filtros, ordenación y paginación;
- gestionar el catálogo global de deportes;
- crear, editar y borrar instalaciones;
- asociar y quitar deportes del catálogo dentro de una instalación.

La sección `/sports` gestiona el catálogo global de deportes. La asociación de deportes practicados en una instalación se realiza desde `/installations`, seleccionando deportes existentes del catálogo.

## Requisitos previos

Para usar el cliente se necesita:

- Node.js instalado.
- La API REST `ProyectoFinalWeb2` arrancada.
- MongoDB con datos cargados para que la API pueda devolver instalaciones, deportes e histórico.

Por defecto:

- API REST: `http://localhost:3000`
- Cliente web: `http://localhost:5173`

## Instalación

Desde la raíz del repositorio cliente:

```bash
npm install
```

## Configuración

El puerto del cliente puede configurarse con la variable:

```env
CLIENT_PORT=5173
```

Si no se define, el cliente arranca en el puerto `5173`.

La URL base de la API está centralizada en:

```text
public/js/config.js
```

Valor por defecto:

```javascript
export const API_BASE_URL = 'http://localhost:3000';
```

Si la API se ejecuta en otro puerto u otro host, hay que actualizar esa constante.

## Ejecución

Primero debe estar arrancada la API REST del repositorio `ProyectoFinalWeb2`.

Después, desde este repositorio cliente:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

URL local:

```text
http://localhost:5173
```

## Rutas del cliente

- `/`
- `/installations`
- `/sports`
- `/weather-records`

## Relación con la API

El cliente consume los siguientes endpoints del backend:

- `GET /`
- `GET /installations`
- `POST /installations`
- `GET /installations/{id}`
- `PUT /installations/{id}`
- `DELETE /installations/{id}`
- `GET /installations/{id}/weather`
- `GET /sports`
- `POST /sports`
- `GET /sports/{id}`
- `PUT /sports/{id}`
- `PATCH /sports/{id}`
- `DELETE /sports/{id}`
- `GET /weather-records`

## Tests

Ejecutar la suite de tests:

```bash
npm test
```

## Estructura

```text
ProyectoFinalWeb2-Cliente/
  public/
    css/
      styles.css
    js/
      api.js
      config.js
      home.js
      installations.js
      sports.js
      weather-records.js
  views/
    index.html
    installations.html
    sports.html
    weather-records.html
  server.js
```

## Puesta en marcha completa

Resumen para probar todo el sistema:

1. Arrancar MongoDB.
2. Configurar `.env` en `ProyectoFinalWeb2`.
3. Cargar datos en MongoDB desde `data/*.json` o desde OpenStreetMap.
4. Arrancar la API REST con `npm run dev` en `ProyectoFinalWeb2`.
5. Arrancar el cliente con `npm run dev` en `ProyectoFinalWeb2-Cliente`.
6. Abrir `http://localhost:5173`.
