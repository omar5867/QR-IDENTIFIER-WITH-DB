require('dotenv').config();
const mongoose = require('mongoose');

async function cleanIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("✅ Conectado a MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection('inscriptions');

    const indexes = await collection.indexes();
    console.log("📋 Índices actuales:", indexes);

    const indexesToDrop = ['guests.entryNumber_1', 'token_1'];

    for (const indexName of indexesToDrop) {
      const exists = indexes.find(idx => idx.name === indexName);
      if (exists) {
        await collection.dropIndex(indexName);
        console.log(`🗑️ Índice eliminado: ${indexName}`);
      } else {
        console.log(`ℹ️ Índice no encontrado: ${indexName}`);
      }
    }

    console.log("✅ Limpieza completada");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error durante la limpieza:", err);
  }
}

cleanIndexes();
