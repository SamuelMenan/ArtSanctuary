---
title: "Estrategia de Rendimiento 3: Optimización del Diccionario i18n"
audience: dev
status: implemented
updated: 2026-08-14
---

# Optimización del Diccionario i18n

> 🛑 **DESACTUALIZADO — describe una implementación que no existe** (verificado
> 2026-08-14). La conclusión de fondo sigue siendo cierta (**al cliente solo
> viaja un idioma, no los dos**), pero el mecanismo descrito es otro:
>
> | Dice el doc | Realidad |
> |---|---|
> | Un `middleware.ts` intercepta la petición e inyecta la configuración | **No existe `middleware.ts`** en el repo. El idioma se resuelve en `src/app/layout.tsx` con `getRequestLocale()` (cookies) y, si hay sesión, se sobrescribe leyendo `User`. |
> | `i18n.ts` con `import('./locales/en.json')` asíncrono | Es `src/shared/i18n/dictionaries.ts`, `server-only`, con imports **estáticos** de `./messages/{es,en}.ts` (son `.ts`, no `.json`; no hay carpeta `locales/`), y `getDictionary()` es **síncrono**. |
> | "Al cliente solo llega el String 'Settings', no todo el archivo" | **Falso.** `layout.tsx` pasa el diccionario **completo** del idioma activo como prop a `AppPreferencesProvider`, y viaja entero en el payload RSC. |
>
> La carga asíncrona real (`loadDictionary`, en `src/shared/i18n/index.ts`)
> solo se usa al **cambiar de idioma** en cliente.

La internacionalización (i18n) en aplicaciones grandes a menudo introduce un problema silencioso: **el cliente descarga todos los idiomas disponibles** antes de poder pintar la pantalla. 

## El Problema
Si nuestra plataforma tiene 5000 cadenas de texto en Español (es) y 5000 en Inglés (en), importar estáticamente los archivos `.json` provocaría que el usuario descargue un archivo masivo con textos que nunca va a leer. Además, bloquearía el renderizado.

## La Solución Aplicada (i18n de Carga Asíncrona)

En ArtSanctuary, el sistema de diccionarios está implementado con el máximo rendimiento en mente usando las capacidades del Servidor.

### 1. Extracción de Idioma en el Middleware
Nuestro archivo `middleware.ts` intercepta la petición entrante, revisa las cookies de preferencias del usuario o los *Headers* (`Accept-Language`), e inyecta la configuración deseada en la respuesta, garantizando que el servidor sepa el idioma antes de renderizar.

### 2. Importación Dinámica por Localidad
El archivo central de diccionarios (`i18n.ts`) no importa los JSON de forma sincrónica. Utiliza una importación asíncrona controlada por la función:

```typescript
const dictionaries = {
  en: () => import('./locales/en.json').then((module) => module.default),
  es: () => import('./locales/es.json').then((module) => module.default),
};

export const getDictionary = async (locale: 'en' | 'es') => {
  return dictionaries[locale]?.() ?? dictionaries.es();
};
```

### 3. Inyección en el Server Component
El texto se resuelve **en el servidor**. El *Server Component* llama a `getDictionary`, lee únicamente las cadenas que necesita para esa página específica, y se las envía al *Client Component* ya evaluadas.

```typescript
// En el Servidor (Solo lee de disco el idioma correcto)
const dict = await getDictionary('en');

// Al cliente solo llega el String "Settings", no todo el archivo JSON.
return <ProfileForm translatedLabel={dict.profile.settings} />
```

### Impacto
- **Ahorro de Ancho de Banda:** Los usuarios solo descargan los textos en su propio idioma.
- **Sin Dependencias de Cliente:** No utilizamos librerías pesadas como `react-i18next` en el lado del cliente; el texto llega como HTML plano estático pre-traducido.
