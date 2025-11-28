import { NextResponse } from 'next/server';

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Kai Productivity Custom GPT API',
    version: '1.0.0',
    description: 'API for interacting with Kai Productivity data (Goals, Phases, Tasks, Habits).',
  },
  servers: [
    {
      url: 'https://kai-productivity.vercel.app', // Replace with dynamic URL if needed
    },
  ],
  paths: {
    '/api/gpt/goals': {
      post: {
        operationId: 'createGoal',
        summary: 'Create a new goal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  deadline: { type: 'string', format: 'date-time' },
                },
                required: ['title'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Goal created successfully',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/gpt/goals/{goalId}/phases': {
      post: {
        operationId: 'createPhase',
        summary: 'Add a phase to a goal',
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  order: { type: 'integer' },
                },
                required: ['title', 'order'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Phase created successfully',
          },
        },
      },
    },
    '/api/gpt/phases/{phaseId}/tasks': {
      post: {
        operationId: 'createTask',
        summary: 'Add a task to a phase',
        parameters: [
          {
            name: 'phaseId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  dueDate: { type: 'string', format: 'date-time' },
                },
                required: ['title'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Task created successfully',
          },
        },
      },
    },
    '/api/gpt/tasks/{taskId}': {
      patch: {
        operationId: 'updateTask',
        summary: 'Update task status',
        parameters: [
          {
            name: 'taskId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  isCompleted: { type: 'boolean' },
                },
                required: ['isCompleted'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task updated successfully',
          },
        },
      },
    },
    '/api/gpt/habits/{habitId}': {
      patch: {
        operationId: 'updateHabit',
        summary: 'Log a habit completion for a specific date',
        parameters: [
          {
            name: 'habitId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                },
                required: ['date'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Habit updated successfully',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
