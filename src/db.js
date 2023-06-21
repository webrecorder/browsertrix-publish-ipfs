import { MongoClient } from "mongodb";
import UUID from "uuid-mongodb";

function getDbUrl() {
  if (process.env.MONGO_DB_URL) {
    return process.env.MONGO_DB_URL;
  }

  const mongoUser = encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME);
  const mongoPass = encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD);
  const mongoHost = process.env.MONGO_HOST;

  return `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:27017`;
}

async function initDB(dbName) {
  const client = new MongoClient(getDbUrl());

  await client.connect();
  const db = client.db(dbName);

  return db;
}

export async function updateOrgIPFSUrl(oid, cid) {
  if (!process.env.MONGO_DB_URL && !process.env.MONGO_INITDB_ROOT_USERNAME) {
    return;
  }

  const db = await initDB("browsertrixcloud");

  const coll = db.collection("organizations");

  oid = UUID.from(oid);

  await coll.updateOne({"_id": oid}, {"$set": {"publishedIPFS": cid.toString()}});
}
