import shutil
import os
import glob

brain_dir = r"C:\Users\keert\.gemini\antigravity\brain\ca45ebb8-8ff7-475a-b092-405fa4ce24dc"
public_dir = r"f:\Rombous\frontend\public"

os.makedirs(public_dir, exist_ok=True)

banners = glob.glob(os.path.join(brain_dir, "*rhombus_hero_banner*.jpg"))
engines = glob.glob(os.path.join(brain_dir, "*rhombus_ai_engine*.jpg"))

if banners:
    shutil.copyfile(banners[0], os.path.join(public_dir, "hero_banner.jpg"))
    print("Copied hero_banner.jpg")

if engines:
    shutil.copyfile(engines[0], os.path.join(public_dir, "ai_engine.jpg"))
    print("Copied ai_engine.jpg")
