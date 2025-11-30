#!/usr/bin/env python3
"""
Test script for Kai Productivity Custom GPT API endpoints.
Tests all available endpoints: Goals, Phases, Tasks, and Habits.
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Optional

# Configuration
BASE_URL = "http://localhost:3000" # Replace with your actual API base URL
API_KEY = "your api key here"  # Replace with your actual API key

# Headers with API key authentication
HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}


class APITestRunner:
    """Test runner for Kai Productivity API endpoints."""
    
    def __init__(self, base_url: str, headers: dict):
        self.base_url = base_url
        self.headers = headers
        self.created_goal_id: Optional[str] = None
        self.created_phase_id: Optional[str] = None
        self.created_task_id: Optional[str] = None
        self.test_results: list = []
    
    def log_result(self, test_name: str, success: bool, message: str, response_data: dict = None):
        """Log test result."""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "response": response_data
        }
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        print(f"   Message: {message}")
        if response_data:
            print(f"   Response: {json.dumps(response_data, indent=2)[:500]}")
        print()
    
    def test_create_goal(self) -> bool:
        """Test POST /api/gpt/goals - Create a new goal."""
        print("=" * 60)
        print("Testing: Create Goal")
        print("=" * 60)
        
        deadline = (datetime.now() + timedelta(days=30)).isoformat()
        payload = {
            "title": "Test Goal - Learn Python Testing",
            "description": "A test goal created by the API test script",
            "deadline": deadline
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/gpt/goals",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 201:
                data = response.json()
                self.created_goal_id = data.get("id") or data.get("goalId") or data.get("$id")
                self.log_result(
                    "Create Goal",
                    True,
                    f"Goal created successfully with ID: {self.created_goal_id}",
                    data
                )
                return True
            else:
                self.log_result(
                    "Create Goal",
                    False,
                    f"Failed with status {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
                return False
        except Exception as e:
            self.log_result("Create Goal", False, f"Exception: {str(e)}")
            return False
    
    def test_create_phase(self) -> bool:
        """Test POST /api/gpt/goals/{goalId}/phases - Add a phase to a goal."""
        print("=" * 60)
        print("Testing: Create Phase")
        print("=" * 60)
        
        if not self.created_goal_id:
            self.log_result("Create Phase", False, "No goal ID available - skipping")
            return False
        
        payload = {
            "title": "Test Phase - Foundation",
            "order": 1
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/gpt/goals/{self.created_goal_id}/phases",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 201:
                data = response.json()
                self.created_phase_id = data.get("id") or data.get("phaseId") or data.get("$id")
                self.log_result(
                    "Create Phase",
                    True,
                    f"Phase created successfully with ID: {self.created_phase_id}",
                    data
                )
                return True
            else:
                self.log_result(
                    "Create Phase",
                    False,
                    f"Failed with status {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
                return False
        except Exception as e:
            self.log_result("Create Phase", False, f"Exception: {str(e)}")
            return False
    
    def test_create_task(self) -> bool:
        """Test POST /api/gpt/phases/{phaseId}/tasks - Add a task to a phase."""
        print("=" * 60)
        print("Testing: Create Task")
        print("=" * 60)
        
        if not self.created_phase_id:
            self.log_result("Create Task", False, "No phase ID available - skipping")
            return False
        
        due_date = (datetime.now() + timedelta(days=7)).isoformat()
        payload = {
            "title": "Test Task - Complete API testing",
            "dueDate": due_date
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/gpt/phases/{self.created_phase_id}/tasks",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 201:
                data = response.json()
                self.created_task_id = data.get("id") or data.get("taskId") or data.get("$id")
                self.log_result(
                    "Create Task",
                    True,
                    f"Task created successfully with ID: {self.created_task_id}",
                    data
                )
                return True
            else:
                self.log_result(
                    "Create Task",
                    False,
                    f"Failed with status {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
                return False
        except Exception as e:
            self.log_result("Create Task", False, f"Exception: {str(e)}")
            return False
    
    def test_update_task(self) -> bool:
        """Test PATCH /api/gpt/tasks/{taskId} - Update task status."""
        print("=" * 60)
        print("Testing: Update Task Status")
        print("=" * 60)
        
        if not self.created_task_id:
            self.log_result("Update Task", False, "No task ID available - skipping")
            return False
        
        payload = {
            "isCompleted": True
        }
        
        try:
            response = requests.patch(
                f"{self.base_url}/api/gpt/tasks/{self.created_task_id}",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Update Task",
                    True,
                    "Task marked as completed successfully",
                    data
                )
                return True
            else:
                self.log_result(
                    "Update Task",
                    False,
                    f"Failed with status {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
                return False
        except Exception as e:
            self.log_result("Update Task", False, f"Exception: {str(e)}")
            return False
    
    def test_update_habit(self, habit_id: str = None) -> bool:
        """Test PATCH /api/gpt/habits/{habitId} - Log a habit completion."""
        print("=" * 60)
        print("Testing: Update Habit (Log Completion)")
        print("=" * 60)
        
        # Use a placeholder habit ID if none provided
        # In real testing, you would need an existing habit ID
        if not habit_id:
            self.log_result(
                "Update Habit",
                False,
                "No habit ID provided - this endpoint requires an existing habit ID. "
                "Please provide a valid habit ID to test this endpoint."
            )
            return False
        
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "date": today
        }
        
        try:
            response = requests.patch(
                f"{self.base_url}/api/gpt/habits/{habit_id}",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Update Habit",
                    True,
                    f"Habit logged for date {today} successfully",
                    data
                )
                return True
            else:
                self.log_result(
                    "Update Habit",
                    False,
                    f"Failed with status {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
                return False
        except Exception as e:
            self.log_result("Update Habit", False, f"Exception: {str(e)}")
            return False
    
    def test_unauthorized_access(self) -> bool:
        """Test that API rejects requests without valid API key."""
        print("=" * 60)
        print("Testing: Unauthorized Access (No API Key)")
        print("=" * 60)
        
        headers_no_auth = {"Content-Type": "application/json"}
        payload = {"title": "Unauthorized Test"}
        
        try:
            response = requests.post(
                f"{self.base_url}/api/gpt/goals",
                headers=headers_no_auth,
                json=payload
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Unauthorized Access",
                    True,
                    "API correctly rejected request without API key (401)",
                    {"status_code": response.status_code}
                )
                return True
            else:
                self.log_result(
                    "Unauthorized Access",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code}
                )
                return False
        except Exception as e:
            self.log_result("Unauthorized Access", False, f"Exception: {str(e)}")
            return False
    
    def test_invalid_api_key(self) -> bool:
        """Test that API rejects requests with invalid API key."""
        print("=" * 60)
        print("Testing: Invalid API Key")
        print("=" * 60)
        
        headers_invalid = {
            "Content-Type": "application/json",
            "X-API-Key": "invalid_key_12345"
        }
        payload = {"title": "Invalid Key Test"}
        
        try:
            response = requests.post(
                f"{self.base_url}/api/gpt/goals",
                headers=headers_invalid,
                json=payload
            )
            
            if response.status_code == 401:
                self.log_result(
                    "Invalid API Key",
                    True,
                    "API correctly rejected request with invalid API key (401)",
                    {"status_code": response.status_code}
                )
                return True
            else:
                self.log_result(
                    "Invalid API Key",
                    False,
                    f"Expected 401, got {response.status_code}",
                    {"status_code": response.status_code}
                )
                return False
        except Exception as e:
            self.log_result("Invalid API Key", False, f"Exception: {str(e)}")
            return False
    
    def test_missing_required_fields(self) -> bool:
        """Test that API validates required fields."""
        print("=" * 60)
        print("Testing: Missing Required Fields")
        print("=" * 60)
        
        # Try to create a goal without title (required field)
        payload = {
            "description": "Missing title field"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/gpt/goals",
                headers=self.headers,
                json=payload
            )
            
            # Expect 400 Bad Request for missing required fields
            if response.status_code == 400:
                self.log_result(
                    "Missing Required Fields",
                    True,
                    "API correctly rejected request with missing required field (400)",
                    {"status_code": response.status_code}
                )
                return True
            else:
                self.log_result(
                    "Missing Required Fields",
                    False,
                    f"Expected 400, got {response.status_code}",
                    {"status_code": response.status_code}
                )
                return False
        except Exception as e:
            self.log_result("Missing Required Fields", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self, habit_id: str = None):
        """Run all API tests."""
        print("\n" + "=" * 60)
        print("KAI PRODUCTIVITY API TEST SUITE")
        print(f"Base URL: {self.base_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 60 + "\n")
        
        # Authentication tests
        self.test_unauthorized_access()
        self.test_invalid_api_key()
        
        # Validation tests
        self.test_missing_required_fields()
        
        # CRUD tests (in order of dependency)
        self.test_create_goal()
        self.test_create_phase()
        self.test_create_task()
        self.test_update_task()
        
        # Habit test (requires existing habit ID)
        if habit_id:
            self.test_update_habit(habit_id)
        else:
            print("=" * 60)
            print("SKIPPING: Update Habit Test")
            print("Reason: No habit ID provided. Pass --habit-id=<id> to test.")
            print("=" * 60 + "\n")
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary."""
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.test_results if r["success"])
        failed = sum(1 for r in self.test_results if not r["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "N/A")
        
        if failed > 0:
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        
        # Return exit code
        return 0 if failed == 0 else 1


def main():
    """Main entry point for the test script."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Kai Productivity API endpoints")
    parser.add_argument(
        "--base-url",
        default=BASE_URL,
        help=f"Base URL of the API (default: {BASE_URL})"
    )
    parser.add_argument(
        "--api-key",
        default=API_KEY,
        help="API key for authentication"
    )
    parser.add_argument(
        "--habit-id",
        default=None,
        help="Habit ID to test the update habit endpoint"
    )
    parser.add_argument(
        "--test",
        choices=["all", "goal", "phase", "task", "habit", "auth"],
        default="all",
        help="Specific test to run (default: all)"
    )
    
    args = parser.parse_args()
    
    # Update headers with provided API key
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": args.api_key
    }
    
    runner = APITestRunner(args.base_url, headers)
    
    if args.test == "all":
        exit_code = runner.run_all_tests(habit_id=args.habit_id)
    elif args.test == "goal":
        runner.test_create_goal()
        exit_code = runner.print_summary()
    elif args.test == "phase":
        runner.test_create_goal()
        runner.test_create_phase()
        exit_code = runner.print_summary()
    elif args.test == "task":
        runner.test_create_goal()
        runner.test_create_phase()
        runner.test_create_task()
        runner.test_update_task()
        exit_code = runner.print_summary()
    elif args.test == "habit":
        if args.habit_id:
            runner.test_update_habit(args.habit_id)
        else:
            print("Error: --habit-id is required for habit test")
            exit_code = 1
        exit_code = runner.print_summary()
    elif args.test == "auth":
        runner.test_unauthorized_access()
        runner.test_invalid_api_key()
        exit_code = runner.print_summary()
    
    exit(exit_code)


if __name__ == "__main__":
    main()
