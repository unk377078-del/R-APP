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
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
}

$pDir = "C:\Users\lenovo\Desktop\store-screenshots"
Scale-Image (Join-Path $pDir "real_phone_home.png") (Join-Path $pDir "real_phone_1080x1920_home.png") 1080 1920
Scale-Image (Join-Path $pDir "real_phone_products.png") (Join-Path $pDir "real_phone_1080x1920_products.png") 1080 1920
Scale-Image (Join-Path $pDir "real_phone_login.png") (Join-Path $pDir "real_phone_1080x1920_login.png") 1080 1920

Write-Output "Phone real screenshots scaled to 1080x1920"
