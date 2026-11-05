<!-- markdownlint-disable MD033 MD041 MD022 MD032 MD004 MD030 MD045 -->
<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/React-Dark.svg" alt="React" width="40" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Vite-Dark.svg" alt="Vite" width="40" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/TailwindCSS-Dark.svg" alt="Tailwind" width="40" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/CS.svg" alt="C#" width="40" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/DotNet.svg" alt=".NET" width="40" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/PostgreSQL-Dark.svg" alt="PostgreSQL" width="40" />
  
  <br/>
  <br/>
  
  <h1>MM Entrenamiento | PWA</h1>
  <p><strong>Plataforma Integral de Gestión de Reservas, Retención y Seguimiento para Centros de Entrenamiento</strong></p>

  <br/>
  
  <img src="imagenes\Alumno_Perfil.jpeg" alt="MM Entrenamiento Dashboard" width="100%" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
</div>

<br/>

**MM Entrenamiento** es una Progressive Web App (PWA) de alto rendimiento diseñada a medida para digitalizar por completo la gestión operativa de un centro de entrenamiento. Construida con una arquitectura robusta separando el Backend (C#/.NET) del Frontend (React), la plataforma automatiza la asignación de turnos, controla los cupos en tiempo real, gestiona los créditos de membresías y provee herramientas clínicas y analíticas para los profesores.

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Roles y Permisos](#-roles-y-permisos)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura PWA](#-arquitectura-pwa)
- [Despliegue e Infraestructura](#-despliegue-e-infraestructura)

---

## 🚀 Características Principales

- **Motor de Reservas Inteligente:** Gestión de turnos fijos y clases libres con control estricto de cupos por horario.
- **Gestión de Créditos Dinámica:** Sistema de "billeteras virtuales". Las cancelaciones realizadas a tiempo devuelven automáticamente el crédito al alumno.
- **Panel de Retención (Alertas):** Motor analítico que detecta alumnos en riesgo de abandono basándose en ausencias consecutivas para facilitar la intervención.
- **Seguimiento Clínico y Planes:** Fichas técnicas integradas (historial de lesiones, objetivos) y visualizador iFrame embebido para planes de entrenamiento alojados en la nube (OneDrive/Drive).
- **Asistencia Idempotente:** Interfaz ultrarrápida para que los profesores tomen asistencia, diseñada a prueba de fallos (evita métricas duplicadas).
- **Comunicación Activa:** Cartelera de anuncios globales con soporte de sintaxis Markdown para links interactivos (`[Texto](URL)`) y Web-Push Notifications.

---

## 📸 Capturas de Pantalla

| Dashboard Alumno | Toma de Asistencia (Profe) |
| :---: | :---: |
| <img src="imagenes\Alumno_Dashboard.jpeg" width="400" style="border-radius: 8px;"/> | <img src="imagenes\Profe_Asistencia.png" width="400" style="border-radius: 8px;"/> |
| Visualización de créditos, clases próximas y cartelera de avisos. | Toma ágil de asistencia con visualización de ficha técnica. |

| Panel de Ajustes y Membresías | Listado y Alertas de Retención |
| :---: | :---: |
| <img src="imagenes\Admin_Ajustes.png" width="400" style="border-radius: 8px;"/> | <img src="imagenes\Admin_Dashboard.png" width="400" style="border-radius: 8px;"/> |
| Creación de planes, control de cupos y publicación de anuncios. | Detección de inasistencias prolongadas y accesos rápidos a WhatsApp. |

---

## 👥 Roles y Permisos

La plataforma está dividida en tres perfiles de usuario, garantizando seguridad y aislamiento de responsabilidades (RBAC):

1. **Alumnos:** Acceso a la grilla de horarios, reserva de clases, visualización de créditos restantes, alertas de vencimiento y cartelera interactiva.
2. **Profesores (Trainers):** Acceso al panel de clases diarias, toma de asistencia rápida, visualización de fichas médicas, planes vinculados y gestión de inscripciones de último minuto.
3. **Administradores:** Control total sobre las finanzas, creación de membresías, análisis de métricas, módulo de retención de clientes y ajustes globales del sistema.

---

## 🛠️ Stack Tecnológico

**Frontend (Cliente PWA)**

- **Core:** React (Vite v8)
- **Estilos:** Tailwind CSS v4
- **Manejo de Estado:** Zustand
- **Service Workers:** `vite-plugin-pwa` (Estrategia `injectManifest`)
- **Componentes UI:** Headless UI, Heroicons, React-Hot-Toast

**Backend (API Restful)**

- **Framework:** C# .NET Core (Arquitectura Limpia / Clean Architecture)
- **Base de Datos:** PostgreSQL vía Entity Framework Core
- **Seguridad:** JWT (Access & Refresh Tokens), BCryptHashing
- **Servicios Externos:** API REST de Brevo (Emailing) para bypass de restricciones SMTP.

---

## 📱 Arquitectura PWA

El sistema está optimizado para proveer una experiencia 100% nativa en dispositivos móviles, esquivando las agresivas políticas de caché de iOS/Android:

- **Estrategia `prompt`:** Las actualizaciones no se aplican silenciosamente interrumpiendo al usuario. El Service Worker detecta la nueva versión y despliega un Toast UI ("Actualizar ahora").
- **Skip Waiting Controlado:** Al aceptar la actualización, React emite un evento `SKIP_WAITING` hacia el `sw.js`, forzando el relevo de la caché y reiniciando la app en su última versión.
- **Web-Push Resilience:** El Service Worker escucha eventos `pushsubscriptionchange` para regenerar y resincronizar tokens si el SO del dispositivo los rota por seguridad, evitando la pérdida de notificaciones.

---

## 🚀 Despliegue e Infraestructura

- **Frontend:** Alojado en **Vercel**. Configurado con reescritura de rutas para SPA y redirección HTTPS.
- **Backend:** Alojado en **Railway**. Desplegado mediante contenedores, con bases de datos gestionadas y comunicación saliente por HTTP (443) para sortear bloqueos de puertos clásicos (25, 587).

<br/>

<div align="center">
  <p>Diseñado y desarrollado por <strong><a href="https://gbsolucionesdigitales.com.ar" target="_blank">GB Soluciones Digitales</a></strong></p>
</div>
