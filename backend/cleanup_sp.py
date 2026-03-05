import os
import shutil
import glob
import sys

sp = os.path.join('venv', 'lib', 'site-packages')
patterns = ['torch*', 'transformers*', 'PIL*', 'Pillow*']

print(f"Starting wipe in: {sp}")

for p in patterns:
    matches = glob.glob(os.path.join(sp, p))
    for m in matches:
        try:
            if os.path.isdir(m):
                shutil.rmtree(m)
                print(f"Deleted directory: {m}")
            else:
                os.remove(m)
                print(f"Deleted file: {m}")
        except Exception as e:
            print(f"FAILED to delete {m}: {e}")

print("Wipe operation finished.")
