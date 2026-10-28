import os
import sys
from pathlib import Path

os.environ.setdefault("JWT_SECRET_KEY", "test-only-random-secret-" + "x" * 40)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
