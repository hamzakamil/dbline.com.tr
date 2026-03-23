# MongoDB Yedek Alma

## Otomatik Script
```
backup-mongodb.bat
```

## Manuel (MongoDB Tools kurulu)
```
mongodump --uri="mongodb://127.0.0.1:27017/dbline" --out=backup-%date%
```

## Restore
```
mongorestore --uri="mongodb://127.0.0.1:27017" ./backup-20241225/
```

## Download Tools
https://www.mongodb.com/try/download/database-tools → Windows → Extract `C:\mongodb-tools\bin`

**Kategoriler/Menüler seed.js'ta hardcoded - yedek almaya gerek yok!**
