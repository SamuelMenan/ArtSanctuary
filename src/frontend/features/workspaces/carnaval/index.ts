// Plugin Carnaval. Importar este módulo (side-effect) registra su extensión de
// lienzo en el motor de boards. Futuro: aquí también se registrará su plugin de
// UI (cards de landing, ProjectScreen, etc.).

import { registerBoardExtension } from '@frontend/features/tools/boards/extensions/registry'
import { carnavalBoardExtension } from './board/extension'
import './ui' // registra el plugin de UI (landing)

registerBoardExtension(carnavalBoardExtension)
