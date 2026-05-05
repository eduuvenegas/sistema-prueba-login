# 📧 Recuperación de Contraseña con Nodemailer

Este documento detalla cómo se ha implementado el sistema de recuperación de contraseñas de manera 100% gratuita utilizando **Nodemailer** y **Gmail**.

---

## 📦 ¿Qué es Nodemailer?

`Nodemailer` es la librería estándar y más popular en el ecosistema de Node.js para el envío de correos electrónicos. 
* **Ventaja Principal:** No depende de APIs costosas (como SendGrid o Mailgun), sino que se comunica directamente utilizando el protocolo SMTP (Simple Mail Transfer Protocol), lo que permite usar cualquier proveedor de correo electrónico convencional (Gmail, Outlook, Yahoo, etc.).
* **Seguridad:** Soporta conexiones cifradas modernas (TLS/SSL).

---

## ⚙️ Flujo del Sistema de Recuperación

Para garantizar la seguridad del usuario y evitar restablecimientos de contraseña no autorizados, el sistema utiliza un **flujo basado en códigos OTP (One-Time Password)**.

1. **Solicitud (`/forgot-password`):** El usuario ingresa su correo electrónico registrado.
2. **Generación y Registro:** El backend verifica que el correo exista. Genera un número aleatorio de 6 dígitos (Ej: `459102`) y establece un tiempo de expiración de **15 minutos**. Estos datos se guardan en la tabla `usuarios` (columnas `reset_code` y `reset_expires`).
3. **Envío de Correo:** Nodemailer toma ese código, lo envuelve en una plantilla HTML amigable y se lo envía al correo del usuario.
4. **Validación y Cambio (`/reset-password`):** El usuario recibe el correo, ingresa el código junto con su nueva contraseña en el sistema. El backend valida que el código sea correcto y no haya expirado, procede a encriptar (`bcrypt`) la nueva contraseña y finalmente limpia los campos de recuperación (`NULL`).

---

## 🔑 Configuración del Remitente (Gmail)

Por motivos de seguridad, Gmail **no permite** que aplicaciones de terceros (como nuestro backend en Node.js) inicien sesión usando tu contraseña normal. 

Para que Nodemailer funcione, debes generar una **"Contraseña de Aplicación"** (App Password):

### Pasos para obtener la Contraseña de Aplicación en Google:
1. Inicia sesión en la cuenta de Google (Gmail) que servirá como remitente (ej. `soporte.ugel@gmail.com`).
2. Ve a la configuración de tu cuenta: **Gestionar tu cuenta de Google**.
3. En el menú izquierdo, selecciona **Seguridad**.
4. Asegúrate de tener activada la **Verificación en dos pasos** (Es un requisito obligatorio de Google).
5. Usa el buscador interno de ajustes (lupa arriba) y escribe: **"Contraseñas de aplicaciones"**.
6. Selecciona "Otra (nombre personalizado)", escribe "Sistema UGEL" y dale a **Generar**.
7. Te aparecerá una contraseña de 16 letras (ej. `abcd efgh ijkl mnop`).

### Configuración en el `.env`:
Copia esa contraseña (sin espacios) y el correo, colócalos en el archivo `.env` del backend:

```env
EMAIL_USER=tu_correo_de_soporte@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

---

## 🛠️ ¿Cómo probarlo usando Postman / ThunderClient?

**1. Para solicitar el código:**
* **MÉTODO:** `POST`
* **URL:** `http://localhost:5000/api/auth/forgot-password`
* **BODY (JSON):** `{ "email": "usuario_registrado@ugel.edu.pe" }`

**2. Para restablecer la contraseña:**
* **MÉTODO:** `POST`
* **URL:** `http://localhost:5000/api/auth/reset-password`
* **BODY (JSON):** 
  `{ "email": "usuario_registrado@ugel.edu.pe", "codigo": "123456", "nuevaPassword": "MiNuevaPasswordSegura" }`
