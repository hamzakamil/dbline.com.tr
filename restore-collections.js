const fs = require('fs');
const { MongoClient } = require('mongodb');

const restoreDB = async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  
  const db = client.db('dbline');
  
  const backupDir = process.argv[2] || 'backup-2024-12-25';  // node restore.js backup-folder
  
  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const collectionName = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(`${backupDir}/${file}`));
    
    await db.collection(collectionName).deleteMany({});
    if (data.length > 0) {
      await db.collection(collectionName).insertMany(data);
    }
    
    console.log(`✅ ${collectionName}: ${data.length} kayıt geri yüklendi`);
  }
  
  console.log('💾 Restore tamam!');
  await client.close();
};

restoreDB().catch(console.error);
