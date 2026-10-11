#!/usr/bin/env python3
"""
Model Setup Script for Karudi and Ganga AI
Downloads offline neural models into models/
No third-party API or SaaS needed. Runs completely offline once downloaded.
"""

import os
import sys
import urllib.request

BASE_MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")

KARUDI_URL = "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf"
KARUDI_DIR = os.path.join(BASE_MODELS_DIR, "karudi")
KARUDI_FILE = os.path.join(KARUDI_DIR, "karudi-instruct-q4_k_m.gguf")

GANGA_URL = "https://huggingface.co/adityajindal-edra/birefnet-local/resolve/main/birefnet-general-lite.onnx"
GANGA_FILE = os.path.join(BASE_MODELS_DIR, "ganga-core.onnx")

def _download_with_progress(url: str, dest_path: str, label: str):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    tmp_path = dest_path + ".tmp"
    print(f"Downloading {label} to: {dest_path}...")
    def report_hook(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            percent = (downloaded / total_size) * 100
            sys.stdout.write(f"\rDownloading {label}: {percent:.1f}% ({downloaded / 1024 / 1024:.1f}MB / {total_size / 1024 / 1024:.1f}MB)")
            sys.stdout.flush()

    try:
        urllib.request.urlretrieve(url, tmp_path, report_hook)
        print()
        if os.path.exists(dest_path):
            os.remove(dest_path)
        os.rename(tmp_path, dest_path)
        print(f"[OK] {label} successfully downloaded: {os.path.getsize(dest_path) / 1024 / 1024:.1f} MB")
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass

def download_karudi():
    if os.path.exists(KARUDI_FILE) and os.path.getsize(KARUDI_FILE) > 500_000_000:
        print(f"[OK] Karudi model already installed at: {KARUDI_FILE} ({os.path.getsize(KARUDI_FILE) / 1024 / 1024:.1f} MB)")
        return
    _download_with_progress(KARUDI_URL, KARUDI_FILE, "Karudi 1.0 Prime")

def download_ganga():
    if os.path.exists(GANGA_FILE) and os.path.getsize(GANGA_FILE) > 50_000_000:
        print(f"[OK] Ganga AI core model already installed at: {GANGA_FILE} ({os.path.getsize(GANGA_FILE) / 1024 / 1024:.1f} MB)")
        return
    _download_with_progress(GANGA_URL, GANGA_FILE, "Ganga AI Core (ONNX)")

def main():
    args = sys.argv[1:]
    if "--ganga" in args:
        download_ganga()
    elif "--karudi" in args:
        download_karudi()
    else:
        # Default: check/install both
        download_ganga()
        download_karudi()

if __name__ == "__main__":
    main()
