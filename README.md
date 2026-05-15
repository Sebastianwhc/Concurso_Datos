# 🦠 EcoSalud IA - Bucaramanga

### Predicción Epidemiológica de Dengue con Inteligencia Artificial

Este proyecto es el desarrollo para la **Categoría Avanzado** del concurso gubernamental **"Datos al Ecosistema 2026: IA para Colombia"**. Se trata de un simulador predictivo inmersivo que utiliza datos abiertos del SIVIGILA y variables climáticas de la CDMB para anticipar brotes de dengue en Bucaramanga y su área metropolitana.

## 🚀 Características Principales

- **Landing Page Inmersiva**: Experiencia de scrollytelling con animaciones avanzadas (GSAP, ScrollTrigger).
- **Mapa Geoespacial Real**: Visualización de clusters de casos basada en GeoJSON oficial del DANE.
- **Simulador Predictivo**: Interfaz interactiva para proyectar el impacto del dengue según temperatura y precipitaciones.
- **Gráficos Dinámicos**: Canal endémico, distribución etaria y por sexo animados dinámicamente.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19 + TypeScript + Vite.
- **Animaciones**: GSAP (GreenSock) + ScrollTrigger.
- **Visualización**: Canvas API + SVG Nativo + Mapbox (Planificado).
- **Estilos**: Vanilla CSS con variables de diseño (Tokens) y Glassmorphism.

## 📦 Instalación y Desarrollo

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TU-USUARIO/ecosalud-ia-bucaramanga.git
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 📊 Datos

El proyecto utiliza:
- **SIVIGILA**: Datos históricos de casos de dengue.
- **CDMB**: Telemetría climática (Humedad, Temperatura, Lluvias).
- **DANE**: Marco Geoestadístico Nacional para límites del Área Metropolitana de Bucaramanga.

---
*Proyecto diseñado para el Reto de Salud y Bienestar - Colombia 2026.*
