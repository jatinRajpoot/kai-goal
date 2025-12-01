import { Client, Databases, Query } from 'node-appwrite';

let client: Client | null = null;
let databases: Databases | null = null;
let DATABASE_ID: string | null = null;

// Lazily initialize the client to avoid build-time errors when env vars are not set
function getClient(): Client {
    if (!client) {
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
        const apiKey = process.env.APPWRITE_API;
        
        if (!endpoint || !projectId || !apiKey) {
            throw new Error('Missing Appwrite configuration');
        }
        
        client = new Client();
        client
            .setEndpoint(endpoint)
            .setProject(projectId)
            .setKey(apiKey);
    }
    return client;
}

function getDatabases(): Databases {
    if (!databases) {
        databases = new Databases(getClient());
    }
    return databases;
}

function getDatabaseId(): string {
    if (!DATABASE_ID) {
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
        if (!databaseId) {
            throw new Error('Missing database ID configuration');
        }
        DATABASE_ID = databaseId;
    }
    return DATABASE_ID;
}

export { getDatabases as databases, getDatabaseId as DATABASE_ID };

export async function validateApiKey(key: string): Promise<string | null> {
    try {
        const db = getDatabases();
        const dbId = getDatabaseId();
        
        const response = await db.listDocuments(
            dbId,
            'api_keys',
            [Query.equal('key', key)]
        );

        if (response.documents.length > 0) {
            return response.documents[0].userId;
        }
        return null;
    } catch (error) {
        console.error('Error validating API key:', error);
        return null;
    }
}
