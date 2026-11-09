Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\lenovo\.gemini\antigravity\brain\4dd9a383-7032-4d43-93e7-a6e79a2d5153\.user_uploaded\media_1793285938321_3749f237.png'
$src = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.Clear([System.Drawing.Color]::FromArgb(8, 26, 58))
$g.DrawImage($src, 0, 0, 1024, 1024)
$g.Dispose()
$src.Dispose()
$bmp.Save('assets\ios_icon_1024x1024.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host 'Created 1024x1024 solid iOS icon!'
