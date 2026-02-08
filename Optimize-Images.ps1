add-type -assemblyname System.Drawing

$sourcePaths = @("Events", "Highlights")
$maxWidth = 800
$quality = 60 
$rootPath = $PSScriptRoot

foreach ($path in $sourcePaths) {
    if (-not (Test-Path $path)) { 
        Write-Host "Path not found: $path" -ForegroundColor Red
        continue 
    }
    
    Write-Host "Scanning path: $path" -ForegroundColor Cyan
    $allPaths = Get-ChildItem -Path $path -Recurse -Directory | Select-Object -ExpandProperty FullName
    $allPaths = @($path) + $allPaths

    foreach ($currentFolder in $allPaths) {
        Write-Host "  Checking folder: $currentFolder"
        $files = Get-ChildItem -Path $currentFolder -File
        
        foreach ($file in $files) {
            $ext = $file.Extension.ToLower()
            
            if (@(".jpg", ".jpeg", ".png").Contains($ext) -and $file.Name -notlike "*_proxy*") {
                
                # Determine Target Proxy Path
                $relativePath = $file.FullName.Replace("$rootPath\", "")
                $targetBase = "$path (Proxy)"
                $subPath = $relativePath.Substring($path.Length).TrimStart("\")
                $proxyDir = Join-Path (Join-Path $rootPath $targetBase) ([System.IO.Path]::GetDirectoryName($subPath))
                
                $proxyName = $file.BaseName + "_proxy" + $file.Extension
                $proxyPath = Join-Path $proxyDir $proxyName
                
                if (Test-Path $proxyPath) { 
                    Write-Host "    Proxy already exists for $($file.Name)" -ForegroundColor Gray
                    continue 
                }
                
                # Ensure target directory exists
                if (!(Test-Path $proxyDir)) { New-Item -ItemType Directory -Path $proxyDir -Force }

                Write-Host "    Optimizing $($file.Name)..." -ForegroundColor Yellow
                
                try {
                    $img = [System.Drawing.Image]::FromFile($file.FullName)
                    
                    # --- EXIF Orientation Fix ---
                    $orientationId = 0x0112
                    if ($img.PropertyIdList -contains $orientationId) {
                        $prop = $img.GetPropertyItem($orientationId)
                        $val = $prop.Value[0]
                        Write-Host "      Detected Orientation: $val" -ForegroundColor Gray
                        
                        switch ($val) {
                            2 { $img.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
                            3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
                            4 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
                            5 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
                            6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
                            7 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
                            8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
                        }
                    }

                    $newWidth = $img.Width
                    $newHeight = $img.Height
                    
                    if ($img.Width -gt $maxWidth) {
                        $scale = $maxWidth / $img.Width
                        $newWidth = $maxWidth
                        $newHeight = [int]($img.Height * $scale)
                    }
                    
                    $btc = [System.Drawing.Bitmap]::new($newWidth, $newHeight)
                    $graph = [System.Drawing.Graphics]::FromImage($btc)
                    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)
                    
                    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
                    $encoderParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
                    $encoderParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, $quality)
                    
                    $btc.Save($proxyPath, $codec, $encoderParams)
                    
                    $img.Dispose()
                    $btc.Dispose()
                    $graph.Dispose()
                    Write-Host "    Created proxy in (Proxy) folder: $proxyName" -ForegroundColor Green
                }
                catch {
                    Write-Warning "    Failed to optimize $($file.Name): $($_.Exception.Message)"
                }
            }
        }
    }
}

Write-Host "Image optimization complete!"
