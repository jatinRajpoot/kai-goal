import { Client, Account, Databases, Storage } from 'appwrite';

export const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
    console.error('Missing Appwrite configuration. Please check your .env file.');
}

console.log('Appwrite Config:', {
    endpoint,
    projectId,
    dbId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
});

if (endpoint && projectId) {
    client
        .setEndpoint(endpoint)
        .setProject(projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const appwriteStorage = new Storage(client);
