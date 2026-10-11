"""
Ganga AI Background Removal Server (rembg-free)
Copyright (c) 2026 BG Tool. All rights reserved.

High-performance native HTTP server running Ganga AI Neural Segmentation Engine.
Enhanced with complete upload protection, decompression bomb guards, and resource limits.
"""

import sys
import json
import os
import time
import gc
import base64
import io
import threading
import concurrent.futures
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

# Ensure script directory in sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

# Import native Ganga AI Engine (Zero rembg dependency)
from ganga_engine import GangaEngine, MODEL_REGISTRY

# Set PIL Decompression Bomb Protection (Strict Max 36 Megapixels)
from PIL import Image
Image.MAX_IMAGE_PIXELS = 36_000_000

# Concurrency limits: max 3 simultaneous inference passes to conserve CPU
executor = concurrent.futures.ThreadPoolExecutor(max_workers=3)

# Rate limiting per IP: 20 requests per minute
ip_rate_limits = {}
ip_rate_lock = threading.Lock()

def check_ip_rate_limit(ip):
    now = time.time()
    with ip_rate_lock:
        if ip not in ip_rate_limits:
            ip_rate_limits[ip] = []
        ip_rate_limits[ip] = [t for t in ip_rate_limits[ip] if now - t < 60]
        if len(ip_rate_limits[ip]) >= 20:
            return False
        ip_rate_limits[ip].append(now)

        stale_ips = [k for k, v in ip_rate_limits.items() if not v]
        for stale_ip in stale_ips:
            del ip_rate_limits[stale_ip]

        return True

def validate_image_payload(raw_b64):
    if not raw_b64 or not isinstance(raw_b64, str):
        return False, "No image data provided"
    
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]
    
    # Check estimated size (max 10MB decoded, approx 14MB base64)
    if len(raw_b64) > 15 * 1024 * 1024:
        return False, "File size exceeds the 10 MB limit. Please upload a smaller file."
    
    try:
        raw_bytes = base64.b64decode(raw_b64)
    except Exception:
        return False, "Invalid Base64 encoding"
    
    if len(raw_bytes) == 0:
        return False, "Uploaded image is empty (0 bytes)."
    if len(raw_bytes) > 10 * 1024 * 1024:
        return False, "File size exceeds the 10 MB limit. Please upload a smaller file."
    
    # Magic Byte Validation: PNG, JPEG, WebP
    is_png = len(raw_bytes) >= 8 and raw_bytes[:8] == b"\x89PNG\r\n\x1a\n"
    is_jpg = len(raw_bytes) >= 3 and raw_bytes[:3] == b"\xff\xd8\xff"
    is_webp = len(raw_bytes) >= 12 and raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WEBP"
    
    # Reject executables immediately
    if len(raw_bytes) >= 2 and (raw_bytes[:2] == b"MZ" or raw_bytes[:4] == b"\x7fELF"):
        return False, "Executable files and active scripts are strictly prohibited."
    
    if not (is_png or is_jpg or is_webp):
        return False, "Unsupported image format. Please upload PNG, JPG, or WebP."
    
    try:
        bio = io.BytesIO(raw_bytes)
        with Image.open(bio) as img:
            w, h = img.size
            if w > 6000 or h > 6000:
                return False, f"Image dimensions ({w}x{h}) exceed maximum allowed 6000x6000px."
            if (w * h) > 36_000_000:
                return False, "Image pixel count exceeds the 36 Megapixel limit."
    except Exception as e:
        return False, f"Corrupted or invalid image: {e}"
        
    return True, None

def handle_ganga_request(data):
    try:
        b64_image = data.get("base64Image") or data.get("image") or ""
        valid, err = validate_image_payload(b64_image)
        if not valid:
            return {"success": False, "error": err}
        
        model = data.get("model", "ganga")
        res = GangaEngine.remove_background(b64_image, model_name=model)
        gc.collect()
        return res
    except Exception as e:
        gc.collect()
        return {"success": False, "error": "Background removal failed safely."}

class GangaRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path in ["/ping", "/api/ping"]:
            self.send_json({
                "status": "ok",
                "engine": "Ganga AI Native Engine",
                "models": list(MODEL_REGISTRY.keys()),
            })
        else:
            self.send_json({"error": "Not Found"}, status=404)

    def do_POST(self):
        ip = self.client_address[0]
        if not check_ip_rate_limit(ip):
            self.send_json({"success": False, "error": "Too many requests. Please wait a moment."}, status=429)
            return

        content_len = int(self.headers.get("Content-Length", 0))
        # Reject requests exceeding 20 MB immediately
        if content_len > 20 * 1024 * 1024:
            self.send_json({"success": False, "error": "File size exceeds the 10 MB limit. Please upload a smaller file."}, status=413)
            return

        post_data = self.rfile.read(content_len)

        try:
            data = json.loads(post_data.decode("utf-8"))
        except Exception:
            self.send_json({"success": False, "error": "Invalid JSON payload."}, status=400)
            return

        if self.path in ["/remove-base64", "/api/remove-bg"]:
            future = executor.submit(handle_ganga_request, data)
            try:
                result = future.result(timeout=60.0)
                status_code = 200 if result.get("success") else 400
                if "exceeds" in str(result.get("error", "")).lower():
                    status_code = 413
                self.send_json(result, status=status_code)
            except concurrent.futures.TimeoutError:
                self.send_json({"success": False, "error": "Ganga AI processing timed out."}, status=504)
        else:
            self.send_json({"error": "Not Found"}, status=404)

def run_server(port=5000):
    ThreadingHTTPServer.allow_reuse_address = True
    server_address = ("127.0.0.1", port)
    httpd = ThreadingHTTPServer(server_address, GangaRequestHandler)
    print(f"Ganga AI Native Engine Server running on port {port} (rembg-free)...")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()

if __name__ == "__main__":
    port = 5000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
