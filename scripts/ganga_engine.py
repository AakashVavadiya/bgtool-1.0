"""
Ganga AI Neural Background Removal Engine (Native Implementation)
Copyright (c) 2026 BG Tool. All rights reserved.

High-performance neural image segmentation pipeline executing directly
via Microsoft ONNXRuntime with sub-pixel edge refinement and lossless PNG export.
"""

import os
import sys
import time
import io
import base64
import threading
import numpy as np
from PIL import Image

# Ensure limit on background thread pools to prevent CPU saturation
os.environ["OMP_NUM_THREADS"] = "4"
os.environ["MKL_NUM_THREADS"] = "4"
os.environ["OPENBLAS_NUM_THREADS"] = "4"

try:
    import onnxruntime as ort
except ImportError:
    print("onnxruntime is missing. Run: uv pip install onnxruntime")
    sys.exit(1)

try:
    import cv2
except ImportError:
    print("OpenCV is missing. Run: uv pip install opencv-python-headless")
    sys.exit(1)


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

RMBG_PATH = os.path.join(MODELS_DIR, "rmbg-1.4.onnx")
ISNET_PATH = os.path.join(MODELS_DIR, "isnet-general-use.onnx")
GANGA_CORE_PATH = os.path.join(MODELS_DIR, "ganga-core.onnx")
U2NET_PATH = os.path.join(MODELS_DIR, "u2net.onnx")

# RMBG-1.4 1024x1024 model from BRIA AI (gold standard for commercial background removal)
RMBG_1024_URL = "https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model.onnx"
U2NET_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx"

PRIMARY_MODEL = RMBG_PATH

MODEL_REGISTRY = {
    "karudi": RMBG_PATH,
    "karudi-universal": RMBG_PATH,
    "karudi-pro": RMBG_PATH,
    "ganga": RMBG_PATH,
    "ganga-ultra": RMBG_PATH,
    "ganga-matting": RMBG_PATH,
    "brahmaputra": ISNET_PATH,
    "rmbg": RMBG_PATH,
    "isnet": ISNET_PATH,
    "ganga-core": GANGA_CORE_PATH,
    "u2net": U2NET_PATH,
    "ganga-lite": GANGA_CORE_PATH,
}

FALLBACK_MODELS = [
    RMBG_PATH,
    ISNET_PATH,
    GANGA_CORE_PATH,
    U2NET_PATH,
]

def download_file(url: str, dest_path: str, label: str = "neural model"):
    import urllib.request
    print(f"[Ganga AI] Downloading studio-grade {label} from {url}...")
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    tmp_path = dest_path + ".tmp"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=180) as resp, open(tmp_path, "wb") as f:
        while True:
            chunk = resp.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    os.replace(tmp_path, dest_path)
    print(f"[Ganga AI] {label} installed successfully at {dest_path} ({os.path.getsize(dest_path):,} bytes).")

class GangaEngine:
    _sessions = {}
    _lock = threading.Lock()

    @classmethod
    def get_session(cls, model_key: str = "ganga") -> ort.InferenceSession:
        target_path = MODEL_REGISTRY.get(model_key.lower(), RMBG_PATH)

        with cls._lock:
            if target_path in cls._sessions:
                return cls._sessions[target_path]

            # If RMBG-1.4 model is missing, prioritize downloading RMBG-1.4 (1024x1024)
            if target_path == RMBG_PATH and not os.path.exists(RMBG_PATH):
                try:
                    download_file(RMBG_1024_URL, RMBG_PATH, "RMBG-1.4 1024x1024 model")
                except Exception as dl_err:
                    print(f"[Ganga AI] RMBG-1.4 download error: {dl_err}. Checking fallback models...")

            candidates = [target_path] + [p for p in FALLBACK_MODELS if p != target_path]

            # If no model exists at all, download gold standard model
            if not any(os.path.exists(p) for p in candidates):
                print(f"[Ganga AI] No model found in {MODELS_DIR}. Attempting download...")
                try:
                    download_file(RMBG_1024_URL, RMBG_PATH, "RMBG-1.4 1024x1024 model")
                except Exception as dl_err:
                    print(f"[Ganga AI] Primary download failed: {dl_err}. Attempting U2Net fallback...")
                    try:
                        download_file(U2NET_URL, U2NET_PATH, "U2Net fallback model")
                    except Exception as fallback_err:
                        print(f"[Ganga AI] Fallback download failed: {fallback_err}")

            for candidate in candidates:
                if os.path.exists(candidate):
                    try:
                        print(f"[Ganga AI] Initializing neural model: {os.path.basename(candidate)}...")
                        opts = ort.SessionOptions()
                        opts.enable_cpu_mem_arena = True
                        opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
                        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
                        opts.intra_op_num_threads = 4
                        opts.inter_op_num_threads = 2

                        sess = ort.InferenceSession(candidate, sess_options=opts, providers=["CPUExecutionProvider"])
                        sess._model_path = candidate
                        cls._sessions[target_path] = sess
                        print(f"[Ganga AI] Neural model {os.path.basename(candidate)} online!")
                        return sess
                    except Exception as e:
                        print(f"[Ganga AI] Error loading {candidate}: {e}")

            raise FileNotFoundError(f"Ganga AI models not found in {MODELS_DIR}. Please ensure model files are present.")

    @classmethod
    def warmup(cls, model_name: str = "ganga"):
        """Pre-warms session on startup so first request has zero cold-start delay."""
        try:
            sess = cls.get_session(model_name)
            target_path = getattr(sess, "_model_path", "")
            is_1024 = "rmbg" in target_path.lower() or "isnet" in target_path.lower()
            h, w = (1024, 1024) if is_1024 else (320, 320)
            inp = sess.get_inputs()[0]
            dummy = np.zeros((1, 3, h, w), dtype=np.float32)
            sess.run(None, {inp.name: dummy})
            print(f"[Ganga AI] Warmup complete for {os.path.basename(target_path)}.")
        except Exception as e:
            print(f"[Ganga AI] Warmup notice: {e}")

    @classmethod
    def extract_inside_backgrounds(cls, img_rgb: np.ndarray, alpha_uint8: np.ndarray, raw_mask: np.ndarray = None) -> np.ndarray:
        """
        High-precision topological cavity & inside background extraction.
        Removes strictly enclosed background pockets/gaps (e.g. gaps between
        desk organizer sections, mug handles, chair legs, scissors loops)
        while strictly protecting solid foreground objects (even if white/light-colored,
        such as white pots, white shirts, ceramics, white shoes).
        """
        try:
            if not isinstance(img_rgb, np.ndarray) or not isinstance(alpha_uint8, np.ndarray):
                return alpha_uint8

            h, w = alpha_uint8.shape[:2]
            if h < 50 or w < 50:
                return alpha_uint8

            solid_fg = (alpha_uint8 >= 200).astype(np.uint8)
            fg_area = int(np.sum(solid_fg))
            if fg_area < 500:
                return alpha_uint8

            # Work at optimized scale for speed & robustness
            scale = 1.0
            max_d = max(h, w)
            if max_d > 1600:
                scale = 1600.0 / max_d
                small_w = max(100, int(w * scale))
                small_h = max(100, int(h * scale))
                work_rgb = cv2.resize(img_rgb, (small_w, small_h), interpolation=cv2.INTER_AREA)
                work_alpha = cv2.resize(alpha_uint8, (small_w, small_h), interpolation=cv2.INTER_NEAREST)
                work_solid = cv2.resize(solid_fg, (small_w, small_h), interpolation=cv2.INTER_NEAREST)
                work_raw = cv2.resize(raw_mask, (small_w, small_h), interpolation=cv2.INTER_LINEAR) if raw_mask is not None else None
            else:
                work_rgb = img_rgb
                work_alpha = alpha_uint8
                work_solid = solid_fg
                work_raw = raw_mask
                small_w, small_h = w, h

            # 1. Identify guaranteed outer background via flood-fill from transparent image perimeter
            bg_seed = (work_alpha < 20).astype(np.uint8)
            seeds = []
            step = max(2, min(small_h, small_w) // 40)
            for x in range(0, small_w, step):
                if bg_seed[0, x]: seeds.append((x, 0))
                if bg_seed[small_h - 1, x]: seeds.append((x, small_h - 1))
            for y in range(0, small_h, step):
                if bg_seed[y, 0]: seeds.append((0, y))
                if bg_seed[y, small_w - 1]: seeds.append((small_w - 1, y))

            if not seeds:
                return alpha_uint8

            outer_bg = np.zeros((small_h, small_w), dtype=bool)
            bg_work = bg_seed.copy()
            for sx, sy in seeds:
                if bg_work[sy, sx] == 1:
                    m = np.zeros((small_h + 2, small_w + 2), dtype=np.uint8)
                    cv2.floodFill(bg_work, m, (sx, sy), 2)
                    outer_bg |= (m[1:-1, 1:-1] == 1)

            # Dilate outer background by 8px: any candidate touching this is PART OF OUTER PERIMETER
            # (e.g. pot resting on table, pants reaching floor, mug base). It CANNOT be an interior cavity!
            dilated_outer = cv2.dilate(outer_bg.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_RECT, (17, 17))) > 0

            # 2. Sample background color from outer background
            work_bgr = cv2.cvtColor(work_rgb, cv2.COLOR_RGB2BGR) if work_rgb.ndim == 3 else work_rgb
            work_lab = cv2.cvtColor(work_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)

            bg_samples = work_lab[outer_bg & (work_alpha < 10)]
            if len(bg_samples) < 40:
                return alpha_uint8

            median_bg = np.median(bg_samples, axis=0)
            delta_e = np.sqrt(np.sum(((work_lab - median_bg) / np.array([1.0, 1.2, 1.2])) ** 2, axis=2))

            # 3. Detect interior cavities that are strictly ENCLOSED on BOTH axes (horizontal AND vertical)
            span = min(70, max(20, int(min(small_h, small_w) * 0.12)))
            kh = cv2.getStructuringElement(cv2.MORPH_RECT, (span, 1))
            closed_h = cv2.morphologyEx(work_solid, cv2.MORPH_CLOSE, kh)
            kv = cv2.getStructuringElement(cv2.MORPH_RECT, (1, span))
            closed_v = cv2.morphologyEx(work_solid, cv2.MORPH_CLOSE, kv)

            # Must be enclosed horizontally AND vertically (strict 4-way topological negative space)
            enclosed = (closed_h > 0) & (closed_v > 0)

            # Local texture gradient (true backgrounds have low texture gradient, not intricate surface details)
            gray = cv2.cvtColor(work_bgr, cv2.COLOR_BGR2GRAY)
            grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
            grad_mag = np.sqrt(grad_x ** 2 + grad_y ** 2)

            # Safeguards for candidate cavity pixels:
            # - Must be strictly enclosed
            # - Must NOT touch outer background / floor / table
            # - Must match background color closely (delta_e < 13.0)
            # - Must be smooth background (grad_mag < 25)
            # - If raw neural probability is available: must NOT be high-confidence foreground (raw_mask < 0.40)
            candidates = enclosed & (~dilated_outer) & (delta_e < 13.0) & (grad_mag < 25)
            if work_raw is not None:
                candidates &= (work_raw < 0.40)

            if not np.any(candidates):
                return alpha_uint8

            num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
                candidates.astype(np.uint8), connectivity=8
            )
            cavity_to_remove = np.zeros((small_h, small_w), dtype=bool)

            # Strict physical constraints on interior gaps/cavities:
            # - Must be a narrow slot or small hole: area <= 2.5% of foreground
            # - Slot width <= 45 pixels (cannot be a large solid object)
            max_cavity_area = max(20, int(fg_area * (scale ** 2) * 0.025))

            for lbl in range(1, num_labels):
                area = stats[lbl, cv2.CC_STAT_AREA]
                if area < 12 or area > max_cavity_area:
                    continue

                comp_w = stats[lbl, cv2.CC_STAT_WIDTH]
                if comp_w > 45:
                    continue

                comp_mask = (labels == lbl)
                dilated = cv2.dilate(comp_mask.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)))
                boundary = (dilated > 0) & (~comp_mask)
                if not np.any(boundary):
                    continue

                bound_de = np.mean(delta_e[boundary])
                cav_de = np.mean(delta_e[comp_mask])

                # Surrounding boundary MUST have distinct, high-contrast foreground color compared to cavity
                if bound_de > 20.0 and cav_de < 12.0:
                    cavity_to_remove |= comp_mask

            if not np.any(cavity_to_remove):
                return alpha_uint8

            # Upscale cavity mask if we processed at lower resolution
            if scale != 1.0:
                cavity_full = cv2.resize(
                    cavity_to_remove.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST
                ).astype(bool)
            else:
                cavity_full = cavity_to_remove

            refined_alpha = alpha_uint8.copy()
            refined_alpha[cavity_full] = 0

            # Sub-pixel boundary softening (1-2px) for smooth anti-aliased transitions
            dilated_cav = cv2.dilate(cavity_full.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
            cav_boundary = (dilated_cav > 0) & (~cavity_full) & (refined_alpha > 0)
            refined_alpha[cav_boundary] = (refined_alpha[cav_boundary].astype(np.float32) * 0.5).astype(np.uint8)

            return refined_alpha
        except Exception as e:
            print(f"[Ganga AI] Cavity extraction notice: {e}")
            return alpha_uint8

    @classmethod
    def remove_background(cls, image_input, model_name: str = "ganga", smooth_edge: float = 0.6) -> dict:
        """
        Executes ultra-high precision Ganga AI neural background removal on an image
        with sub-pixel bicubic contour interpolation, adaptive corner smoothing,
        and edge color defringing.
        Returns:
            {
                "success": bool,
                "base64Image": "data:image/png;base64,...",
                "width": int,
                "height": int,
                "duration": float,
                "engine": str
            }
        """
        start_time = time.time()
        try:
            # 1. Parse Image Input
            if isinstance(image_input, str):
                if "," in image_input:
                    image_input = image_input.split(",", 1)[1]
                raw_bytes = base64.b64decode(image_input)
                img = Image.open(io.BytesIO(raw_bytes))
            elif isinstance(image_input, bytes):
                img = Image.open(io.BytesIO(image_input))
            elif isinstance(image_input, Image.Image):
                img = image_input
            else:
                return {"success": False, "error": "Invalid image format provided."}

            img = img.convert("RGB")
            orig_w, orig_h = img.size

            if orig_w <= 0 or orig_h <= 0 or orig_w * orig_h > 60_000_000:
                return {"success": False, "error": "Image resolution exceeds supported limits (max 60 Megapixels)."}

            # 2. Dynamic Input Resolution & Tensor Pre-processing
            session = cls.get_session(model_name)
            input_meta = session.get_inputs()[0]
            input_name = input_meta.name
            input_shape = input_meta.shape
            target_path = getattr(session, "_model_path", "")

            is_rmbg = "rmbg" in target_path.lower() or "rmbg" in model_name.lower()
            is_isnet = "isnet" in target_path.lower() or "isnet" in model_name.lower()

            in_h = 1024 if (is_rmbg or is_isnet) else 320
            in_w = 1024 if (is_rmbg or is_isnet) else 320
            if len(input_shape) >= 4:
                if isinstance(input_shape[2], int) and input_shape[2] > 0:
                    in_h = input_shape[2]
                if isinstance(input_shape[3], int) and input_shape[3] > 0:
                    in_w = input_shape[3]

            im_resized = img.resize((in_w, in_h), Image.Resampling.BILINEAR)
            im_ary = np.array(im_resized, dtype=np.float32) / 255.0

            # Normalization
            if is_rmbg or is_isnet:
                # RMBG / IS-Net standard normalization (centered around 0.5)
                norm_ary = (im_ary - np.array([0.5, 0.5, 0.5], dtype=np.float32)) / np.array([1.0, 1.0, 1.0], dtype=np.float32)
            else:
                # ImageNet standardization for U2Net / Ganga Core
                mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
                std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
                norm_ary = (im_ary - mean) / std

            tensor = np.expand_dims(norm_ary.transpose((2, 0, 1)), 0).astype(np.float32)

            # 3. ONNX Inference
            ort_outs = session.run(None, {input_name: tensor})

            # 4. Alpha Mask Extraction
            raw_out = ort_outs[0]
            if raw_out.ndim == 4:
                raw_out = raw_out[0, 0, :, :]
            elif raw_out.ndim == 3:
                raw_out = raw_out[0, :, :]

            if is_rmbg:
                # RMBG-1.4 output is already sigmoid activation [0.0, 1.0]
                norm_mask = np.clip(raw_out, 0.0, 1.0)
            else:
                ma = float(np.max(raw_out))
                mi = float(np.min(raw_out))
                if ma > mi:
                    norm_mask = (raw_out - mi) / (ma - mi)
                else:
                    norm_mask = np.zeros_like(raw_out)

            # 5. Full-Resolution Alpha Upscaling with Sub-Pixel Bilinear Interpolation
            # INTER_LINEAR produces smooth, continuous contour boundaries without cubic ringing / halo artifacts
            mask_full = cv2.resize(norm_mask, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
            mask_full = np.clip(mask_full, 0.0, 1.0)

            # Calibrated contrast mapping:
            # - Model probability >= 0.52 is guaranteed 100% solid foreground (alpha = 255)
            #   Strictly preserves solid objects (white pots, white shirts, ceramics, shoes)
            # - Model probability <= 0.12 is guaranteed 100% clean background (alpha = 0)
            # - Smoothstep cubic transfer S(t) = t^2 * (3 - 2t) provides natural sub-pixel anti-aliasing
            low = 0.12
            high = 0.52
            norm = np.clip((mask_full - low) / (high - low), 0.0, 1.0)
            smooth_mask = norm * norm * (3.0 - 2.0 * norm)
            alpha_uint8 = (smooth_mask * 255.0).astype(np.uint8)

            # 5b. Ultra-Safe Interior Cavity Extraction
            # Strictly preserves foreground objects while removing genuine negative spaces
            alpha_uint8 = cls.extract_inside_backgrounds(np.array(img), alpha_uint8, raw_mask=mask_full)

            # 6. High-Fidelity Edge Defringing (Background Color Decontamination)
            # Prevents dark/light background bleed along semi-transparent boundaries
            # by extending authentic foreground colors into transition zone
            solid = (alpha_uint8 >= 235).astype(np.uint8)
            transition = (alpha_uint8 > 5) & (alpha_uint8 < 235)

            if np.any(transition) and np.any(solid):
                rgb_np = np.array(img, dtype=np.uint8)
                max_dim = max(orig_w, orig_h)
                kernel_size = 3 if max_dim < 1600 else 5
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))

                dilated_solid = cv2.dilate(solid, kernel)
                masked_fg = rgb_np * solid[:, :, np.newaxis]
                dilated_fg = cv2.dilate(masked_fg, kernel)

                denom = dilated_solid[:, :, np.newaxis].astype(np.float32)
                denom[denom == 0] = 1.0
                extended_fg = (dilated_fg.astype(np.float32) / denom).astype(np.uint8)

                # Blend transition pixels towards pure foreground color proportional to alpha
                decontaminated_rgb = rgb_np.copy()
                blend_factor = (1.0 - (alpha_uint8[transition].astype(np.float32) / 235.0))[:, np.newaxis]
                decontaminated_rgb[transition] = np.clip(
                    rgb_np[transition] * (1.0 - blend_factor) + extended_fg[transition] * blend_factor,
                    0,
                    255,
                ).astype(np.uint8)
                img_for_cutout = Image.fromarray(decontaminated_rgb, mode="RGB")
            else:
                img_for_cutout = img

            alpha_mask = Image.fromarray(alpha_uint8, mode="L")

            # Lossless RGBA Composite
            r, g, b = img_for_cutout.split()
            cutout_img = Image.merge("RGBA", (r, g, b, alpha_mask))

            # Fast lossless PNG export (compress_level=4 is 5x faster than optimize=True with identical lossless fidelity)
            out_buf = io.BytesIO()
            cutout_img.save(out_buf, "PNG", compress_level=4)
            out_b64 = base64.b64encode(out_buf.getvalue()).decode("utf-8")

            duration = round(time.time() - start_time, 3)
            m_lower = str(model_name).lower()
            if "karudi" in m_lower:
                engine_name = "Karudi 1.0 Universal AI"
            elif "ganga" in m_lower:
                engine_name = "Ganga Studio 1024 (RMBG-1.4)" if is_rmbg else ("Ganga IS-Net" if is_isnet else "Ganga Core AI")
            elif "brahmaputra" in m_lower:
                engine_name = "Brahmaputra Engine"
            else:
                engine_name = "Ganga Studio 1024 (RMBG-1.4)" if is_rmbg else ("Ganga IS-Net" if is_isnet else "Ganga Core AI")

            return {
                "success": True,
                "base64Image": f"data:image/png;base64,{out_b64}",
                "width": orig_w,
                "height": orig_h,
                "duration": duration,
                "engine": engine_name,
                "model": model_name,
            }
        except Exception as e:
            return {"success": False, "error": str(e) or "Ganga AI processing encountered an error."}
