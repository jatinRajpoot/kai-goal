import { Client, Account, Databases, Storage } from 'appwrite';

export const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

if (!endpoint) {
    throw new Error('Missing NEXT_PUBLIC_APPWRITE_ENDPOINT');
}

if (!projectId) {
    throw new Error('Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID');
}

if (!databaseId) {
    throw new Error('Missing NEXT_PUBLIC_APPWRITE_DATABASE_ID');
}

if (process.env.NODE_ENV === 'development') {
    console.log('Appwrite Config:', {
        endpoint,
        projectId,
        dbId: databaseId
    });
}

client
    .setEndpoint(endpoint!)
    .setProject(projectId!);

export const DATABASE_ID = databaseId!;
export const account = new Account(client);
export const databases = new Databases(client);
export const appwriteStorage = new Storage(client);
