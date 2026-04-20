# 💻 Stack Tecnológico del Proyecto

Este documento detalla los lenguajes, frameworks, librerías y herramientas utilizadas en el desarrollo del proyecto. El sistema utiliza una arquitectura basada en un stack **PERN modificado** (reemplazando PostgreSQL por MySQL).

---

## 🎨 Frontend (Interfaz de Usuario)

*   **Librería Principal:** **React (v18.x)**. Toda la interfaz está construida con componentes funcionales usando hooks (como `useState`, `useEffect`).
*   **Lenguaje:** **JavaScript (JSX / ES6+)**.
*   **Estilos:** **Tailwind CSS**. Utilizado para el diseño responsivo y rápido a través de clases utilitarias (ej. `max-w-4xl`, `bg-white`, `rounded-2xl`).
*   **Iconos:** **`lucide-react`**. Librería de iconos vectoriales para la interfaz de usuario (iconos como `Upload`, `FileText`, `Trash2`).
*   **Construcción:** **Babel** y herramientas del ecosistema React.

---

## ⚙️ Backend (Servidor y API)

*   **Entorno de Ejecución:** **Node.js** (versión recomendada 20.x).
*   **Lenguaje:** **JavaScript**.
*   **Framework Web:** **Express.js**. Manejo de rutas, middleware y creación de la API REST.
*   **Seguridad:** **`bcryptjs`** (v2.4.x) para el hashing y verificación segura de contraseñas.
*   **Configuración:** **`dotenv`** para el manejo de variables de entorno (`.env`).
*   **CORS:** Middleware **`cors`** para permitir peticiones seguras desde el cliente React al servidor Express.

---

## 🗄️ Base de Datos y Persistencia

*   **Motor de Base de Datos:** **MySQL (v5.7+)**. (Migrado desde la idea original de PostgreSQL).
*   **Driver de Conexión:** **`mysql2`**. Utilizando la API basada en Promesas (`pool.getConnection()`, `execute()`).
*   **Almacenamiento Híbrido Temporal:** Archivo físico **JSON (`directores.json`)** utilizado como fuente primaria de credenciales que sincroniza de manera automática con la base de datos MySQL.
*   **Entorno Local:** **Laragon** con **phpMyAdmin** para la administración local de MySQL en el puerto 3306.

---

## 🛠️ Herramientas de Desarrollo y DevOps

*   **Gestor de Tareas:** **`concurrently`** (v8.2+). Permite ejecutar múltiples comandos a la vez en una sola terminal (ej. levantar el frontend en el puerto 3000 y el backend en el puerto 5000 simultáneamente con `npm run dev`).
*   **Monitor de Cambios:** **`nodemon`** (v3.0+). Reinicia automáticamente el servidor backend cuando detecta cambios en los archivos.
*   **Gestor de Paquetes:** **npm** (Node Package Manager).