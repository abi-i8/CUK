$sourcePaths = @("Events", "Highlights")
$ffmpegPath = "C:\Users\USER\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe"
$rootPath = $PSScriptRoot

if (-not (Test-Path $ffmpegPath)) {
    Write-Warning "FFmpeg binary not found at hardcoded path!"
    exit
}
Write-Host "Using FFmpeg at: $ffmpegPath" -ForegroundColor Green

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
            if (@(".mp4", ".mov").Contains($ext) -and $file.Name -notlike "*_proxy*") {
                
                # Determine Target Proxy Path
                $relativePath = $file.FullName.Replace("$rootPath\", "")
                $targetBase = "$path (Proxy)"
                $subPath = $relativePath.Substring($path.Length).TrimStart("\")
                $proxyDir = Join-Path (Join-Path $rootPath $targetBase) ([System.IO.Path]::GetDirectoryName($subPath))
                
                $proxyName = $file.BaseName + "_proxy.mp4"
                $proxyPath = Join-Path $proxyDir $proxyName
                
                if (Test-Path $proxyPath) { 
                    Write-Host "    Proxy already exists for $($file.Name)" -ForegroundColor Gray
                    continue 
                }
                
                # Ensure target directory exists
                if (!(Test-Path $proxyDir)) { New-Item -ItemType Directory -Path $proxyDir -Force }

                Write-Host "    Compressing $($file.Name)..." -ForegroundColor Yellow
                
                try {
                    $ffmpegArgs = "-y -i `"$($file.FullName)`" -vf scale=-2:720 -c:v libx264 -crf 30 -preset superfast -an `"$proxyPath`""
                    Start-Process -FilePath $ffmpegPath -ArgumentList $ffmpegArgs -Wait -NoNewWindow
                    
                    if (Test-Path $proxyPath) {
                        $newSize = (Get-Item $proxyPath).Length / 1MB
                        Write-Host "    Created proxy in (Proxy) folder: $proxyName ($([math]::Round($newSize,2)) MB)" -ForegroundColor Green
                    }
                }
                catch {
                    Write-Error "    Failed to compress $($file.Name): $($_.Exception.Message)"
                }
            }
        }
    }
}

Write-Host "Video Optimization Complete!"
