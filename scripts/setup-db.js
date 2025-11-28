const sdk = require('node-appwrite');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const client = new sdk.Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API;

if (!endpoint || !projectId || !apiKey) {
    console.error('Missing Appwrite configuration in .env');
    process.exit(1);
}

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const DB_NAME = 'KaiDB';
let DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';

async function setup() {
    try {
        // 1. Create Database or use existing
        console.log('Setting up Database...');
        if (DB_ID) {
            console.log(`Using existing database from env: ${DB_ID}`);
        } else {
            try {
                const db = await databases.create(sdk.ID.unique(), DB_NAME);
                DB_ID = db.$id;
                console.log(`Database created: ${DB_ID}`);
            } catch (error) {
                console.log('Database might already exist, listing databases...');
                const dbs = await databases.list();
                const existingDb = dbs.databases.find(d => d.name === DB_NAME);
                if (existingDb) {
                    DB_ID = existingDb.$id;
                    console.log(`Using existing database: ${DB_ID}`);
                } else {
                    throw error;
                }
            }
        }

        // 2. Create Collections
        const collections = [
            { name: 'Goals', id: 'goals' },
            { name: 'Phases', id: 'phases' },
            { name: 'Tasks', id: 'tasks' },
            { name: 'Habits', id: 'habits' },
            { name: 'Resources', id: 'resources' },
            { name: 'Inbox', id: 'inbox' },
            { name: 'API Keys', id: 'api_keys' },
        ];

        // Permissions: Allow any authenticated user to create, and document-level permissions for read/update/delete
        const permissions = [
            sdk.Permission.create(sdk.Role.users()),  // Any authenticated user can create
        ];

        for (const col of collections) {
            console.log(`Creating collection: ${col.name}`);
            try {
                await databases.createCollection(DB_ID, col.id, col.name, permissions, true); // documentSecurity = true
                console.log(`Collection ${col.name} created with permissions.`);
            } catch (e) {
                console.log(`Collection ${col.name} might already exist. Updating permissions...`);
                try {
                    await databases.updateCollection(DB_ID, col.id, col.name, permissions, true);
                    console.log(`Collection ${col.name} permissions updated.`);
                } catch (updateErr) {
                    console.log(`Could not update collection ${col.name}:`, updateErr.message);
                }
            }
        }

        // 3. Create Attributes

        // Goals
        console.log('Defining attributes for Goals...');
        await createAttribute(DB_ID, 'goals', 'string', 'title', 255, true);
        await createAttribute(DB_ID, 'goals', 'string', 'description', 1000, false);
        await createAttribute(DB_ID, 'goals', 'datetime', 'deadline', null, false);
        await createAttribute(DB_ID, 'goals', 'string', 'userId', 255, true);

        // Phases
        console.log('Defining attributes for Phases...');
        await createAttribute(DB_ID, 'phases', 'string', 'title', 255, true);
        await createAttribute(DB_ID, 'phases', 'string', 'goalId', 255, true); // Manual relationship for simplicity first
        await createAttribute(DB_ID, 'phases', 'integer', 'order', null, true);
        await createAttribute(DB_ID, 'phases', 'boolean', 'isCompleted', null, false, false);

        // Tasks
        console.log('Defining attributes for Tasks...');
        await createAttribute(DB_ID, 'tasks', 'string', 'title', 255, true);
        await createAttribute(DB_ID, 'tasks', 'boolean', 'isCompleted', null, false, false);
        await createAttribute(DB_ID, 'tasks', 'datetime', 'dueDate', null, false);
        await createAttribute(DB_ID, 'tasks', 'string', 'phaseId', 255, false); // Optional, can be standalone
        await createAttribute(DB_ID, 'tasks', 'string', 'goalId', 255, false); // Optional
        await createAttribute(DB_ID, 'tasks', 'string', 'userId', 255, true);

        // Habits
        console.log('Defining attributes for Habits...');
        await createAttribute(DB_ID, 'habits', 'string', 'title', 255, true);
        await createAttribute(DB_ID, 'habits', 'integer', 'streak', null, false, 0); // Integer for streak count
        await createAttribute(DB_ID, 'habits', 'integer', 'longestStreak', null, false, 0); // Integer for best streak
        // Better approach for habits: Array of strings for completed dates (ISO date string YYYY-MM-DD)
        await createAttribute(DB_ID, 'habits', 'string', 'completedDates', 20, false, null, true); // Array of strings
        await createAttribute(DB_ID, 'habits', 'string', 'userId', 255, true);

        // Resources
        console.log('Defining attributes for Resources...');
        await createAttribute(DB_ID, 'resources', 'string', 'title', 255, true);
        await createAttribute(DB_ID, 'resources', 'string', 'fileId', 255, true);
        await createAttribute(DB_ID, 'resources', 'string', 'bucketId', 255, true);
        await createAttribute(DB_ID, 'resources', 'string', 'userId', 255, true);

        // Inbox
        console.log('Defining attributes for Inbox...');
        await createAttribute(DB_ID, 'inbox', 'string', 'content', 1000, true);
        await createAttribute(DB_ID, 'inbox', 'string', 'userId', 255, true);
        await createAttribute(DB_ID, 'inbox', 'boolean', 'isProcessed', null, false, false);

        // API Keys
        console.log('Defining attributes for API Keys...');
        await createAttribute(DB_ID, 'api_keys', 'string', 'userId', 255, true);
        await createAttribute(DB_ID, 'api_keys', 'string', 'key', 255, true);
        await createAttribute(DB_ID, 'api_keys', 'datetime', 'createdAt', null, true);

        // 4. Create Indexes for queries
        console.log('Creating indexes...');
        await createIndex(DB_ID, 'goals', 'userId_idx', 'key', ['userId']);
        await createIndex(DB_ID, 'phases', 'goalId_idx', 'key', ['goalId']);
        await createIndex(DB_ID, 'tasks', 'userId_idx', 'key', ['userId']);
        await createIndex(DB_ID, 'tasks', 'userId_isCompleted_idx', 'key', ['userId', 'isCompleted']);
        await createIndex(DB_ID, 'tasks', 'goalId_idx', 'key', ['goalId']);
        await createIndex(DB_ID, 'habits', 'userId_idx', 'key', ['userId']);
        await createIndex(DB_ID, 'resources', 'userId_idx', 'key', ['userId']);
        await createIndex(DB_ID, 'inbox', 'userId_idx', 'key', ['userId']);
        await createIndex(DB_ID, 'inbox', 'userId_isProcessed_idx', 'key', ['userId', 'isProcessed']);
        await createIndex(DB_ID, 'api_keys', 'key_idx', 'unique', ['key']);
        await createIndex(DB_ID, 'api_keys', 'userId_idx', 'key', ['userId']);

        // 5. Create Storage Bucket
        console.log('Creating Storage Bucket...');
        const bucketPermissions = [
            sdk.Permission.create(sdk.Role.users()),  // Any authenticated user can upload
        ];
        try {
            await storage.createBucket('resources', 'Resources', bucketPermissions, true, true, undefined, ['jpg', 'png', 'pdf', 'doc', 'docx', 'txt']);
            console.log('Bucket created with permissions.');
        } catch (e) {
            console.log('Bucket might already exist. Updating permissions...');
            try {
                await storage.updateBucket('resources', 'Resources', bucketPermissions, true, true, undefined, ['jpg', 'png', 'pdf', 'doc', 'docx', 'txt']);
                console.log('Bucket permissions updated.');
            } catch (updateErr) {
                console.log('Could not update bucket:', updateErr.message);
            }
        }

        console.log('Setup complete!');
        console.log(`NEXT_PUBLIC_APPWRITE_DATABASE_ID=${DB_ID}`);

    } catch (error) {
        console.error('Setup failed:', error);
    }
}

async function createAttribute(dbId, collId, type, key, size, required, defaultVal, isArray = false) {
    try {
        if (type === 'string') {
            await databases.createStringAttribute(dbId, collId, key, size, required, defaultVal, isArray);
        } else if (type === 'integer') {
            await databases.createIntegerAttribute(dbId, collId, key, required, 0, 1000000, defaultVal, isArray);
        } else if (type === 'boolean') {
            await databases.createBooleanAttribute(dbId, collId, key, required, defaultVal, isArray);
        } else if (type === 'datetime') {
            await databases.createDatetimeAttribute(dbId, collId, key, required, defaultVal, isArray);
        }
        console.log(`Attribute ${key} created in ${collId}`);
        // Wait a bit for attribute to be available
        await new Promise(r => setTimeout(r, 500));
    } catch (e) {
        // console.log(`Attribute ${key} in ${collId} might already exist or error:`, e.message);
    }
}

async function createIndex(dbId, collId, indexKey, indexType, attributes) {
    try {
        await databases.createIndex(dbId, collId, indexKey, indexType, attributes);
        console.log(`Index ${indexKey} created in ${collId}`);
        await new Promise(r => setTimeout(r, 500));
    } catch (e) {
        // Index might already exist
    }
}

setup();
