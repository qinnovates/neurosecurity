import shutil
from pathlib import Path

def sync_data():
    source = Path("shared/qtara-registrar.json")
    target_dir = Path("packaging/qtara/src/qtara/data")
    target = target_dir / "qtara-registrar.json"

    if not source.exists():
        print(f"Error: Source file {source} not found.")
        return

    target_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    print(f"Successfully synced TARA data to {target}")

if __name__ == "__main__":
    sync_data()
