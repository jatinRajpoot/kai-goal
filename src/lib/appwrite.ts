import { Client, Account, Databases, Storage } from 'appwrite';

// Lazy initialization to avoid build-time errors when env vars are not set
let clientInstance: Client | null = null;
let accountInstance: Account | null = null;
let databasesInstance: Databases | null = null;
let storageInstance: Storage | null = null;

function getClient(): Client {
    if (!clientInstance) {
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

        clientInstance = new Client();
        
        if (endpoint && projectId) {
            clientInstance
                .setEndpoint(endpoint)
                .setProject(projectId);
        }
    }
    return clientInstance;
}

// Export functions that lazily create instances
function getAccount(): Account {
    if (!accountInstance) {
        accountInstance = new Account(getClient());
    }
    return accountInstance;
}

function getDatabases(): Databases {
    if (!databasesInstance) {
        databasesInstance = new Databases(getClient());
    }
    return databasesInstance;
}

function getStorage(): Storage {
    if (!storageInstance) {
        storageInstance = new Storage(getClient());
    }
    return storageInstance;
}

// For backward compatibility - these are proxies that lazily initialize
export const databases = new Proxy({} as Databases, {
    get(_, prop) {
        const db = getDatabases();
        const value = db[prop as keyof Databases];
        if (typeof value === 'function') {
            return value.bind(db);
        }
        return value;
    }
});

export const appwriteStorage = new Proxy({} as Storage, {
    get(_, prop) {
        const storage = getStorage();
        const value = storage[prop as keyof Storage];
        if (typeof value === 'function') {
            return value.bind(storage);
        }
        return value;
    }
});

// Account proxy
export const account = new Proxy({} as Account, {
    get(_, prop) {
        const acc = getAccount();
        const value = acc[prop as keyof Account];
        if (typeof value === 'function') {
            return value.bind(acc);
        }
        return value;
    }
});

export const client = new Proxy({} as Client, {
    get(_, prop) {
        const c = getClient();
        const value = c[prop as keyof Client];
        if (typeof value === 'function') {
            return value.bind(c);
        }
        return value;
    }
});

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
