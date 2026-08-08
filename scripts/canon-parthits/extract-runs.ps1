# Extrae las "runs" de figura por fila de una lámina de Canon.
# Figura = todo lo que NO es fondo. Fondo = flood-fill desde los bordes sobre
# píxeles transparentes/casi-blancos (el interior blanco de la figura queda
# encerrado por la línea → cuenta como figura).
#
# Uso: .\extract-runs.ps1 -Image public\canon\heroic\frontal.png -Out C:\tmp\runs.json
param(
  [Parameter(Mandatory = $true)][string]$Image,
  [Parameter(Mandatory = $true)][string]$Out
)

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Text;

public static class RunExtractor {
  public static string Extract(string path) {
    using (var bmp = new Bitmap(path)) {
      int w = bmp.Width, h = bmp.Height;
      var rect = new Rectangle(0, 0, w, h);
      var data = bmp.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
      var bytes = new byte[data.Stride * h];
      System.Runtime.InteropServices.Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
      bmp.UnlockBits(data);
      int stride = data.Stride;

      bool hasAlpha = false;
      // bgLike[i] = pixel que el fondo puede atravesar (transparente o casi blanco)
      var bgLike = new bool[w * h];
      for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
          int o = y * stride + x * 4;
          byte b = bytes[o], g = bytes[o + 1], r = bytes[o + 2], a = bytes[o + 3];
          if (a < 250) hasAlpha = true;
          bgLike[y * w + x] = (a <= 16) || (a > 16 && r > 242 && g > 242 && b > 242);
        }
      }

      // Flood fill BFS desde todos los píxeles del borde que sean bgLike.
      var outside = new bool[w * h];
      var queue = new Queue<int>();
      Action<int,int> push = (x, y) => {
        int i = y * w + x;
        if (!outside[i] && bgLike[i]) { outside[i] = true; queue.Enqueue(i); }
      };
      for (int x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
      for (int y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
      while (queue.Count > 0) {
        int i = queue.Dequeue(); int x = i % w, y = i / w;
        if (x > 0) push(x - 1, y);
        if (x < w - 1) push(x + 1, y);
        if (y > 0) push(x, y - 1);
        if (y < h - 1) push(x, y + 1);
      }

      // Runs por fila: figura = !outside.
      var sb = new StringBuilder();
      sb.Append("{\"w\":").Append(w).Append(",\"h\":").Append(h)
        .Append(",\"hasAlpha\":").Append(hasAlpha ? "true" : "false").Append(",\"rows\":[");
      for (int y = 0; y < h; y++) {
        if (y > 0) sb.Append(',');
        sb.Append('[');
        bool inRun = false; int start = 0; bool first = true;
        for (int x = 0; x < w; x++) {
          bool fig = !outside[y * w + x];
          if (fig && !inRun) { inRun = true; start = x; }
          if ((!fig || x == w - 1) && inRun) {
            int end = fig ? x : x - 1;
            if (!first) sb.Append(',');
            sb.Append('[').Append(start).Append(',').Append(end).Append(']');
            first = false; inRun = false;
          }
        }
        sb.Append(']');
      }
      sb.Append("]}");
      return sb.ToString();
    }
  }
}
'@

$json = [RunExtractor]::Extract((Resolve-Path $Image).Path)
$outDir = Split-Path $Out -Parent
if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Force $outDir | Out-Null }
# Sin BOM: Node lo lee directo.
[System.IO.File]::WriteAllText($Out, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "OK -> $Out ($([math]::Round((Get-Item $Out).Length/1kb)) KB)"
