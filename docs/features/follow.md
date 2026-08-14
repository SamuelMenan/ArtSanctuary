---
title: "Feature: Follow / Followers list"
audience: all
status: stable
updated: 2026-08-13
owner: TBD
---

# Feature: Follow / Followers list

No es un feature aparte — es parte de perfiles y API de usuarios. Redirect:

- Comportamiento y componentes (`FollowStats`, `FollowListModal`, variants
  `inline`/`cells`): [`profile.md`](profile.md).
- Contrato de API (`POST/DELETE /api/users/[id]/follow`, listas de
  followers/following, gating por `privacySettings.allowFollow`):
  [`../api/users.md`](../api/users.md).

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD
