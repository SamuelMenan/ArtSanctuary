// Registra los plugins de workspace (side-effect) antes de montar el editor,
// para que el board resuelva su extensión por `workspace.kind`. Composition
// root: la capa app puede depender de boards y de workspaces.
import '@frontend/features/workspaces'

export { default } from '@frontend/features/tools/boards/screens/BoardEditorScreen'
