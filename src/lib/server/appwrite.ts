import { Client, Databases, Query } from 'node-appwrite';

const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

if (!endpoint || !projectId || !apiKey || !databaseId) {
    throw new Error('Missing Appwrite configuration');
}

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

export const databases = new Databases(client);
export const DATABASE_ID = databaseId;

export async function validateApiKey(key: string): Promise<string | null> {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
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
