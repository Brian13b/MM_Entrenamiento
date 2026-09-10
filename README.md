# MM Entrenamiento - Plataforma de Gestión

Sistema integral para la gestión de turnos, créditos y rutinas del gimnasio. Desarrollado con enfoque Mobile-First y PWA.

## Stack Tecnológico

* **Backend**: ASP.NET Core Web API (.NET 10)
* **Arquitectura**: Clean Architecture simplificada
* **Frontend**: React + Vite (PWA) + Tailwind CSS
* **Base de Datos**: PostgreSQL (EF Core)
* **Despliegue**: Railway (API + BD) y Vercel (Frontend)

## Estructura del Monorepo

* `/backend`: Código fuente de la API, estructurado en capas (Domain, Application, Infrastructure, Api).
* `/frontend`: Aplicación de cliente lista para consumir la API.