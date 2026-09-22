@echo off
title BITTS Coffee Local Server
color 0A
echo ========================================================
echo            BITTS COFFEE - LOCAL SERVER
echo ========================================================
echo.
cd /d "%~dp0"
echo Menyalakan server...
echo.
echo  [+] Web Utama : http://localhost:3000
echo  [+] CMS Admin : http://localhost:3000/admin
echo.
echo --------------------------------------------------------
echo CATATAN:
echo - Jangan tutup jendela hitam ini selama Anda menggunakan web.
echo - Untuk mematikan server: Tekan Ctrl + C
echo --------------------------------------------------------
echo.
node serve.js
pause
