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

## 3.1. Situacion actual

El cliente ya cubre los flujos principales previstos:

- inicio y comprobacion de estado de la API;
- consulta de instalaciones con filtros y paginacion;
- detalle de instalacion;
- meteorologia bajo demanda por instalacion;
- historico meteorologico con filtros, ordenacion y paginacion;
- catalogo global de deportes con listado, filtros, detalle, alta, edicion completa, edicion parcial y borrado;
- gestion basica de instalaciones con alta, edicion, borrado y asociacion de deportes existentes del catalogo.

Las siguientes ampliaciones se centran en:

- mejorar la experiencia de usuario transversal;
- revisar textos, estados vacios, estados de error y formularios;
- preparar la documentacion y comprobacion final de entrega.

## 4. Alcance inicial

El cliente cubre la API publica aprobada en el proyecto.

Incluye:

- consumo de `GET /`;
- consumo de `GET /installations`;
- consumo de `GET /installations/{id}`;
- consumo de `GET /installations/{id}/weather`;
- consumo de `GET /sports`;
- consumo de `GET /weather-records`.
- consumo de operaciones de gestion sobre instalaciones y deportes.

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
- crear instalaciones nuevas;
- editar instalaciones existentes;
- borrar instalaciones;
- asociar deportes existentes del catalogo;
- quitar deportes asociados.

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

### 8.6. Gestion del catalogo de deportes

La seccion de `sports` permitira gestionar el catalogo global de deportes del sistema.

Este catalogo sirve para completar y normalizar la informacion general de cada deporte, pero no modifica por si solo los deportes practicados en una instalacion concreta.

La seccion permitira:

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

El formulario de esta seccion no debe usarse para indicar que una instalacion practica un deporte. Esa relacion se gestiona desde la seccion de instalaciones, seleccionando deportes ya existentes en el catalogo.

### 8.7. Deportes practicados en una instalacion

La asociacion entre deportes e instalaciones pertenece a la gestion de instalaciones.

Desde el detalle o formulario de una instalacion, el cliente debera permitir:

- ver los deportes practicados en esa instalacion;
- buscar deportes existentes en el catalogo `sports`;
- asociar uno o varios deportes del catalogo a la instalacion;
- quitar deportes asociados a la instalacion;
- guardar la instalacion actualizada mediante `PUT /installations/{id}`.

Esta funcionalidad ya pertenece al formulario de instalaciones. No se contempla anadir deportes libres por nombre desde instalaciones; la fuente debe ser el catalogo `sports`.

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

- visualizacion cartografica;
- panel de revision de deportes incompletos;
- exportaciones o vistas estadisticas.

## 15. Siguientes iteraciones previstas

### Iteracion 7. Mejora de experiencia de usuario y cierre

- homogeneizar mensajes de carga, exito, error y estados vacios;
- revisar formularios para que entren correctamente en pantalla;
- revisar tablas, filtros y paginaciones;
- limpiar duplicaciones pequenas en JavaScript;
- comprobar navegacion principal y flujos manuales.

### Iteracion 8. Revision final de entrega

- revisar README y documentos;
- ejecutar suite de tests;
- comprobar API y cliente levantados a la vez;
- preparar propuesta de commits separados para API y cliente.
