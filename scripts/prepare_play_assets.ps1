Add-Type -AssemblyName System.Drawing
$projRoot = "C:\Users\lenovo\Desktop\28-10\rashidi-market-expo"
$srcPath = Join-Path $projRoot "assets\android\play_store_feature_graphic.png"
$destPath = Join-Path $projRoot "assets\android\feature_graphic_1024x500.png"
$desktopPath = "C:\Users\lenovo\Desktop\feature_graphic_1024x500.png"

$src = [System.Drawing.Image]::FromFile($srcPath)
$dest = New-Object System.Drawing.Bitmap 1024, 500
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, 1024, 500)
$dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save($desktopPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$dest.Dispose()
$src.Dispose()

# Also copy icon 512x512 to Desktop for easy upload
Copy-Item (Join-Path $projRoot "assets\android\app_icon_rooster.png") "C:\Users\lenovo\Desktop\app_icon_512x512.png" -Force

Write-Output "SUCCESS: feature_graphic_1024x500.png and app_icon_512x512.png created on Desktop"
