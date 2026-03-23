const fs = require('fs');
const { MongoClient } = require('mongoose/node_modules/mongodb');

const backupDB = async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  
  const db = client.db('dbline');
  const collections = await db.listCollections().toArray();
  
  const timestamp = new Date().toISOString().slice(0,10);
  const backupDir = `backup-${timestamp}`;
  
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  
  for (const coll of collections) {
    const collection = db.collection(coll.name);
    const data = await collection.find({}).toArray();
    
    fs.writeFileSync(
      `${backupDir}/${coll.name}.json`,
      JSON.stringify(data, null, 2)
    );
    
    console.log(`✅ ${coll.name}: ${data.length} kayıt`);
  }
  
  console.log(`\n💾 Yedek tamam: ${backupDir}/`);
  console.log('Restore: node restore.js');
  
  await client.close();
};

backupDB().catch(console.error);

