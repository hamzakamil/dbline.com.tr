@echo off
title MongoDB Backup DBLine
color 0A
cls

echo ======================================
echo    DBLine MongoDB Yedek Alma
echo ======================================
echo.

REM MongoDB path kontrol
where mongodump >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo ❌ HATA: mongodump bulunamadi!
  echo.
  echo 1. MongoDB Database Tools indir: https://www.mongodb.com/try/download/database-tools
  echo 2. msvs-community-2022.exe ile kur ^(Community 2022^)
  echo 3. OR C:\mongodb-tools\bin\ e extract et
  echo 4. PATH ekle: %%PATH%%;C:\mongodb-tools\bin
  echo.
  pause
  exit /b 1
)

echo MongoDB Tools OK ✓
echo.
echo Backup klasoru olusturuluyor...
mkdir "backup-%date:~-4,4%%date:~-10,2%%date:~7,2%" 2>nul

echo Yedek aliniyor (dbline)...
mongodump --uri="mongodb://127.0.0.1:27017/dbline" ^
  --out="backup-%date:~-4,4%%date:~-10,2%%date:~7,2%" ^
  --quiet

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ Yedek tamam!
  echo Klasor: backup-%date:~-4,4%%date:~-10,2%%date:~7,2%/
  echo Boyut: dir "backup-%date:~-4,4%%date:~-10,2%%date:~7,2%"
  echo.
  echo ZIP icin: tar -cf dbline-backup.zip backup-*/
) else (
  echo ❌ Yedekleme basarisiz
  echo MongoDB calisiyor mu? net start MongoDB
)

echo.
echo Test: http://localhost:5000/api/health
pause
