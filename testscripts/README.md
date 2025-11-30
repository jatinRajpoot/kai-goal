# Kai Productivity API Test Scripts

This folder contains Python test scripts for testing the Kai Productivity Custom GPT API endpoints.

## Requirements

- Python 3.7+
- `requests` library

Install dependencies:
```bash
pip install requests
```

## Usage

### Run all tests
```bash
python test_api.py
```

### Run with custom options
```bash
# Specify a different base URL
python test_api.py --base-url http://localhost:3000

# Use a different API key
python test_api.py --api-key your_api_key_here

# Test the habit endpoint (requires an existing habit ID)
python test_api.py --habit-id your_habit_id

# Run specific tests
python test_api.py --test goal   # Test only goal creation
python test_api.py --test phase  # Test goal + phase creation
python test_api.py --test task   # Test goal + phase + task creation/update
python test_api.py --test habit  # Test habit update (requires --habit-id)
python test_api.py --test auth   # Test authentication only
```

## API Endpoints Tested

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/gpt/goals` | POST | Create a new goal |
| `/api/gpt/goals/{goalId}/phases` | POST | Add a phase to a goal |
| `/api/gpt/phases/{phaseId}/tasks` | POST | Add a task to a phase |
| `/api/gpt/tasks/{taskId}` | PATCH | Update task status |
| `/api/gpt/habits/{habitId}` | PATCH | Log a habit completion |

## Test Cases

1. **Authentication Tests**
   - Unauthorized access (no API key)
   - Invalid API key

2. **Validation Tests**
   - Missing required fields

3. **CRUD Tests**
   - Create goal
   - Create phase (depends on goal)
   - Create task (depends on phase)
   - Update task status

4. **Habit Tests**
   - Update habit (log completion for a date)

## Configuration

Default configuration is set in `test_api.py`:
- Base URL: `http://localhost:3000`
- API Key: Configured in the script

You can override these using command-line arguments.
