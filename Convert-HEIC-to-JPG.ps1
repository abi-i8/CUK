
add-type -assemblyname PresentationCore

$sourcePaths = @("Events", "Highlights")

foreach ($path in $sourcePaths) {
    if (-not (Test-Path $path)) { continue }
    
    Write-Host "Processing HEICs in: $path" -ForegroundColor Cyan
    $files = Get-ChildItem -Path $path -Include *.heic -Recurse -File
    
    foreach ($file in $files) {
        $jpgPath = Join-Path $file.DirectoryName ($file.BaseName + ".jpg")
        
        # Avoid overwriting if a .jpg with same name already exists (unless it's a proxy)
        if (Test-Path $jpgPath) {
            Write-Host "    Found existing JPG for $($file.Name), skipping conversion..." -ForegroundColor Gray
            continue
        }

        Write-Host "    Converting $($file.Name) to JPG..." -ForegroundColor Yellow
        
        try {
            $uri = [System.Uri]::new($file.FullName)
            $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create($uri, [System.Windows.Media.Imaging.BitmapCreateOptions]::None, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
            $frame = $decoder.Frames[0]
            
            $encoder = [System.Windows.Media.Imaging.JpegBitmapEncoder]::new()
            $encoder.QualityLevel = 95 # High quality for the "source" conversion
            $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($frame))
            
            $stream = [System.IO.File]::OpenWrite($jpgPath)
            $encoder.Save($stream)
            $stream.Close()
            
            Write-Host "    Success! Created $($file.BaseName).jpg" -ForegroundColor Green
            
            # Remove the original HEIC
            Remove-Item $file.FullName
            Write-Host "    Removed original $($file.Name)" -ForegroundColor Gray
        }
        catch {
            Write-Warning "    Failed to convert $($file.Name): $($_.Exception.Message)"
        }
    }
}

Write-Host "Conversion complete!"
