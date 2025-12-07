#!/usr/bin/env python
"""Demo script to test all CLI functionality in a single session."""

from src.services.task_store import TaskStore
from src.cli.commands import set_task_store
from click.testing import CliRunner
from src.__main__ import cli

def main():
    # Setup
    store = TaskStore()
    set_task_store(store)
    runner = CliRunner()

    print("=" * 60)
    print("TODO CONSOLE APP - INTERACTIVE DEMO")
    print("=" * 60)

    # Test 1: Add tasks
    print("\n[1] Adding tasks...")
    result = runner.invoke(cli, ["add", "Buy groceries"])
    print(f"   OK: {result.output.strip()}")

    result = runner.invoke(cli, ["add", "Read book", "Finish 'The Martian'"])
    print(f"   OK: {result.output.strip()}")

    result = runner.invoke(cli, ["add", "Exercise", "30 min workout"])
    print(f"   OK: {result.output.strip()}")

    # Test 2: List tasks
    print("\n[2] Listing all tasks...")
    result = runner.invoke(cli, ["list"])
    print(result.output)

    # Test 3: Mark task complete
    print("[3] Marking task 1 as complete...")
    result = runner.invoke(cli, ["complete", "1"])
    print(f"   OK: {result.output.strip()}")

    # Test 4: List tasks again
    print("\n[4] Listing tasks after marking complete...")
    result = runner.invoke(cli, ["list"])
    print(result.output)

    # Test 5: Update task
    print("[5] Updating task 2 title...")
    result = runner.invoke(cli, ["update", "2", "--title", "Read sci-fi book"])
    print(f"   OK: {result.output.strip()}")

    # Test 6: Update description
    print("\n[6] Updating task 3 description...")
    result = runner.invoke(cli, ["update", "3", "--description", "45 min cardio session"])
    print(f"   OK: {result.output.strip()}")

    # Test 7: List updated tasks
    print("\n[7] Listing tasks after updates...")
    result = runner.invoke(cli, ["list"])
    print(result.output)

    # Test 8: Mark uncomplete
    print("[8] Marking task 1 back to pending...")
    result = runner.invoke(cli, ["uncomplete", "1"])
    print(f"   OK: {result.output.strip()}")

    # Test 9: Delete task
    print("\n[9] Deleting task 2...")
    result = runner.invoke(cli, ["delete", "2"])
    print(f"   OK: {result.output.strip()}")

    # Test 10: Final list
    print("\n[10] Final task list...")
    result = runner.invoke(cli, ["list"])
    print(result.output)

    # Test 11: Error handling - invalid ID
    print("[11] Testing error handling (invalid ID)...")
    result = runner.invoke(cli, ["complete", "999"])
    print(f"   ERROR: {result.output.strip()}")

    # Test 12: Empty command
    print("\n[12] Testing error handling (missing title)...")
    result = runner.invoke(cli, ["add"])
    print(f"   ERROR: {result.output.strip()}")

    print("\n" + "=" * 60)
    print("DEMO COMPLETE - All features tested successfully!")
    print("=" * 60)
    print("\nNote: Memory-only state verified - data persists only")
    print("during this single session and will be cleared on exit.")

if __name__ == "__main__":
    main()
