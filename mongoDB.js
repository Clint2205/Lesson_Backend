const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const path = require('path');
const propertiesReader = require('properties-reader');

// Resolve the path to db.properties file
const propertiesPath = path.resolve(__dirname, 'conf/db.properties');

// Read properties from the file
const properties = propertiesReader(propertiesPath);

// Extract properties
const dbPrefix = properties.get('db.prefix');
const dbUsername = encodeURIComponent(properties.get('db.user'));
const dbPwd = encodeURIComponent(properties.get('db.pwd'));
const dbName = properties.get('db.dbName');
const dbUrl = properties.get('db.Url'); // Corrected the property name
const dbParams = properties.get('db.params');

// Constructing the MongoDB URI
const uri = `${dbPrefix}${dbUsername}:${dbPwd}${dbUrl}${dbParams}`;


const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}


// New method to get the database instance

module.exports = {
  connectToMongoDB,
  getClient: () => client,
  getDB: () => db,
};
