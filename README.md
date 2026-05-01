# 🏫 Sistema de Gestión de Recursos Propios (UGEL)

Una plataforma web integral desarrollada para modernizar, gestionar y asegurar la declaración de sustentos financieros trimestrales de las Instituciones Educativas. Este sistema facilita el trabajo de los directores y automatiza la revisión por parte de los especialistas.

## ✨ Características Principales

* **Control Financiero:** Registro detallado de ingresos, egresos y control de saldos del Banco de la Nación.
* **Auditoría Bidireccional:** Flujo de revisión estructurado (Borrador, Enviado, Observado, Aprobado) con bloqueo y desbloqueo automático de edición.
* **Gestión de Documentos:** Subida y visualización de sustentos en formato PDF.
* **Sistema de Alertas:** Notificaciones en tiempo real (Toasts) y alertas preventivas sobre el cierre de plazos trimestrales.
* **Exportación Avanzada:** Generación nativa de reportes consolidados en PDF (`jsPDF`) y archivos Excel (`exceljs`) con formatos y estilos listos para impresión.
* **Seguridad:** Autenticación y protección de rutas mediante JSON Web Tokens (JWT).

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React.js
* **Backend:** Node.js, Express
* **Base de Datos:** MySQL
* **Herramientas Adicionales:** JWT para seguridad, jsPDF y ExcelJS para exportación.

## 🚀 Instalación y Uso Local

1. Clona este repositorio.
2. Ingresa a las carpetas `frontend` y `backend` y ejecuta `npm install` en cada una para instalar las dependencias.
3. Configura las variables de entorno (`.env`) en el backend (credenciales de MySQL, `JWT_SECRET`).
4. Inicia el servidor backend (`npm run dev` o `npm start`).
5. Inicia el cliente frontend (`npm start` o `npm run dev`).

---
*Proyecto diseñado para optimizar los procesos de declaración y revisión de recursos educativos.*