---
title: "Diagrama de Clases (Modelos de Dominio y Servicios)"
audience: backend, dev
status: stable
updated: 2026-06-01
---

# Diagrama de Clases (Dominio y Servicios)

Este diagrama UML muestra la estructura interna de las clases, interfaces y servicios principales del backend, reforzando la separación entre la capa de datos (Modelos) y la capa lógica (Servicios).

## Explicación del Diagrama
- Se ilustran las propiedades clave de las entidades de la base de datos (`User`, `Artwork`, `Board`).
- Se definen los Servicios que inyectan comportamiento a estos datos (`UserService`, `BoardService`, `ArtworkService`), asegurando que la lógica no reside en los controladores de Next.js, sino aquí.
- Las líneas de relación explican las cardinalidades lógicas: un Usuario administra y es dueño de muchos Tableros y Obras.

## Diagrama (Mermaid Class)

```mermaid
classDiagram
    %% Modelos de Datos (Mongoose Schemas)
    class User {
        +ObjectId _id
        +String username
        +String email
        +String passwordHash
        +String status
        +Number tokenVersion
        +Settings preferences
    }
    
    class Artwork {
        +ObjectId _id
        +ObjectId artistId
        +String title
        +String imageUrl
        +String visibility
        +Date uploadDate
    }
    
    class Board {
        +ObjectId _id
        +ObjectId owner
        +String name
        +Object viewport
        +Object background
        +BoardObject[] objects
    }

    %% Servicios de Lógica (Capa Clean Architecture)
    class UserService {
        <<Service>>
        +getUserProfile(userId: string)
        +updateSettings(userId: string, data: object)
        +deactivateAccount(userId: string)
    }

    class BoardService {
        <<Service>>
        +getUserBoards(userId: string)
        +createBoard(userId: string, data: object)
        +updateViewport(boardId: string, viewport: object)
        +deleteBoard(boardId: string)
    }

    class ArtworkService {
        <<Service>>
        +getPublicGallery(page: number, limit: number)
        +uploadArtwork(userId: string, payload: object)
        +likeArtwork(artworkId: string, userId: string)
    }

    %% Relaciones
    UserService ..> User : "Gestiona e inyecta reglas"
    BoardService ..> Board : "Gestiona e inyecta reglas"
    ArtworkService ..> Artwork : "Gestiona e inyecta reglas"
    
    User "1" *-- "many" Board : "owns"
    User "1" *-- "many" Artwork : "creates"
```
