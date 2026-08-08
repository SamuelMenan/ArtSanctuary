# Dibuja los polígonos de partes sobre la lámina → PNG de verificación visual.
# Uso: .\draw-verify.ps1 -Image public\canon\heroic\frontal.png -Polys C:\tmp\out\polys.json -Out C:\tmp\out\verify.png
param(
  [Parameter(Mandatory = $true)][string]$Image,
  [Parameter(Mandatory = $true)][string]$Polys,
  [Parameter(Mandatory = $true)][string]$Out
)
Add-Type -AssemblyName System.Drawing

$polysJson = Get-Content $Polys -Raw | ConvertFrom-Json
$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Image).Path)
$bmp = New-Object System.Drawing.Bitmap($src.Width, $src.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($src, 0, 0, $src.Width, $src.Height)

# Paleta por parte (las 17 del atlas; las que falten caen al gris).
$colors = @{
  head     = @(255, 99, 71);   neck      = @(255, 165, 0)
  trapezius = @(255, 120, 60); shoulder  = @(70, 130, 180)
  torso    = @(60, 179, 113);  pelvis    = @(186, 85, 211)
  gluteus  = @(216, 112, 147)
  arm      = @(30, 144, 255);  elbow     = @(0, 100, 200)
  forearm  = @(0, 206, 209);   wrist     = @(0, 150, 160)
  hand     = @(255, 20, 147)
  thigh    = @(154, 205, 50);  knee      = @(100, 160, 30)
  leg      = @(255, 215, 0);   ankle     = @(200, 160, 0)
  foot     = @(138, 43, 226)
}

foreach ($p in $polysJson) {
  $c = $colors[$p.part]
  if ($null -eq $c) { $c = @(128, 128, 128) }
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, $c[0], $c[1], $c[2]))
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, $c[0], $c[1], $c[2]), 1.5)
  $pts = @($p.pts | ForEach-Object { New-Object System.Drawing.PointF($_[0], $_[1]) })
  $g.FillPolygon($brush, $pts)
  $g.DrawPolygon($pen, $pts)
  $brush.Dispose(); $pen.Dispose()
}
$g.Dispose(); $src.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "OK -> $Out (REVISAR VISUALMENTE antes de copiar paths.json)"
