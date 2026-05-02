# Plan de Iteraciones del Cliente

Este documento organiza la implementacion del cliente web independiente que consume `sports-facilities-api`.

El objetivo del plan es dividir el trabajo en entregas pequenas, coherentes y faciles de subir al repositorio de forma progresiva, asegurando que cada iteracion deje una parte funcional y demostrable del cliente.

El cliente se desarrolla en el repositorio `ProyectoFinalWeb2-Cliente`, separado del backend `ProyectoFinalWeb2`.

## Estado actual tras la reorganizacion

Ya se ha completado la extraccion arquitectonica del cliente:

- el cliente vive en su propio repositorio;
- el backend ya no contiene `cliente-web`;
- el cliente se sirve con Express desde `server.js`;
- las paginas HTML viven en `views/`;
- los assets y scripts de navegador viven en `public/`;
- la URL base de la API esta centralizada en `public/js/config.js`;
- el cliente arranca en `http://localhost:5173`;
- la API arranca en `http://localhost:3000`.

## Criterios de division

Las iteraciones se dividen siguiendo estos principios:

- cada iteracion debe aportar una funcionalidad visible;
- cada iteracion debe ser integrable sin dejar el cliente roto;
- primero se valida la base comun del frontend;
- despues se implementan los flujos de consulta mas importantes;
- las operaciones de edicion y gestion se dejan para una fase posterior;
- la meteorologia y el historico se separan para mantener commits y entregas mas claros;
- cada iteracion debe incluir sus pruebas antes de considerarse cerrada;
- la solucion tecnica del cliente debe mantenerse simple y no introducir frameworks frontend innecesarios.

## Iteracion 0. Extraccion y arquitectura base

### Objetivo

Separar el cliente del backend y dejarlo como repositorio independiente.

### Alcance

- copiar el cliente desde `ProyectoFinalWeb2/cliente-web`;
- crear el repositorio `ProyectoFinalWeb2-Cliente`;
- reorganizar el cliente en `public/`, `views/` y `server.js`;
- anadir Express, dotenv y nodemon;
- eliminar `cliente-web` del repo API;
- documentar la arquitectura separada.

### Estado

Completada.

### Resultado actual

El cliente ya dispone de:

- `server.js`;
- `views/index.html`;
- `views/installations.html`;
- `views/sports.html`;
- `views/weather-records.html`;
- `public/css/styles.css`;
- `public/js/api.js`;
- `public/js/config.js`;
- scripts de pagina en `public/js/`;
- tests propios.

---

## Iteracion 1. Base del cliente y conexion con la API

### Objetivo

Crear la base del cliente y verificar que puede comunicarse correctamente con la API.

### Alcance

- mantener estructura base de carpetas;
- configurar la URL base de la API de forma simple y explicita;
- mantener un servicio comun de acceso HTTP;
- crear navegacion principal;
- implementar pantalla de inicio;
- comprobar el estado de la API con `GET /`.

### Estado

Completada funcionalmente.

### Tests

- test del modulo de conexion con la API;
- test de la vista de inicio;
- test de carga correcta del estado de la API;
- test de estado de error si `GET /` falla.

---

## Iteracion 2. Listado y detalle de instalaciones

### Objetivo

Implementar el recurso principal del dominio en modo consulta: instalaciones deportivas.

### Alcance

- crear vista de listado de instalaciones;
- consumir `GET /installations`;
- mostrar paginacion con `page` y `limit`;
- permitir filtros por:
  - `name`
  - `city`
  - `type`
  - `sport`
- crear vista de detalle de instalacion;
- consumir `GET /installations/{id}`;
- mostrar informacion principal de cada instalacion.

### Estado

Completada funcionalmente.

### Tests

- tests del servicio de instalaciones;
- tests de renderizado del listado;
- tests de filtros;
- tests de paginacion;
- test de navegacion al detalle;
- test de la vista de detalle de instalacion.

---

## Iteracion 3. Meteorologia por instalacion

### Objetivo

Anadir al cliente la capacidad de consultar la meteorologia de una instalacion concreta.

### Alcance

- anadir accion desde la vista de detalle de instalacion;
- consumir `GET /installations/{id}/weather`;
- mostrar:
  - temperatura;
  - condicion;
  - humedad;
  - velocidad del viento;
  - fecha de consulta;
- gestionar estados de carga y error para este flujo.

### Estado

Completada funcionalmente.

### Tests

- test del servicio de meteorologia por instalacion;
- test del disparo de la accion de consulta weather;
- test de renderizado de temperatura, condicion, humedad y viento;
- tests de errores devueltos por la API.

---

## Iteracion 4. Historico meteorologico

### Objetivo

Implementar la consulta del historico meteorologico como una seccion propia del cliente.

### Alcance

- mejorar la vista `views/weather-records.html`;
- consumir `GET /weather-records`;
- mostrar listado de registros;
- implementar filtros por:
  - `installationId`
  - `condition`
  - `dateFrom`
  - `dateTo`
- implementar ordenacion con:
  - `sortBy`
  - `sortOrder`
- implementar paginacion;
- permitir abrir detalle con `GET /weather-records/{id}` si se considera util.

### Estado

Pendiente de ampliar. Actualmente existe pagina y script base para cargar el listado inicial.

### Tests a implementar

- tests del servicio de `weather-records`;
- test del listado del historico;
- tests de filtros;
- tests de ordenacion;
- tests de paginacion;
- test del detalle de weather-record si se implementa;
- tests de carga vacia y error de consulta.

---

## Iteracion 5. Consulta y gestion del catalogo de deportes

### Objetivo

Incorporar el recurso `sports` como catalogo global de deportes.

Esta iteracion permite completar la informacion normalizada de cada deporte, como `osmKey`, `category` y `environment`.

No tiene como objetivo asociar deportes a instalaciones concretas. Esa relacion se gestionara en la Iteracion 6, dentro de la edicion de instalaciones.

### Alcance

- mejorar la vista `views/sports.html`;
- consumir `GET /sports`;
- implementar filtro `missingMetadata=true`;
- mostrar detalle de deporte con `GET /sports/{id}`;
- crear formularios para:
  - `POST /sports`
  - `PUT /sports/{id}`
  - `PATCH /sports/{id}`
- permitir eliminar con `DELETE /sports/{id}`;
- mostrar mensajes de exito y error en espanol.

### Estado

Implementada funcionalmente. Queda pendiente revisar textos visibles para dejar claro que el formulario gestiona el catalogo global de deportes.

### Tests a implementar

- tests del servicio de deportes;
- tests del listado y filtro `missingMetadata=true`;
- tests del detalle de deporte;
- tests de formulario de alta;
- tests de edicion completa con `PUT`;
- tests de edicion parcial con `PATCH`;
- test de borrado;
- tests de mensajes de exito y error.

---

## Iteracion 6. Gestion basica de instalaciones y deportes practicados

### Objetivo

Completar la parte de instalaciones anadiendo operaciones de creacion, edicion y borrado, incluyendo la gestion de los deportes practicados en cada instalacion.

### Alcance

- crear formulario de alta de instalacion con `POST /installations`;
- crear formulario de edicion con `PUT /installations/{id}`;
- anadir borrado con `DELETE /installations/{id}`;
- mostrar los deportes asociados a una instalacion;
- buscar deportes existentes en el catalogo `sports`;
- asociar deportes del catalogo a la instalacion;
- quitar deportes asociados a la instalacion;
- validar campos basicos en cliente;
- refrescar listados tras operaciones exitosas;
- mostrar errores devueltos por la API.

### Estado

Pendiente.

### Tests a implementar

- tests del formulario de alta;
- tests del formulario de edicion;
- test de borrado;
- tests de asociacion de deportes a una instalacion;
- tests de eliminacion de deportes asociados a una instalacion;
- tests de validaciones basicas en cliente;
- tests de refresco de listado tras crear, editar o eliminar;
- tests de error cuando la API rechaza la operacion.

---

## Iteracion 7. Mejora de experiencia de usuario y cierre

### Objetivo

Revisar el cliente de forma transversal para dejarlo consistente, usable y preparado para entrega.

### Alcance

- homogeneizar mensajes de carga, error y exito;
- revisar navegacion entre secciones;
- mejorar tablas, formularios y paginacion;
- revisar nombres, titulos y textos visibles;
- limpiar codigo duplicado;
- revisar configuracion de la URL base;
- anadir una capa minima de reutilizacion de componentes si aporta claridad.

### Estado

Pendiente.

### Tests a implementar

- revision y ajuste de la suite existente;
- tests de regresion de navegacion principal;
- tests de componentes compartidos criticos;
- tests de flujos completos mas importantes del cliente.

---

## Orden recomendado de ejecucion

1. Iteracion 0: extraccion y arquitectura base
2. Iteracion 1: base del cliente y conexion con la API
3. Iteracion 2: listado y detalle de instalaciones
4. Iteracion 3: meteorologia por instalacion
5. Iteracion 4: historico meteorologico
6. Iteracion 5: consulta y gestion de deportes
7. Iteracion 6: gestion basica de instalaciones y deportes practicados
8. Iteracion 7: mejora de experiencia de usuario y cierre

## Criterio de cierre por iteracion

Cada iteracion del cliente se considerara cerrada cuando incluya:

- codigo funcional integrado;
- codigo separado del backend y mantenido como entrega independiente;
- navegacion o acceso visible a la nueva funcionalidad;
- control basico de carga y errores;
- tests del bloque implementado;
- comprobacion manual del flujo principal;
- estado estable para poder subirlo al repositorio sin romper lo anterior.

Ademas:

- la implementacion debe seguir siendo compatible con un cliente vanilla simple;
- no se considerara obligatorio introducir herramientas de build si la iteracion puede resolverse con HTML, CSS y JavaScript nativo.
