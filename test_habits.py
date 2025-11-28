import time
from playwright.sync_api import sync_playwright
import random
import string
import sys

def generate_random_email():
    return f"user_{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}@example.com"

def generate_random_password():
    return "password123"

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # --- User A Flow ---
        context_a = browser.new_context()
        page_a = context_a.new_page()

        print("Navigating to login page...")
        page_a.goto("http://localhost:3000/login")

        # User A Registration
        print("Registering User A...")
        user_a_email = generate_random_email()
        user_a_password = generate_random_password()

        # Toggle to Sign Up
        page_a.click("text=Sign Up")

        page_a.fill("input[type='text']", "User A")
        page_a.fill("input[type='email']", user_a_email)
        page_a.fill("input[type='password']", user_a_password)

        page_a.click("button[type='submit']")

        # Wait for redirect to dashboard
        print("Waiting for redirection to dashboard...")
        page_a.wait_for_url("http://localhost:3000/")

        # Navigate to Habits
        print("Navigating to Habits page...")
        page_a.click("text=Habits")

        # Create Habit A
        print("Creating Habit A...")
        page_a.click("text=New Habit")
        page_a.fill("input[placeholder*='Habit name']", "Habit A")
        page_a.click("text=Add")

        # Verify Habit A created
        print("Verifying Habit A exists...")
        try:
            page_a.wait_for_selector("text=Habit A", timeout=5000)
        except Exception as e:
            print("Failed to find Habit A immediately. Taking screenshot.")
            page_a.screenshot(path="fail_create_habit_a.png")
            raise e

        print("Habit A created successfully.")

        # Close User A session (simulate logout/close)
        context_a.close()

        # --- User B Flow ---
        print("\n--- Starting User B Flow ---")
        context_b = browser.new_context()
        page_b = context_b.new_page()
        page_b.goto("http://localhost:3000/login")

        print("Registering User B...")
        user_b_email = generate_random_email()
        user_b_password = generate_random_password()

        page_b.click("text=Sign Up")
        page_b.fill("input[type='text']", "User B")
        page_b.fill("input[type='email']", user_b_email)
        page_b.fill("input[type='password']", user_b_password)
        page_b.click("button[type='submit']")
        page_b.wait_for_url("http://localhost:3000/")

        print("Navigating to Habits page for User B...")
        page_b.click("text=Habits")

        # Verify Habit A is NOT visible
        print("Verifying Habit A is NOT visible...")
        time.sleep(2) # Give it a moment to load
        if page_b.is_visible("text=Habit A"):
            print("ERROR: Habit A is visible for User B!")
            page_b.screenshot(path="error_isolation_leak.png")
            exit(1)
        else:
            print("Habit A is correctly hidden.")

        # Create Habit B
        print("Creating Habit B...")
        page_b.click("text=New Habit")
        page_b.fill("input[placeholder*='Habit name']", "Habit B")
        page_b.click("text=Add")

        try:
            page_b.wait_for_selector("text=Habit B", timeout=5000)
        except:
             page_b.screenshot(path="fail_create_habit_b.png")
             raise

        print("Habit B created successfully.")
        context_b.close()

        # --- User A Return Flow ---
        print("\n--- Returning to User A ---")
        context_a_return = browser.new_context()
        page_a_return = context_a_return.new_page()
        page_a_return.goto("http://localhost:3000/login")

        # Ensure we are on login page (Sign In mode)
        # Check if we need to toggle. Default might be Sign In or remembered state?
        # Since it's a new context, it should be default state.
        # But we don't know the default state of the component (it defaults to isSignUp=false in code).

        print("Logging in User A again...")
        page_a_return.fill("input[type='email']", user_a_email)
        page_a_return.fill("input[type='password']", user_a_password)
        page_a_return.click("button[type='submit']")
        page_a_return.wait_for_url("http://localhost:3000/")

        print("Navigating to Habits page...")
        page_a_return.click("text=Habits")

        # Verify A visible, B not visible
        print("Verifying User A sees Habit A but not Habit B...")

        # Wait a bit for data to fetch
        try:
            page_a_return.wait_for_selector("text=Habit A", timeout=10000)
        except Exception as e:
             print("ERROR: Habit A is missing for User A! Taking screenshot.")
             page_a_return.screenshot(path="error_missing_habit_a.png")
             # Print page content for debugging
             # print(page_a_return.content())
             exit(1)

        if page_a_return.is_visible("text=Habit B"):
             print("ERROR: Habit B is visible for User A!")
             page_a_return.screenshot(path="error_leak_habit_b.png")
             exit(1)

        print("SUCCESS: Isolation and persistence verified.")
        page_a_return.screenshot(path="final_success.png")

        browser.close()

if __name__ == "__main__":
    run_test()
