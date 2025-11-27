import { Client, Account, Databases, Storage } from 'appwrite';

export const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

console.log('Appwrite Config:', {
    endpoint,
    projectId,
    dbId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
});

client
    .setEndpoint(endpoint!)
    .setProject(projectId!);

export const account = new Account(client);
export const databases = new Databases(client);
export const appwriteStorage = new Storage(client);
