@echo off
title GitHub Guncelleyici - GunesOS
echo Dosyalar GitHub'a gonderiliyor...

REM dist klasorunu Git takibinden kaldir
git rm -r --cached dist 2>nul

REM Tum dosyalari ekle (.gitignore kurallarina uyulur)
git add .

REM Commit ve push
git commit -m "GunesOS Guncelleme"
git push origin main

echo.
echo Islem TAMAM! Simdi GitHub Actions sekmesini kontrol et.
pause