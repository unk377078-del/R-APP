Add-Type -AssemblyName System.Drawing

function Resize-Image($srcPath, $dstPath, $targetW, $targetH) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $targetW, $targetH)
    $g.Dispose()
    $src.Dispose()
    $bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $dstPath ($targetW x $targetH)"
}

$iconSrc = 'C:\Users\lenovo\.gemini\antigravity\brain\4dd9a383-7032-4d43-93e7-a6e79a2d5153\.user_uploaded\media_1793285938321_3749f237.png'
$bannerSrc = 'C:\Users\lenovo\.gemini\antigravity\brain\4dd9a383-7032-4d43-93e7-a6e79a2d5153\.user_uploaded\media_1793286697538_24e143f9.png'
$posterSrc = 'C:\Users\lenovo\.gemini\antigravity\brain\4dd9a383-7032-4d43-93e7-a6e79a2d5153\.user_uploaded\media_1793286697613_93fa52df.jpg'

Resize-Image $iconSrc 'assets\android\app_icon_rooster.png' 512 512
Resize-Image $iconSrc 'assets\android\logo_alrashidi.png' 512 512
Resize-Image $iconSrc 'google_play_icon_512x512.png' 512 512

Resize-Image $bannerSrc 'google_play_feature_graphic_1024x500.png' 1024 500
Resize-Image $bannerSrc 'assets\android\play_store_feature_graphic.png' 1024 512

Copy-Item -Path $posterSrc -Destination 'assets\android\promo_chickens_poster.jpg' -Force
Write-Host 'SUCCESS: All store assets ready!'
