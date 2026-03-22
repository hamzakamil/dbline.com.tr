@echo off
echo 🚀 DBLine.com.tr Production Deploy
echo =================================

cd /d C:\PROJELER\dbline.com.tr

echo 📦 Backend deps...
cd backend
npm install --production
copy .env.production .env
nssm restart DBLineBackend

echo 🏗️ Frontend build...
cd ..\frontend
npm install
npm run build
xcopy /E /Y dist ..\..\inetpub\wwwroot\dbline\

echo 🔄 IIS restart...
iisreset /restart

echo ✅ Deploy tamam! https://www.dbline.com.tr
echo Test: curl http://localhost:5000/api/health

pause
