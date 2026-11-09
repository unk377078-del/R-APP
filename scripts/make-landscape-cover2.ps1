Add-Type -AssemblyName System.Drawing

$srcPath = "C:/Users/lenovo/.gemini/antigravity/brain/4dd9a383-7032-4d43-93e7-a6e79a2d5153/.user_uploaded/media_1793286697613_93fa52df.jpg"
$dstPath = "assets/android/hero_chickens_family_banner.jpg"

$src = [System.Drawing.Image]::FromFile($srcPath)
$targetW = 1024
$targetH = 512

$bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Sky blue background sample from poster top sky
$skyColor = [System.Drawing.Color]::FromArgb(30, 140, 230)
$brush = New-Object System.Drawing.SolidBrush($skyColor)
$g.FillRectangle($brush, 0, 0, $targetW, $targetH)
$brush.Dispose()

# Option A: Crop from top-center of poster so the rooster mascot, Toyour Al-Rashidi, and top chickens are beautifully visible
# Poster is 768 x 1024. Ratio 2:1 -> 768 x 384
$cropW = 768
$cropH = 384
$cropX = 0
$cropY = 20  # Include the rooster mascot at top and chickens

$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$dstRect = New-Object System.Drawing.Rectangle(0, 0, $targetW, $targetH)

$g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()
$src.Dispose()

# Save high quality JPEG
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq 'JPEG' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]95)
$bmp.Save($dstPath, $encoder, $encoderParams)
$bmp.Dispose()

Write-Host "SUCCESS: Created $dstPath"
