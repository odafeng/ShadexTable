import zipfile, datetime, os

today = "2025-08-10"
zip_name = f"snapshot_{today}.zip"

paths = [
    "docs/ARCHITECTURE.md",
    "docs/API_SURFACE.md",
    "docs/DEPENDENCIES.md",
    "docs/CODEMAP.txt",
    ".cursor/rules",
]

with zipfile.ZipFile(zip_name, "w", zipfile.ZIP_DEFLATED) as z:
    for p in paths:
        if os.path.exists(p):
            z.write(p, p)
print(f"Built {zip_name}")
