

export function shouldKeepRatioForResize({
  key,
  ctrlKey,
  metaKey,
  isKeyUp,
}: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  isKeyUp: boolean
}) {
  if (isKeyUp) return key === 'Control' || key === 'Meta'
  return ctrlKey || metaKey || key === 'Control' || key === 'Meta'
}
