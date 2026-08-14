---
title: "Modelos de Dominio y Módulos de Servicio"
audience: backend, dev
status: stable
updated: 2026-08-14
---

# Modelos de Dominio y Módulos de Servicio

Reconstruido desde cero el 2026-08-14. La versión anterior dibujaba clases
`UserService`/`BoardService`/`ArtworkService` con métodos que **no existen**:
los servicios son módulos de funciones sueltas, no clases. También le faltaban
4 de los 7 modelos.

## Modelos (Mongoose)

Los 7 documentos reales y sus relaciones. Campos completos y verificados en
[`../data-model.md`](../data-model.md).

```mermaid
classDiagram
    class User {
        +username: string
        +email: string
        +passwordHash: string «select false»
        +status: active|deactivated|deleted
        +tokenVersion: number
        +following: ObjectId[]
        +followers: ObjectId[]
        +socials, notificationSettings, privacySettings
    }
    class Artwork {
        +title: string
        +artistId: ObjectId
        +imageUrl: string
        +visibility: public|unlisted|private
        +likedBy, savedBy, viewedBy: ObjectId[]
        +comments: embebidos
    }
    class Collection {
        +name: string
        +owner: ObjectId
        +isPrivate: boolean
        +artworks: ObjectId[]
        +references: IReference[]
    }
    class Notification {
        +recipientId: ObjectId
        +actorId: ObjectId
        +artworkId: ObjectId
        +type: like|comment|follow|save
        +read: boolean
    }
    class Board {
        +name: string
        +owner: ObjectId
        +projectId: ObjectId
        +workspace: kind|modality|view
        +objects: IBoardObject[]
        +lateralMirrorEnabled: boolean
    }
    class CarnivalProject {
        +kind: libre|carnaval
        +name: string
        +modality: string
        +accreditationStatus: draft|review|ready
        +owner: ObjectId
    }
    class CarnivalProjectVersion {
        +projectId: ObjectId
        +owner: ObjectId
        +label: string
        +isFinal: boolean
        +planos: snapshot inmutable
    }

    User "1" --> "N" Artwork : artistId
    User "1" --> "N" Collection : owner
    User "1" --> "N" Board : owner
    User "1" --> "N" Notification : recipientId/actorId
    User "1" --> "N" CarnivalProject : owner
    User "N" --> "N" User : follows
    CarnivalProject "1" --> "N" Board : Board.projectId
    CarnivalProject "1" --> "N" CarnivalProjectVersion
    Collection "N" --> "N" Artwork
```

> **`CarnivalProject` sirve a los dos workspaces.** Pese al nombre, su campo
> `kind` es `'libre' | 'carnaval'`. La colección se llama `carnivalprojects`
> por compatibilidad histórica.

> **La relación proyecto↔planos va al revés de lo intuitivo:** es `Board` quien
> apunta al proyecto con `projectId`. El proyecto no guarda un array de planos.

## Servicios: módulos, no clases

No hay `new UserService()`. Son módulos con funciones exportadas que se
importan directamente (`@backend/services/users.service`). No hay barrel.

```mermaid
flowchart LR
    subgraph SERVICIOS["src/backend/services/"]
        US["users.service<br/><small>getPublicProfile · getUserById<br/>followUser · unfollowUser<br/>deleteAccountCascade<br/>updateUserPreferences<br/>getFollowConnections<br/>isUsernameTaken · isEmailTaken</small>"]
        AS["artworks.service<br/><small>createArtwork · updateArtwork<br/>deleteArtwork · searchArtworks<br/>getPublicGallery · getFollowingFeed<br/>getGalleryArtworks · getArtworksByArtist<br/>getArtworkForView · interactWithArtwork</small>"]
        BS["boards.service<br/><small>createBoard · updateBoard · deleteBoard<br/>getUserBoards · getBoardById<br/>countUserBoards<br/>syncCarnavalLateralMirror</small>"]
        CS["collections.service<br/><small>createCollection · renameCollection<br/>deleteCollection · getCollectionById<br/>addArtworkToCollection<br/>removeArtworkFromCollection</small>"]
        NS["notifications.service<br/><small>getUserNotifications<br/>markNotificationRead<br/>markAllNotificationsRead</small>"]
        ES["explore.service<br/><small>getExploreTrending</small>"]
        AUS["auth.service<br/><small>registerUser</small>"]
        WS["workspaces/carnaval/<br/><small>carnaval-projects.service<br/>carnaval-versions.service</small>"]
    end

    SERVICIOS --> MODELS[("models/*.ts")]
```

Firmas exactas y comportamiento no obvio (efectos secundarios, orden de la
cascada, qué está cacheado) en [`../services.md`](../services.md).

## Límites de plan free

Constantes exportadas por los propios servicios:

| Recurso | Límite | Dónde |
|---|---|---|
| Boards | 5 | `MAX_FREE_BOARDS` |
| Colecciones | 3 | `MAX_FREE_COLLECTIONS` |
| Proyectos | 3 | `MAX_FREE_PROJECTS` |

## Advertencia

Varios de estos servicios tienen defectos conocidos sin resolver — incluido uno
crítico en `getPublicProfile`. Leer
[`../../ops/known-issues.md`](../../ops/known-issues.md) antes de construir
encima.
