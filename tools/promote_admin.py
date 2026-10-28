"""Promote an existing BossUp account using backend administrator credentials."""

import argparse
import sys
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "backend" / ".env")
sys.path.insert(0, str(ROOT / "backend"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "email", help="Email of an account already created through BossUp signup"
    )
    args = parser.parse_args()
    from app.core.firebase import initialize_firebase, users_collection
    from firebase_admin import auth

    initialize_firebase()
    user = auth.get_user_by_email(args.email)
    profile = users_collection().document(user.uid)
    if not profile.get().exists:
        raise SystemExit("Create this account through BossUp signup first.")
    profile.update({"role": "ADMIN"})
    print("Administrator role assigned. Sign in with the existing account password.")


if __name__ == "__main__":
    main()
