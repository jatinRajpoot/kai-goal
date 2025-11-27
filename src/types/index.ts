export interface Goal {
    $id: string;
    title: string;
    description?: string;
    deadline?: string;
    userId: string;
}

export interface Phase {
    $id: string;
    title: string;
    goalId: string;
    order: number;
    isCompleted: boolean;
}

export interface Task {
    $id: string;
    title: string;
    isCompleted: boolean;
    dueDate: string;
    phaseId?: string;
    goalId?: string;
    userId: string;
}

export interface Habit {
    $id: string;
    title: string;
    streak: number; // Calculated field, might not be in DB directly if we compute it
    completedDates: string[]; // Array of ISO date strings
    userId: string;
}

export interface Resource {
    $id: string;
    title: string;
    fileId: string;
    bucketId: string;
    userId: string;
}

export interface InboxItem {
    $id: string;
    content: string;
    userId: string;
    isProcessed: boolean;
}
