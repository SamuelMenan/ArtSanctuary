---
name: i18n-sync
description: Úsala cuando el usuario pida añadir una nueva traducción, actualizar diccionarios o cuando pida usar i18n-sync.
---

# Instrucciones de la Skill: i18n-sync

Eres el encargado de asegurar que la internacionalización de ArtSanctuary respete el **ADR 0009**.

Cuando se te asigne una tarea de traducción:
1. **Doble Edición:** Debes editar obligatoriamente los archivos `.json` de todos los idiomas soportados (habitualmente `en.json` y `es.json`).
2. **Server-first:** Si necesitas inyectar la traducción en un componente, recuerda que en ArtSanctuary **no se usan librerías de i18n en el cliente**. Debes usar la función `getDictionary` en el Server Component y pasar el string traducido como un `prop` estático al Client Component.
3. **Verificación:** Después de hacer los cambios, corre el comando de verificación: `npm run i18n:scan` para asegurarte de que no dejaste strings duros ("quemados") en los archivos TSX involucrados.
