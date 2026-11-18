Add-Type -AssemblyName System.Drawing

function Scale-Image ($srcPath, $destPath, $targetWidth, $targetHeight) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $dest = New-Object System.Drawing.Bitmap $targetWidth, $targetHeight
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $targetWidth, $targetHeight)
    
    # Save as PNG or high quality JPG
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 95L
    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    
    $dest.Save($destPath, $jpegCodec, $encoderParams)
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
}

$dir = "C:\Users\lenovo\Desktop\tablet-screenshots"
Scale-Image (Join-Path $dir "tablet_1_products.jpg") (Join-Path $dir "tablet_1080p_1_products.jpg") 1920 1080
Scale-Image (Join-Path $dir "tablet_2_cart.jpg") (Join-Path $dir "tablet_1080p_2_cart.jpg") 1920 1080

# Overwrite the originals so whatever the user picks is 1920x1080
Copy-Item (Join-Path $dir "tablet_1080p_1_products.jpg") (Join-Path $dir "tablet_1_products.jpg") -Force
Copy-Item (Join-Path $dir "tablet_1080p_2_cart.jpg") (Join-Path $dir "tablet_2_cart.jpg") -Force

Write-Output "Successfully upscaled tablet images to 1920x1080"
