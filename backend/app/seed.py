"""
Create demo users, villages and system settings.

Run from backend folder:

python -m app.seed
"""

from app.core.security import hash_password
from app.db.models import SystemSetting, User, Village
from app.db.session import Base, SessionLocal, engine


DEMO_PASSWORDS = {
    "admin": "Admin@123",
    "authority": "Authority@123",
    "chw": "Chw@123",
}


def seed():

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:

        # ====================================================
        # VILLAGES
        # ====================================================

        village_names = [
            (
                "Rampur",
                "North Region",
                "Demo District",
                "Odisha",
            ),
            (
                "Lakshmipur",
                "North Region",
                "Demo District",
                "Odisha",
            ),
            (
                "Shantipur",
                "South Region",
                "Demo District",
                "Odisha",
            ),
        ]

        villages = {}

        for (
            name,
            region,
            district,
            state,
        ) in village_names:

            village = (
                db.query(Village)
                .filter(
                    Village.name == name
                )
                .first()
            )

            if not village:

                village = Village(
                    name=name,
                    region=region,
                    district=district,
                    state=state,
                )

                db.add(village)
                db.flush()

            villages[name] = village

        # ====================================================
        # USERS
        # ====================================================

        demo_users = [
            {
                "email": "admin@aarogya.app",
                "full_name": "Aarogya Admin",
                "role": "admin",
                "village": None,
                "region": "All Regions",
                "password": DEMO_PASSWORDS["admin"],
            },
            {
                "email": "authority@aarogya.app",
                "full_name": "District Health Authority",
                "role": "authority",
                "village": None,
                "region": "North Region",
                "password": DEMO_PASSWORDS["authority"],
            },
            {
                "email": "chw@aarogya.app",
                "full_name": "Community Health Worker",
                "role": "chw",
                "village": villages["Rampur"],
                "region": "North Region",
                "password": DEMO_PASSWORDS["chw"],
            },
        ]

        for item in demo_users:

            existing = (
                db.query(User)
                .filter(
                    User.email == item["email"]
                )
                .first()
            )

            if existing:
                continue

            user = User(
                email=item["email"],
                password_hash=hash_password(
                    item["password"]
                ),
                full_name=item["full_name"],
                role=item["role"],
                village_id=(
                    item["village"].id
                    if item["village"]
                    else None
                ),
                region=item["region"],
                is_active=True,
            )

            db.add(user)

        # ====================================================
        # SETTINGS
        # ====================================================

        default_settings = {
            "cluster_threshold": "3",
            "window_hours": "24",
            "notifications_enabled": "true",
        }

        for key, value in default_settings.items():

            existing = (
                db.query(SystemSetting)
                .filter(
                    SystemSetting.setting_key == key
                )
                .first()
            )

            if not existing:

                db.add(
                    SystemSetting(
                        setting_key=key,
                        setting_value=value,
                    )
                )

        db.commit()

        print("")
        print("==========================================")
        print(" Aarogya database seeded successfully")
        print("==========================================")
        print("")
        print("Demo accounts:")
        print("")
        print("ADMIN")
        print("Email: admin@aarogya.app")
        print("Password: Admin@123")
        print("")
        print("AUTHORITY")
        print("Email: authority@aarogya.app")
        print("Password: Authority@123")
        print("")
        print("CHW")
        print("Email: chw@aarogya.app")
        print("Password: Chw@123")
        print("")
        print("IMPORTANT:")
        print("These are demo credentials only.")
        print("Change them before production use.")
        print("")

    finally:
        db.close()


if __name__ == "__main__":
    seed()