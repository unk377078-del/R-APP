Add-Type -AssemblyName System.Drawing

function Save-HighQualityJpeg($srcPath, $dstPath, $targetW, $targetH, $quality = 92) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::White)
    $g.DrawImage($src, 0, 0, $targetW, $targetH)
    $g.Dispose()
    $src.Dispose()
    
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq 'JPEG' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
    $bmp.Save($dstPath, $encoder, $encoderParams)
    $bmp.Dispose()
    Write-Host "Created JPEG: $dstPath ($targetW x $targetH, Quality: $quality)"
}

$bannerSrc = 'C:\Users\lenovo\.gemini\antigravity\brain\4dd9a383-7032-4d43-93e7-a6e79a2d5153\.user_uploaded\media_1793286697538_24e143f9.png'

# Google Play accepts JPEG or 32-bit PNG for Feature Graphic up to 1024 KB
Save-HighQualityJpeg $bannerSrc 'google_play_feature_graphic_1024x500.jpg' 1024 500 92
