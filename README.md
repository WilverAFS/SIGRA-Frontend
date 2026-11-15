
<div align="center">
  <h3>TECNOLÓGICO NACIONAL DE MÉXICO</h3>
  <h2>INSTITUTO TECNOLÓGICO DE OAXACA</h2>
  <p><strong>Ingeniería en Sistemas Computacionales</strong></p>
  <hr>
  <h1>SIGRA</h1>
  <h3>Frontend del proyecto</h3>
  <p><strong>SSistema de Gestión de Recursos Académicos</strong></p>
  <p>
    <strong>Materia:</strong> DSD-2303 · Desarrollo de Servicios Web<br>
    <strong>Semestre:</strong> 8.º &nbsp; | &nbsp; <strong>Grupo:</strong> 8SC<br>
    <strong>Docente:</strong> Ing. Luis Angel Zaragoza Farrera
  </p>
  <h4>Integrantes del Equipo</h4>
  <p>
    Flores Santiago Wilver Alfredo<br>
    Cruz Alonso Kelly Adanari<br>
    Pacheco Cruz Diego<br>
    Magaña Peralta Sherlin<br>
    Bustamante Rios Flor Estephany<br>
  </p>
  <p><strong>Oaxaca de Juárez, Oaxaca · 2026</strong></p>
  <p><strong>Estado:</strong> En desarrollo &nbsp;·&nbsp; <strong>Arquitectura:</strong> SPA (Vue 3 + TypeScript + Vite)</p>
</div>

---

## 1. Descripción del proyecto

**SIGRA (Sistema de Gestión de Recursos Académicos)**  es una aplicación web diseñada para centralizar, organizar, versionar y compartir planeaciones didácticas, temarios, apuntes, prácticas y evaluaciones entre docentes y estudiantes del **Instituto Tecnológico de Oaxaca**, con una arquitectura preparada para escalar a múltiples institutos y carreras.

La plataforma busca evitar la dispersión de materiales educativos y mantener trazabilidad sobre las actualizaciones de los programas de estudio mediante control de versiones de archivos, verificación de integridad (`SHA-256`), permisos basados en roles (`ADMIN`, `DOCENTE`, `ESTUDIANTE`) y búsquedas filtradas por carrera, semestre, asignatura y periodo académico.

## 2. Descripción de este repositorio

Este repositorio aloja el **frontend de SIGRA**, desarrollado como una Single Page Application (SPA) con **Vue.js 3, TypeScript y Vite**. Su responsabilidad es ofrecer una interfaz intuitiva y responsiva para los distintos perfiles institucionales, gestionar la sesión y permisos de usuario en el cliente, validar formularios y consumir los servicios de la API REST (`/api/v1`) expuestos por el backend.

Las áreas funcionales previstas para el frontend son:

- **Autenticación y Sesión (`/login`):** inicio y cierre de sesión institucional, persistencia de tokens JWT y redirección automática ante expiración de credenciales.
- **Panel Principal (`/dashboard`):** vista general adaptada al rol del usuario activo (`ADMIN`, `DOCENTE` o `ESTUDIANTE`).
- **Exploración Académica:** navegación por institutos, carreras, periodos académicos y retícula de asignaturas.
- **Repositorio y Versionamiento de Materiales:** carga de documentos académicos, consulta de historial de versiones, filtros de búsqueda y descarga de recursos autorizados.
- **Administración y Auditoría:** gestión de cuentas de usuario, asignación de cargas docentes y consulta de bitácora del sistema (exclusivo para administradores).
- **Diagnóstico de Conectividad (`/health`):** vista de verificación en tiempo real del estado del backend y sus servicios dependientes.

## 3. Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js (v18+ / v20 LTS) | Entorno de ejecución para herramientas de compilación y desarrollo. |
| Vue.js 3 (Composition API) | Framework progresivo para la construcción de interfaces de usuario. |
| TypeScript | Tipado estático estricto para componentes, tiendas y modelos de datos. |
| Vite | Empaquetador y servidor de desarrollo ultrarrápido. |
| Pinia | Gestión de estado global reactivo (sesión, usuario activo y roles). |
| Vue Router 4 | Enrutamiento SPA, navegación entre vistas y protección de rutas. |
| Axios | Cliente HTTP centralizado con interceptores para inyección de tokens JWT. |
| Git y GitHub | Control de versiones y colaboración mediante ramas y Pull Requests. |
| Visual Studio Code | Editor de desarrollo recomendado (con extensión *Vue - Official*). |

**Arquitectura prevista:** Frontend SPA (Vue 3 + Pinia) ↔ Backend API REST (`/api/v1`) ↔ PostgreSQL / Redis / RabbitMQ.

## 4. Requisitos previos

Antes de instalar el frontend, verifica que tengas instalados en tu equipo:

- **Node.js (v18 o superior)** y **npm**.
- **Git** y acceso al repositorio.
- **Backend de SIGRA (`SIGRA-Backend`)** configurado y en ejecución local (por defecto en `http://localhost:3000`) para probar el consumo de endpoints.

Para comprobar las herramientas principales en tu terminal:

```bash
node -v
npm -v
git --version

```

## 5. Guía de instalación local

### 5.1 Clonar el repositorio

En una terminal (Bash en Linux/macOS o PowerShell en Windows):

```bash
git clone [https://github.com/WilverAFS/SIGRA-Frontend.git](https://github.com/WilverAFS/SIGRA-Frontend.git)
cd SIGRA-Frontend

```

Si ya tienes el repositorio clonado, **no vuelvas a clonarlo**. Entra a tu carpeta existente y actualiza la rama principal.

### 5.2 Instalar dependencias

```bash
npm install

```

Este comando instala todas las dependencias registradas en `package-lock.json`.

### 5.3 Configurar las variables de entorno

Crea tu archivo local `.env` a partir de la plantilla `.env.example` en la raíz del proyecto:

```bash
cp .env.example .env

```

*(En Windows PowerShell usa `Copy-Item .env.example .env`).*

Abre el archivo `.env` y verifica que apunte a la URL base de tu servidor backend local:

```dotenv
# URL base del Backend de SIGRA (Contrato API v1)
VITE_API_URL=http://localhost:3000/api/v1

```

> **Importante:** en Vite, todas las variables accesibles desde el código cliente deben iniciar con el prefijo `VITE_`. Nunca subas el archivo `.env` con configuraciones privadas al repositorio.

### 5.4 Iniciar el servidor de desarrollo y verificar conexión

```bash
npm run dev

```

Abre en tu navegador la dirección local proporcionada por Vite (por defecto **http://localhost:5173**).

Para comprobar que la comunicación con el backend y las políticas CORS funcionan correctamente, navega a la ruta de diagnóstico **http://localhost:5173/health** (o selecciona **Test Conexión Backend** en la barra superior). Si el backend está encendido, verás el estado operativo de la API, base de datos, caché y colas.

Para detener el servidor, presiona **Ctrl + C** en la terminal.

## 6. Estructura general del frontend

```text
public/             Archivos estáticos servidos directamente en la raíz
src/
  ├── assets/         Hojas de estilo globales, imágenes y recursos gráficos
  ├── components/     Componentes visuales reutilizables (tarjetas, tablas, modales, barras)
  ├── router/         Configuración de Vue Router y guardias de navegación por rol
  ├── services/       Instancia configurada de Axios (api.ts) y servicios por módulo de la API
  ├── stores/         Tiendas de estado global con Pinia (auth.ts, etc.)
  ├── types/          Interfaces y tipos de TypeScript alineados al ContratoAPI-SIGRA
  ├── views/          Vistas o páginas principales enlazadas a las rutas (Login, Dashboard, Health)
  ├── App.vue         Componente raíz y estructura de navegación base
  ├── main.ts         Punto de entrada e inicialización de Vue, Pinia y Vue Router
  └── style.css       Estilos base de la aplicación
.env.example        Plantilla de variables de entorno sin secretos
index.html          Plantilla HTML principal de Vite
package.json        Dependencias y scripts del proyecto
tsconfig.app.json   Configuración de TypeScript y alias de rutas (@/)
vite.config.ts      Configuración de Vite y resolución de alias

```

## 7. Flujo de colaboración con Git y GitHub

Las contribuciones se desarrollan en **ramas personales creadas a partir de `main`**. No se deben subir cambios directamente a `main` sin la revisión correspondiente del equipo.

### 7.1 Actualizar la rama principal local

```bash
git status
git switch main
git pull --ff-only origin main

```

Antes de cambiar de rama, asegúrate de no tener modificaciones locales pendientes sin guardar.

### 7.2 Crear una rama personal

```bash
git switch -c front-wafs

```

`front-wafs` es un ejemplo usando iniciales. Cada integrante debe crear su propia rama según la vista o módulo asignado (por ejemplo, `front-login`, `front-materials`, `front-subjects`).

### 7.3 Editar, revisar y guardar cambios

```bash
git status
git diff
git add <archivos-modificados>
git commit -m "feat(auth): maquetar vista de inicio de sesion institucional"

```

Agrega únicamente los archivos relacionados con tu tarea siguiendo convenciones claras en los mensajes de commit (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`).

### 7.4 Publicar la rama

```bash
git push -u origin front-wafs

```

### 7.5 Crear un Pull Request

En GitHub, selecciona **Compare & pull request** (o **Pull requests → New pull request**), configurando:

* **Base:** `main`
* **Compare:** tu rama personal

Describe las vistas, componentes o integraciones realizadas, cómo los verificaste y solicita revisión antes de fusionar.

## 8. Buenas prácticas

* Utilizar siempre el alias `@/` para importaciones internas dentro de `src/` (por ejemplo, `@/services/api` o `@/stores/auth`).
* Centralizar todas las peticiones HTTP en `src/services/` utilizando la instancia de Axios configurada, evitando llamadas directas con `fetch` o URLs hardcodeadas.
* Definir interfaces estrictas en `src/types/` respetando los nombres de campos y estructuras de respuesta del **ContratoAPI-SIGRA**.
* Gestionar el estado de sesión y permisos de rol mediante el store `useAuthStore` de **Pinia**.
* No subir archivos `.env`, `node_modules/` ni `dist/` al repositorio.
* Conservar `package-lock.json` sincronizado para garantizar reproducibilidad en todo el equipo.

## 9. Equipo y enlaces

Proyecto académico de Ingeniería en Sistemas Computacionales, **Instituto Tecnológico de Oaxaca**.

* **Repositorio Frontend:** https://github.com/WilverAFS/SIGRA-Frontend
* **Repositorio Backend:** https://github.com/WilverAFS/SIGRA-Backend
* **Documentación de Vue 3:** https://es.vuejs.org/guide/introduction.html
* **Documentación de Vite:** https://vite.dev/guide/
* **Documentación de Pinia:** https://pinia.vuejs.org/
* **Documentación de Vue Router:** https://router.vuejs.org/

---

*SIGRA — Sistema de Gestión y Repositorio Colaborativo de Planeación y Recursos Académicos.*

