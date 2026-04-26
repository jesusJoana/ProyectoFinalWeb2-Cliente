# Especificacion del Cliente

## 1. Proposito

Este documento define la propuesta funcional del cliente web independiente que consume la API REST `sports-facilities-api`.

El objetivo del cliente es ofrecer una interfaz sencilla para consultar instalaciones deportivas, revisar deportes normalizados del sistema y visualizar informacion meteorologica asociada a instalaciones concretas.

## 2. Arquitectura actual

El cliente vive en el repositorio independiente `ProyectoFinalWeb2-Cliente`.

La arquitectura queda separada en:

- API REST: repositorio `ProyectoFinalWeb2`, expuesto por defecto en `http://localhost:3000`.
- Cliente Web: repositorio `ProyectoFinalWeb2-Cliente`, expuesto por defecto en `http://localhost:5173`.
- Navegador: ejecuta JavaScript vanilla y consume la API mediante `fetch`.

## 3. Objetivo del cliente

El cliente debera permitir:

- consultar instalaciones deportivas disponibles;
- acceder al detalle de una instalacion;
- consultar la meteorologia actual de una instalacion concreta;
- consultar el historico meteorologico persistido;
- consultar y gestionar deportes del sistema.

## 4. Alcance inicial

El cliente cubre la API publica aprobada en el proyecto.

Incluye:

- consumo de `GET /`;
- consumo de `GET /installations`;
- consumo de `GET /installations/{id}`;
- consumo de `GET /installations/{id}/weather`;
- consumo de `GET /sports`;
- consumo de `GET /weather-records`.

No incluye en esta fase:

- importaciones manuales desde el cliente;
- autenticacion de usuarios;
- panel de administracion avanzado;
- sincronizaciones automaticas;
- mapas interactivos como requisito obligatorio.

## 5. Tipo de cliente

El cliente se implementa como una aplicacion web sencilla en `HTML + CSS + JavaScript vanilla`, servida por Express.

Razones:

- encaja con la tematica de la asignatura;
- permite demostrar consumo HTTP real de la API REST;
- reduce complejidad innecesaria;
- evita depender de frameworks frontend cuando el objetivo principal es consumir la API;
- facilita probar filtros, formularios, listados y detalle de recursos.

## 6. Estructura tecnica

La estructura objetivo del cliente es:

```text
ProyectoFinalWeb2-Cliente/
  server.js
  package.json
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
  tests/
  docs/
```

Responsabilidades:

- `server.js`: servidor Express del cliente.
- `views/`: paginas HTML servidas por rutas del cliente.
- `public/css/`: estilos del cliente.
- `public/js/api.js`: modulo comun de acceso HTTP a la API REST.
- `public/js/config.js`: configuracion de la URL base de la API.
- `public/js/*.js`: logica especifica de cada pagina.
- `tests/`: pruebas del cliente.
- `docs/`: documentacion funcional y plan de iteraciones del cliente.

## 7. Rutas del cliente

El servidor Express del cliente debe exponer:

- `GET /`
- `GET /installations`
- `GET /sports`
- `GET /weather-records`

Cada ruta devuelve una pagina HTML desde `views/`.

## 8. Funcionalidades minimas

### 8.1. Pantalla de inicio

La aplicacion mostrara:

- nombre del proyecto;
- breve explicacion del sistema;
- acceso a las secciones principales;
- estado basico de la API usando `GET /`.

### 8.2. Listado de instalaciones

La seccion de instalaciones permitira:

- listar instalaciones;
- paginar resultados con `page` y `limit`;
- filtrar por `name`, `city`, `type` y `sport`;
- mostrar datos basicos de cada instalacion:
  - nombre;
  - tipo;
  - ciudad;
  - deportes asociados.

### 8.3. Detalle de instalacion

Desde una instalacion concreta se mostrara:

- nombre;
- tipo;
- ciudad;
- deportes asociados;
- coordenadas si existen;
- fuente del dato;
- fecha de actualizacion si existe.

Ademas, desde esta vista se podra lanzar la consulta meteorologica bajo demanda mediante `GET /installations/{id}/weather`.

### 8.4. Consulta meteorologica por instalacion

El cliente debera permitir:

- solicitar la meteorologia actual de una instalacion;
- mostrar el resultado devuelto por la API;
- presentar al menos:
  - temperatura;
  - condicion;
  - humedad;
  - velocidad del viento;
  - fecha de consulta.

### 8.5. Historico meteorologico

La seccion de `weather-records` permitira:

- listar registros meteorologicos;
- filtrar por `installationId`;
- filtrar por `condition`;
- filtrar por rango con `dateFrom` y `dateTo`;
- paginar con `page` y `limit`;
- ordenar con `sortBy` y `sortOrder`;
- abrir el detalle de un registro por su id si se desea.

### 8.6. Gestion de deportes

La seccion de `sports` permitira:

- listar deportes;
- filtrar deportes incompletos con `missingMetadata=true`;
- crear nuevos deportes;
- consultar un deporte concreto;
- actualizar deportes con `PUT`;
- actualizar parcialmente con `PATCH`;
- eliminar deportes.

Como minimo, en cada deporte se mostrara:

- nombre;
- `osmKey`;
- categoria;
- entorno.

## 9. Operaciones del cliente sobre la API

El cliente debera estar preparado para consumir estos endpoints:

- `GET /`
- `GET /installations`
- `GET /installations/{id}`
- `GET /installations/{id}/weather`
- `POST /installations`
- `PUT /installations/{id}`
- `DELETE /installations/{id}`
- `GET /sports`
- `GET /sports/{id}`
- `POST /sports`
- `PUT /sports/{id}`
- `PATCH /sports/{id}`
- `DELETE /sports/{id}`
- `GET /weather-records`
- `GET /weather-records/{id}`

## 10. Requisitos de experiencia de usuario

El cliente debera:

- mostrar mensajes de carga durante las peticiones;
- mostrar mensajes de error legibles en espanol;
- reflejar respuestas vacias sin romper la interfaz;
- permitir navegar entre listados y detalles de forma clara;
- mantener formularios sencillos y consistentes.

## 11. Gestion de errores

El cliente debera contemplar al menos:

- error `400` por filtros o ids invalidos;
- error `404` cuando el recurso no exista;
- error `500` por fallo interno de configuracion;
- error `502` cuando falle la integracion meteorologica externa.

La interfaz debe presentar el `message` recibido por la API de forma comprensible para el usuario.

## 12. Ejecucion local

API:

```bash
cd ../ProyectoFinalWeb2
npm install
npm run dev
```

Cliente:

```bash
cd ../ProyectoFinalWeb2-Cliente
npm install
npm run dev
```

URLs locales:

- API: `http://localhost:3000`
- Cliente: `http://localhost:5173`

## 13. Resultado esperado

Al cerrar esta fase, el cliente debera permitir demostrar de forma visible y navegable que:

- la API puede consultarse desde una interfaz real;
- las instalaciones pueden explorarse;
- la meteorologia por instalacion funciona;
- el historico meteorologico puede filtrarse;
- los deportes pueden gestionarse desde el cliente.

## 14. Evolucion posterior

En fases posteriores, el cliente podra ampliarse con:

- busqueda avanzada `q` en instalaciones cuando se cierre la iteracion correspondiente;
- visualizacion cartografica;
- mejoras de diseno y experiencia de usuario;
- panel de revision de deportes incompletos;
- exportaciones o vistas estadisticas.
