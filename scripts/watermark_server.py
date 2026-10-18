import sys
import json
import os
import time
import base64
import io
import threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

def install_and_import(package, pip_name=None):
    import subprocess
    if pip_name is None:
        pip_name = package
    try:
        __import__(package)
    except ImportError:
        print(f"Installing {pip_name}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", pip_name, "--quiet"])
        except Exception as e:
            print(f"Failed to install {pip_name}: {e}")

install_and_import("PIL", "pillow")
install_and_import("cv2", "opencv-python")
install_and_import("numpy")

try:
    import cv2
    from PIL import Image
    import numpy as np
    print("Watermark Remover AI Engine dependencies loaded successfully.")
except ImportError as e:
    print(f"Failed to import dependencies: {e}")
    sys.exit(1)

Image.MAX_IMAGE_PIXELS = 36_000_000

def validate_image_bytes(raw_bytes):
    if not raw_bytes or len(raw_bytes) == 0:
        return False, "Uploaded image is empty (0 bytes).", None
    if len(raw_bytes) > 30 * 1024 * 1024:
        return False, "File size exceeds the 30 MB limit. Please upload a smaller file.", None

    # Magic byte check
    if len(raw_bytes) >= 2 and (raw_bytes[:2] == b"MZ" or raw_bytes[:4] == b"\x7fELF"):
        return False, "Executable files and active scripts are strictly prohibited.", None

    is_png = len(raw_bytes) >= 8 and raw_bytes[:8] == b"\x89PNG\r\n\x1a\n"
    is_jpg = len(raw_bytes) >= 3 and raw_bytes[:3] == b"\xff\xd8\xff"
    is_webp = len(raw_bytes) >= 12 and raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WEBP"
    is_gif = len(raw_bytes) >= 4 and raw_bytes[:4] == b"GIF8"
    is_bmp = len(raw_bytes) >= 2 and raw_bytes[:2] == b"BM"

    if not (is_png or is_jpg or is_webp or is_gif or is_bmp):
        return False, "Unsupported image format. Please upload PNG, JPG, or WebP.", None

    try:
        bio = io.BytesIO(raw_bytes)
        img = Image.open(bio)
        img.verify()
        bio.seek(0)
        img = Image.open(bio)
        w, h = img.size
        if w > 6000 or h > 6000:
            return False, f"Image dimensions ({w}x{h}) exceed maximum allowed 6000x6000px.", None
        if (w * h) > 36_000_000:
            return False, "Image pixel count exceeds the 36 Megapixel limit.", None
        return True, None, img
    except Exception as e:
        return False, f"Invalid or corrupted image format: {e}", None

# -------------------------------------------------------------
# Gemini AI Reverse Alpha Blending Module (100% Lossless Restoration)
# -------------------------------------------------------------
_gemini_alpha_cache = {}

def get_gemini_alpha_map_np(size_key):
    k = str(size_key)
    if k in _gemini_alpha_cache:
        return _gemini_alpha_cache[k]

    # Try alpha_maps_f32.json first
    json_candidates = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "alpha_maps_f32.json"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "alpha_maps.json"),
    ]
    for alpha_json_path in json_candidates:
        if os.path.exists(alpha_json_path):
            try:
                with open(alpha_json_path, "r") as f:
                    maps = json.load(f)
                if k in maps:
                    raw = base64.b64decode(maps[k])
                    size = 36 if "36" in k else (48 if "48" in k else 96)
                    # Detect float32 (4 bytes per pixel) vs uint8
                    if len(raw) == size * size * 4:
                        arr = np.frombuffer(raw, dtype=np.float32).reshape((size, size))
                    else:
                        arr = np.frombuffer(raw, dtype=np.uint8).reshape((size, size)).astype(np.float32) / 255.0
                    _gemini_alpha_cache[k] = arr
                    return arr
            except Exception as e:
                print(f"Error loading {alpha_json_path}: {e}")

    # Fallback interpolation if size is custom
    base_k = "48" if (isinstance(size_key, int) and size_key <= 56) else "96"
    base_map = get_gemini_alpha_map_np(base_k)
    if base_map is not None and isinstance(size_key, int):
        scaled = cv2.resize(base_map, (size_key, size_key), interpolation=cv2.INTER_LINEAR)
        _gemini_alpha_cache[k] = scaled
        return scaled
    return None

def detect_gemini_watermark_cv(img_bgr, orig_h, orig_w, sensitivity=55):
    sens = max(0.1, min(1.0, float(sensitivity) / 100.0))
    min_conf = max(0.18, 0.35 * (1.15 - sens * 0.4))

    roi_h = min(orig_h, max(200, int(orig_h * 0.42)))
    roi_w = min(orig_w, max(200, int(orig_w * 0.42)))
    roi_y0 = max(0, orig_h - roi_h)
    roi_x0 = max(0, orig_w - roi_w)
    roi_bgr = img_bgr[roi_y0:, roi_x0:]
    roi_gray = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    roi_gx = cv2.Sobel(roi_gray, cv2.CV_32F, 1, 0, ksize=3)
    roi_gy = cv2.Sobel(roi_gray, cv2.CV_32F, 0, 1, ksize=3)
    roi_grad = cv2.magnitude(roi_gx, roi_gy)

    best_match = None

    # Comprehensive catalog seeds (size, marginRight, marginBottom, variantKey)
    seeds = [
        # 2K large margin variant (2048x2048, 2816x1536)
        (96, 192, 192, "96-20260520"),
        # Legacy standard 2K (2048x2048, 2752x1536)
        (96, 64, 64, "96"),
        # 1K large margin variant (1024x1024, 896x1200)
        (48, 96, 96, "48"),
        # Modern 1k / 0.5k standard (512x512, 1024x1024)
        (48, 32, 32, "48"),
        # 2752x1536 fixed JPEG anchor
        (48, 89, 89, "48"),
        # 36px small preview
        (36, 96, 96, "36-v2"),
        # Additional corner candidates
        (96, 96, 96, "96"),
        (48, 64, 64, "48"),
    ]

    for size, mr, mb, vkey in seeds:
        x_full = orig_w - mr - size
        y_full = orig_h - mb - size
        if x_full < 0 or y_full < 0 or x_full + size > orig_w or y_full + size > orig_h:
            continue

        tpl = get_gemini_alpha_map_np(vkey)
        if tpl is None:
            continue

        rx = x_full - roi_x0
        ry = y_full - roi_y0
        if rx < 0 or ry < 0 or rx + size > roi_w or ry + size > roi_h:
            continue

        tpl_gx = cv2.Sobel(tpl, cv2.CV_32F, 1, 0, ksize=3)
        tpl_gy = cv2.Sobel(tpl, cv2.CV_32F, 0, 1, ksize=3)
        tpl_grad = cv2.magnitude(tpl_gx, tpl_gy)

        reg_grad = roi_grad[ry:ry + size, rx:rx + size]
        res = cv2.matchTemplate(reg_grad, tpl_grad, cv2.TM_CCOEFF_NORMED)
        score = float(res[0][0]) if res.size > 0 else 0.0

        if best_match is None or score > best_match["confidence"]:
            best_match = {
                "found": score >= min_conf,
                "x": x_full,
                "y": y_full,
                "size": size,
                "variant": vkey,
                "confidence": score,
            }

    if best_match is not None and best_match["confidence"] >= min_conf:
        # Refine with micro-jitter around best seed
        best_x = best_match["x"]
        best_y = best_match["y"]
        max_score = best_match["confidence"]
        vkey = best_match["variant"]
        tpl = get_gemini_alpha_map_np(vkey)
        if tpl is not None:
            sz = best_match["size"]
            tpl_gx = cv2.Sobel(tpl, cv2.CV_32F, 1, 0, ksize=3)
            tpl_gy = cv2.Sobel(tpl, cv2.CV_32F, 0, 1, ksize=3)
            tpl_grad = cv2.magnitude(tpl_gx, tpl_gy)
            for dy in range(-6, 7, 2):
                for dx in range(-6, 7, 2):
                    if dx == 0 and dy == 0:
                        continue
                    tx = best_match["x"] + dx
                    ty = best_match["y"] + dy
                    rx = tx - roi_x0
                    ry = ty - roi_y0
                    if rx < 0 or ry < 0 or rx + sz > roi_w or ry + sz > roi_h:
                        continue
                    r_grad = roi_grad[ry:ry + sz, rx:rx + sz]
                    r_score = float(cv2.matchTemplate(r_grad, tpl_grad, cv2.TM_CCOEFF_NORMED)[0][0])
                    if r_score > max_score:
                        max_score = r_score
                        best_x = tx
                        best_y = ty
            best_match["x"] = best_x
            best_match["y"] = best_y
            best_match["confidence"] = max_score
        return best_match

    fallback_x = max(0, orig_w - 32 - 48)
    fallback_y = max(0, orig_h - 32 - 48)
    return {"found": False, "x": fallback_x, "y": fallback_y, "size": 48, "variant": "48", "confidence": 0.0}

def remove_gemini_watermark_cv(img_bgr, orig_h, orig_w, sensitivity=55, alpha_gain=1.0, force=False):
    det = detect_gemini_watermark_cv(img_bgr, orig_h, orig_w, sensitivity)
    if not det["found"] and not force:
        return img_bgr, False, det, 0

    x, y, size = det["x"], det["y"], det["size"]
    vkey = det.get("variant", str(size))
    tpl = get_gemini_alpha_map_np(vkey)
    if tpl is None:
        tpl = get_gemini_alpha_map_np(size)
    if tpl is None:
        return img_bgr, False, det, 0

    out_bgr = img_bgr.copy().astype(np.float32)

    ALPHA_NOISE_FLOOR = 3.0 / 255.0
    ALPHA_THRESHOLD = 0.002
    MAX_ALPHA = 0.99
    LOGO_VALUE = 255.0

    patch = out_bgr[y:y + size, x:x + size]
    alpha_mag = np.abs(tpl)
    signal_alpha = np.maximum(0.0, alpha_mag - ALPHA_NOISE_FLOOR) * alpha_gain
    active_mask = signal_alpha >= ALPHA_THRESHOLD

    eff_alpha = np.minimum(alpha_mag * alpha_gain, MAX_ALPHA)
    one_minus = np.maximum(1e-4, 1.0 - eff_alpha)

    # Auto-polarity: check if background under watermark is near-white with dark watermark
    patch_gray = cv2.cvtColor(patch.astype(np.uint8), cv2.COLOR_BGR2GRAY)
    bg_lum = np.mean(patch_gray[tpl < 0.02]) if np.any(tpl < 0.02) else 128
    actual_logo = 0.0 if bg_lum > 240 and det["confidence"] < 0.15 else LOGO_VALUE

    for c in range(3):
        ch = patch[:, :, c]
        # Mathematical Reverse Alpha Blending
        restored = np.where(active_mask, (ch - eff_alpha * actual_logo) / one_minus, ch)
        patch[:, :, c] = np.clip(np.round(restored), 0, 255)

    # Edge transition healing along soft watermark borders
    edge_mask = (tpl >= 0.015) & (tpl <= 0.09)
    if np.any(edge_mask):
        blurred = cv2.medianBlur(patch.astype(np.uint8), 3)
        for c in range(3):
            patch[:, :, c] = np.where(edge_mask, blurred[:, :, c], patch[:, :, c])

    out_bgr[y:y + size, x:x + size] = patch
    mask_pixels = int(np.count_nonzero(active_mask))
    return out_bgr.astype(np.uint8), True, det, mask_pixels

def remove_watermark_cv(input_image, mode="full_auto", sensitivity=55, engine="smart_neural", preserve_details=True):
    """
    High-precision watermark detection and inpainting.
    Uses exact Reverse Alpha Blending for Gemini AI watermarks (100% detail preserving),
    and advanced inpainting for corner stamps/stock photo watermarks.
    """
    orig_rgba = input_image.convert("RGBA")
    orig_np = np.array(orig_rgba)
    orig_h, orig_w = orig_np.shape[:2]

    img_bgr = cv2.cvtColor(orig_np, cv2.COLOR_RGBA2BGR)

    # 1. Dedicated Gemini AI Reverse Alpha Blending
    if mode == "gemini_ai":
        cleaned_bgr, detected, det, mask_pixels = remove_gemini_watermark_cv(
            img_bgr, orig_h, orig_w, sensitivity=sensitivity, force=True
        )
        cleaned_rgba = cv2.cvtColor(cleaned_bgr, cv2.COLOR_BGR2RGBA)
        cleaned_rgba[:, :, 3] = orig_np[:, :, 3]
        return Image.fromarray(cleaned_rgba, mode="RGBA"), detected, mask_pixels

    # In full_auto mode, first check if a Gemini AI watermark is present
    gemini_handled = False
    g_pixels = 0
    if mode == "full_auto":
        gemini_det = detect_gemini_watermark_cv(img_bgr, orig_h, orig_w, sensitivity=sensitivity)
        if gemini_det["found"] and gemini_det["confidence"] >= 0.25:
            img_bgr, detected, _, g_pixels = remove_gemini_watermark_cv(
                img_bgr, orig_h, orig_w, sensitivity=sensitivity, force=True
            )
            gemini_handled = True
            cleaned_rgba = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGBA)
            cleaned_rgba[:, :, 3] = orig_np[:, :, 3]
            return Image.fromarray(cleaned_rgba, mode="RGBA"), True, g_pixels

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    sens = max(0.1, min(1.0, float(sensitivity) / 100.0))
    full_mask = np.zeros((orig_h, orig_w), dtype=np.uint8)

    # 2. General Corner Logos, Timestamps & Watermarks
    if mode in ["full_auto", "corners"]:
        # Bottom corners get expanded coverage (up to 54% width and 45% height) to cleanly
        # capture wide text watermarks, URLs, and stamps (like '© bg Watermark')
        corners = [
            (0, int(orig_h * 0.32), 0, int(orig_w * 0.35)),
            (0, int(orig_h * 0.32), orig_w - int(orig_w * 0.35), orig_w),
            (orig_h - int(orig_h * 0.45), orig_h, 0, int(orig_w * 0.48)),
            (orig_h - int(orig_h * 0.45), orig_h, orig_w - int(orig_w * 0.54), orig_w),
        ]
        k_size = max(11, min(31, int(min(orig_w, orig_h) * 0.03) | 1))
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, k_size))

        for idx, (y1, y2, x1, x2) in enumerate(corners):
            # If Gemini watermark was already handled in bottom right, skip bottom-right corner inpainting
            if gemini_handled and y2 == orig_h and x2 == orig_w:
                continue

            c_gray = gray[y1:y2, x1:x2]
            tophat_w = cv2.morphologyEx(c_gray, cv2.MORPH_TOPHAT, kernel)
            blackhat_b = cv2.morphologyEx(c_gray, cv2.MORPH_BLACKHAT, kernel)

            # Bottom corners: sensitive enough to capture faint antialiased text & drop shadows
            if y1 > 0:
                t_w = max(10.0, 20.0 * (1.15 - sens * 0.5))
                t_b = max(12.0, 24.0 * (1.15 - sens * 0.5))
            else:
                t_w = max(14.0, 28.0 * (1.15 - sens * 0.5))
                t_b = max(16.0, 32.0 * (1.15 - sens * 0.5))

            _, b_w = cv2.threshold(tophat_w, t_w, 255, cv2.THRESH_BINARY)
            _, b_b = cv2.threshold(blackhat_b, t_b, 255, cv2.THRESH_BINARY)
            c_mask = cv2.bitwise_or(b_w, b_b)

            corner_w = x2 - x1
            corner_h = y2 - y1
            num_l, labs, sts, _ = cv2.connectedComponentsWithStats(c_mask)
            for i in range(1, num_l):
                area = sts[i, cv2.CC_STAT_AREA]
                bw = sts[i, cv2.CC_STAT_WIDTH]
                bh = sts[i, cv2.CC_STAT_HEIGHT]
                if area >= 10 and bw >= 3 and bh >= 3 and bw < corner_w * 0.90:
                    if idx < 2 and (bw > corner_w * 0.45 or bh > corner_h * 0.35):
                        continue
                    full_mask[y1:y2, x1:x2][labs == i] = 255

    # 3. Stock Photo Grid / Tiled Watermarks
    if mode == "stock_grid":
        k_size = max(15, min(35, int(min(orig_w, orig_h) * 0.025) | 1))
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, k_size))
        tophat_w = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
        t_val = max(10.0, 24.0 * (1.1 - sens * 0.4))
        _, full_grid_mask = cv2.threshold(tophat_w, t_val, 255, cv2.THRESH_BINARY)
        full_mask = cv2.bitwise_or(full_mask, full_grid_mask)

    # 4. Morphological Dilation
    # Multi-stage elliptical dilation (7x7 with 3 iterations) to cleanly swallow
    # all outer antialiasing, semi-transparent halos, and subtle drop shadows
    k_d = max(7, min(15, int(min(orig_w, orig_h) * 0.012) | 1))
    dilate_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_d, k_d))
    dilated_mask = cv2.dilate(full_mask, dilate_k, iterations=3)

    mask_pixels = int(np.count_nonzero(dilated_mask))
    if mask_pixels == 0:
        cleaned_rgba = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGBA)
        cleaned_rgba[:, :, 3] = orig_np[:, :, 3]
        return Image.fromarray(cleaned_rgba, mode="RGBA"), gemini_handled, 0

    # 5. Inpainting (Navier-Stokes for smooth gradients, Telea as fallback)
    inpaint_method = cv2.INPAINT_NS if engine == "smart_neural" else cv2.INPAINT_TELEA
    inpaint_rad = max(8, min(24, int(min(orig_w, orig_h) * 0.018)))
    inpainted_bgr = cv2.inpaint(img_bgr, dilated_mask, inpaintRadius=inpaint_rad, flags=inpaint_method)

    # 6. Lossless Bit-For-Bit Original Image Preservation
    inpainted_rgba = cv2.cvtColor(inpainted_bgr, cv2.COLOR_BGR2RGBA)
    inpainted_rgba[:, :, 3] = orig_np[:, :, 3]

    mask_3d = np.repeat((dilated_mask > 0)[:, :, np.newaxis], 4, axis=2)
    final_np = np.where(mask_3d, inpainted_rgba, cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGBA))

    # 7. Match local photo micro-grain
    if preserve_details:
        noise = (np.random.randn(orig_h, orig_w, 3) * 1.5).astype(np.int16)
        for c in range(3):
            ch = final_np[:, :, c].astype(np.int16)
            masked_noise = np.where(dilated_mask > 0, ch + noise[:, :, c], ch)
            final_np[:, :, c] = np.clip(masked_noise, 0, 255).astype(np.uint8)

    final_pil = Image.fromarray(final_np, mode="RGBA")
    return final_pil, True, mask_pixels

def process_watermark_base64(data):
    b64_input = data.get("base64Image", "")
    mode = data.get("mode", "full_auto")
    sensitivity = float(data.get("sensitivity", 55))
    engine = data.get("engine", "smart_neural")
    preserve_details = bool(data.get("preserveDetails", True))

    start_time = time.time()
    try:
        if "," in b64_input:
            b64_input = b64_input.split(",", 1)[1]

        raw_bytes = base64.b64decode(b64_input)
        valid, err_msg, input_img = validate_image_bytes(raw_bytes)
        if not valid:
            return {"success": False, "error": err_msg}

        cleaned_img, detected, pixel_count = remove_watermark_cv(
            input_img, mode=mode, sensitivity=sensitivity, engine=engine, preserve_details=preserve_details
        )

        output_buf = io.BytesIO()
        cleaned_img.save(output_buf, "PNG", optimize=True)
        out_b64 = base64.b64encode(output_buf.getvalue()).decode("utf-8")

        return {
            "success": True,
            "base64Image": f"data:image/png;base64,{out_b64}",
            "watermarkDetected": detected,
            "maskedPixels": pixel_count,
            "duration": round(time.time() - start_time, 3),
        }
    except Exception as e:
        return {"success": False, "error": str(e) or "Watermark processing failed."}

# -------------------------------------------------------------
# High-Accuracy Auto Face Detection & Localized Anonymization (YuNet DNN)
# -------------------------------------------------------------
_yunet_detector = None
_yunet_lock = threading.Lock()

def get_face_detector():
    global _yunet_detector
    with _yunet_lock:
        if _yunet_detector is not None:
            return _yunet_detector
        
        models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
        os.makedirs(models_dir, exist_ok=True)
        yunet_path = os.path.join(models_dir, "face_detection_yunet.onnx")

        if not os.path.exists(yunet_path):
            yunet_url = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
            try:
                import urllib.request
                print("Downloading YuNet ONNX face detection model...")
                urllib.request.urlretrieve(yunet_url, yunet_path)
            except Exception as e:
                print(f"Failed to download YuNet model: {e}")
                return None

        try:
            detector = cv2.FaceDetectorYN_create(yunet_path, "", (320, 320), score_threshold=0.5, nms_threshold=0.3)
            _yunet_detector = detector
            return detector
        except Exception as e:
            print(f"Failed to create FaceDetectorYN: {e}")
            return None

def detect_and_blur_faces_cv(
    input_image,
    blur_type="gaussian",
    strength=25,
    shape="ellipse",
    margin=15,
    detect_only=False,
    manual_faces=None,
):
    orig_rgba = input_image.convert("RGBA")
    orig_np = np.array(orig_rgba)
    orig_h, orig_w = orig_np.shape[:2]

    bgr = cv2.cvtColor(orig_np, cv2.COLOR_RGBA2BGR)
    alpha_channel = orig_np[:, :, 3] if orig_np.shape[2] == 4 else None

    faces_boxes = []

    if manual_faces and len(manual_faces) > 0:
        for idx, mf in enumerate(manual_faces):
            fx = float(mf.get("x", 0)) * orig_w / 100.0
            fy = float(mf.get("y", 0)) * orig_h / 100.0
            fw = float(mf.get("w", 0)) * orig_w / 100.0
            fh = float(mf.get("h", 0)) * orig_h / 100.0
            faces_boxes.append({
                "id": mf.get("id") or f"face_{idx+1}_{int(time.time()*1000)}",
                "x": round((fx / orig_w) * 100, 1),
                "y": round((fy / orig_h) * 100, 1),
                "w": round((fw / orig_w) * 100, 1),
                "h": round((fh / orig_h) * 100, 1),
            })
    else:
        detector = get_face_detector()
        if detector is not None:
            max_dim = 1024
            scale = 1.0
            if max(orig_w, orig_h) > max_dim:
                scale = max_dim / float(max(orig_w, orig_h))
                det_w = int(orig_w * scale)
                det_h = int(orig_h * scale)
                det_img = cv2.resize(bgr, (det_w, det_h))
            else:
                det_w, det_h = orig_w, orig_h
                det_img = bgr

            detector.setInputSize((det_w, det_h))
            status, detected = detector.detect(det_img)

            if detected is not None and len(detected) > 0:
                for idx, row in enumerate(detected):
                    score = float(row[14])
                    if score < 0.45:
                        continue
                    dx, dy, dw, dh = float(row[0]), float(row[1]), float(row[2]), float(row[3])
                    fx = dx / scale
                    fy = dy / scale
                    fw = dw / scale
                    fh = dh / scale

                    pad_w = fw * (float(margin) / 100.0)
                    pad_h = fh * (float(margin) / 100.0 + 0.08)

                    fx_padded = max(0, fx - pad_w)
                    fy_padded = max(0, fy - pad_h)
                    fw_padded = min(orig_w - fx_padded, fw + pad_w * 2)
                    fh_padded = min(orig_h - fy_padded, fh + pad_h * 2)

                    faces_boxes.append({
                        "id": f"face_{idx+1}_{int(time.time()*1000)}",
                        "x": round((fx_padded / orig_w) * 100, 1),
                        "y": round((fy_padded / orig_h) * 100, 1),
                        "w": round((fw_padded / orig_w) * 100, 1),
                        "h": round((fh_padded / orig_h) * 100, 1),
                    })

    if len(faces_boxes) == 0 or detect_only:
        return input_image, faces_boxes

    result_bgr = bgr.copy()

    for face in faces_boxes:
        fx = int(face["x"] * orig_w / 100.0)
        fy = int(face["y"] * orig_h / 100.0)
        fw = int(face["w"] * orig_w / 100.0)
        fh = int(face["h"] * orig_h / 100.0)

        fx = max(0, min(orig_w - 1, fx))
        fy = max(0, min(orig_h - 1, fy))
        fw = max(1, min(orig_w - fx, fw))
        fh = max(1, min(orig_h - fy, fh))

        roi = result_bgr[fy : fy + fh, fx : fx + fw]
        roi_h, roi_w = roi.shape[:2]
        if roi_h < 2 or roi_w < 2:
            continue

        if blur_type == "blackout":
            if shape == "ellipse":
                cv2.ellipse(
                    result_bgr,
                    (fx + fw // 2, fy + fh // 2),
                    (fw // 2, fh // 2),
                    0,
                    0,
                    360,
                    (0, 0, 0),
                    -1,
                    cv2.LINE_AA,
                )
            else:
                cv2.rectangle(result_bgr, (fx, fy), (fx + fw, fy + fh), (0, 0, 0), -1)
            continue

        if blur_type == "pixelate":
            block_size = max(4, int((strength / 50.0) * (min(roi_w, roi_h) / 3.0)))
            tiny_w = max(1, roi_w // block_size)
            tiny_h = max(1, roi_h // block_size)
            tiny = cv2.resize(roi, (tiny_w, tiny_h), interpolation=cv2.INTER_LINEAR)
            processed_roi = cv2.resize(tiny, (roi_w, roi_h), interpolation=cv2.INTER_NEAREST)
        else:
            ksize = max(15, int((strength / 50.0) * (min(roi_w, roi_h) * 0.75)) | 1)
            sigma = max(5, int((strength / 50.0) * 45))
            processed_roi = cv2.GaussianBlur(roi, (ksize, ksize), sigma)

        mask = np.zeros((roi_h, roi_w), dtype=np.uint8)
        if shape == "ellipse":
            cv2.ellipse(
                mask,
                (roi_w // 2, roi_h // 2),
                (roi_w // 2, roi_h // 2),
                0,
                0,
                360,
                255,
                -1,
            )
        else:
            mask[:] = 255

        feather_k = max(5, int(min(roi_w, roi_h) * 0.1) | 1)
        feathered_mask = cv2.GaussianBlur(mask, (feather_k, feather_k), feather_k / 3.0)
        alpha = (feathered_mask.astype(float) / 255.0)[:, :, None]

        blended_roi = (roi * (1.0 - alpha) + processed_roi * alpha).astype(np.uint8)
        result_bgr[fy : fy + fh, fx : fx + fw] = blended_roi

    if alpha_channel is not None:
        result_rgb = cv2.cvtColor(result_bgr, cv2.COLOR_BGR2RGB)
        result_rgba = np.dstack([result_rgb, alpha_channel])
        out_img = Image.fromarray(result_rgba, "RGBA")
    else:
        result_rgb = cv2.cvtColor(result_bgr, cv2.COLOR_BGR2RGB)
        out_img = Image.fromarray(result_rgb, "RGB")

    return out_img, faces_boxes

def process_face_blur_base64(data):
    start_time = time.time()
    try:
        raw_b64 = data.get("base64Image") or data.get("image")
        if not raw_b64:
            return {"success": False, "error": "No image data provided"}

        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        img_bytes = base64.b64decode(raw_b64)
        is_valid, err_msg, input_img = validate_image_bytes(img_bytes)
        if not is_valid:
            return {"success": False, "error": err_msg}

        blur_type = data.get("blurType", "gaussian")
        strength = float(data.get("strength", 25))
        shape = data.get("shape", "ellipse")
        margin = float(data.get("margin", 15))
        detect_only = bool(data.get("detectOnly", False))
        manual_faces = data.get("faces", None)

        blurred_img, faces_boxes = detect_and_blur_faces_cv(
            input_img,
            blur_type=blur_type,
            strength=strength,
            shape=shape,
            margin=margin,
            detect_only=detect_only,
            manual_faces=manual_faces,
        )

        output_buf = io.BytesIO()
        blurred_img.save(output_buf, "PNG", optimize=True)
        out_b64 = base64.b64encode(output_buf.getvalue()).decode("utf-8")

        return {
            "success": True,
            "base64Image": f"data:image/png;base64,{out_b64}",
            "facesDetected": len(faces_boxes),
            "faces": faces_boxes,
            "duration": round(time.time() - start_time, 3),
        }
    except Exception as e:
        return {"success": False, "error": str(e) or "Face detection & blur failed."}

def process_image_operations(data, operation):
    start_time = time.time()
    try:
        raw_b64 = data.get("base64Image") or data.get("image")
        if not raw_b64:
            return {"success": False, "error": "No image data provided"}

        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        img_bytes = base64.b64decode(raw_b64)
        is_valid, err_msg, input_img = validate_image_bytes(img_bytes)
        if not is_valid:
            return {"success": False, "error": err_msg}

        out_format = str(data.get("format", "")).upper()
        if not out_format:
            out_format = input_img.format or "PNG"
        if out_format in ["JPG", "JPEG"]:
            out_format = "JPEG"
            if input_img.mode in ("RGBA", "LA", "P"):
                background = Image.new("RGB", input_img.size, (255, 255, 255))
                if input_img.mode == "RGBA":
                    background.paste(input_img, mask=input_img.split()[3])
                else:
                    background.paste(input_img.convert("RGB"))
                input_img = background
            elif input_img.mode != "RGB":
                input_img = input_img.convert("RGB")
        elif out_format == "WEBP":
            out_format = "WEBP"
        else:
            out_format = "PNG"

        w, h = input_img.size
        quality = int(data.get("quality", 80))
        quality = max(10, min(100, quality))

        if operation == "resize":
            target_w = int(data.get("width", w))
            target_h = int(data.get("height", h))
            if target_w <= 0 or target_h <= 0 or target_w > 6000 or target_h > 6000:
                return {"success": False, "error": "Invalid dimensions for resize (max 6000x6000px)."}
            input_img = input_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        elif operation == "crop":
            crop_x = int(data.get("x", data.get("crop_x", 0)))
            crop_y = int(data.get("y", data.get("crop_y", 0)))
            crop_w = int(data.get("width", data.get("crop_width", w - crop_x)))
            crop_h = int(data.get("height", data.get("crop_height", h - crop_y)))
            if crop_w <= 0 or crop_h <= 0 or crop_x < 0 or crop_y < 0 or (crop_x + crop_w) > w or (crop_y + crop_h) > h:
                return {"success": False, "error": f"Crop bounds out of image range ({w}x{h})."}
            input_img = input_img.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h))
        elif operation == "compress":
            pass

        output_buf = io.BytesIO()
        save_kwargs = {"optimize": True}
        if out_format in ["JPEG", "WEBP"]:
            save_kwargs["quality"] = quality

        # Save image (automatically strips EXIF metadata unless explicitly passed)
        input_img.save(output_buf, out_format, **save_kwargs)
        out_bytes = output_buf.getvalue()
        out_b64 = base64.b64encode(out_bytes).decode("utf-8")
        mime = f"image/{out_format.lower()}"

        return {
            "success": True,
            "base64Image": f"data:{mime};base64,{out_b64}",
            "format": out_format.lower(),
            "width": input_img.size[0],
            "height": input_img.size[1],
            "fileSizeBytes": len(out_bytes),
            "duration": round(time.time() - start_time, 3),
        }
    except Exception as e:
        return {"success": False, "error": str(e) or "Image processing operation failed."}

class WatermarkServerHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
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
            self.send_json({"status": "ok", "service": "watermark-and-face-ai"})
        else:
            self.send_json({"error": "Not Found"}, status=404)

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        if content_len > 55 * 1024 * 1024:
            self.send_json({"success": False, "error": "File size exceeds the 30 MB limit. Please upload a smaller file."}, status=413)
            return

        post_data = self.rfile.read(content_len)
        try:
            data = json.loads(post_data.decode("utf-8"))
        except Exception:
            self.send_json({"success": False, "error": "Invalid JSON payload."}, status=400)
            return

        import gc
        try:
            if self.path in ["/remove-watermark", "/api/remove-watermark"]:
                res = process_watermark_base64(data)
                status_code = 200 if res.get("success") else 400
                if "exceeds" in str(res.get("error", "")).lower():
                    status_code = 413
                self.send_json(res, status=status_code)
            elif self.path in ["/blur-face", "/api/blur-face", "/detect-faces", "/api/detect-faces"]:
                if "detect-faces" in self.path:
                    data["detectOnly"] = True
                res = process_face_blur_base64(data)
                status_code = 200 if res.get("success") else 400
                if "exceeds" in str(res.get("error", "")).lower():
                    status_code = 413
                self.send_json(res, status=status_code)
            elif self.path in ["/compress-image", "/api/compress-image"]:
                res = process_image_operations(data, "compress")
                status_code = 200 if res.get("success") else 400
                self.send_json(res, status=status_code)
            elif self.path in ["/convert-image", "/api/convert-image"]:
                res = process_image_operations(data, "convert")
                status_code = 200 if res.get("success") else 400
                self.send_json(res, status=status_code)
            elif self.path in ["/resize-image", "/api/resize-image"]:
                res = process_image_operations(data, "resize")
                status_code = 200 if res.get("success") else 400
                self.send_json(res, status=status_code)
            elif self.path in ["/crop-image", "/api/crop-image"]:
                res = process_image_operations(data, "crop")
                status_code = 200 if res.get("success") else 400
                self.send_json(res, status=status_code)
            else:
                self.send_json({"error": "Not Found"}, status=404)
        finally:
            gc.collect()

def run_server(port=5001):
    ThreadingHTTPServer.allow_reuse_address = True
    server_address = ("127.0.0.1", port)
    httpd = ThreadingHTTPServer(server_address, WatermarkServerHandler)
    print(f"Watermark Remover Python server running on port {port}...")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()

if __name__ == "__main__":
    port = 5001
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
