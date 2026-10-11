"""
Ganga AI Neural Background Removal Engine (Native Implementation)
Copyright (c) 2026 BG Tool. All rights reserved.

High-performance neural image segmentation pipeline executing directly
via Microsoft ONNXRuntime with sub-pixel edge refinement.
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
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "onnxruntime", "pillow", "numpy", "opencv-python", "--quiet"])
    import onnxruntime as ort

try:
    import cv2
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "opencv-python", "--quiet"])
    import cv2

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

MODEL_REGISTRY = {
    # Ganga Primary Neural Engines
    "ganga": os.path.join(MODELS_DIR, "ganga-core.onnx"),
    "ganga-core": os.path.join(MODELS_DIR, "ganga-core.onnx"),
    "u2net": os.path.join(MODELS_DIR, "u2net.onnx"),
    "rmbg": os.path.join(MODELS_DIR, "rmbg-1.4.onnx"),
    "isnet": os.path.join(MODELS_DIR, "isnet-general-use.onnx"),
    "ganga-ultra": os.path.join(MODELS_DIR, "u2net.onnx"),
    "ganga-lite": os.path.join(MODELS_DIR, "u2net.onnx"),
}

FALLBACK_MODELS = [
    os.path.join(MODELS_DIR, "ganga-core.onnx"),
    os.path.join(MODELS_DIR, "u2net.onnx"),
    os.path.join(MODELS_DIR, "rmbg-1.4.onnx"),
    os.path.join(MODELS_DIR, "isnet-general-use.onnx"),
]

U2NET_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx"

class GangaEngine:
    _sessions = {}
    _lock = threading.Lock()

    @classmethod
    def get_session(cls, model_key: str = "ganga") -> ort.InferenceSession:
        target_path = MODEL_REGISTRY.get(model_key.lower(), MODEL_REGISTRY["ganga"])

        with cls._lock:
            if target_path in cls._sessions:
                return cls._sessions[target_path]

            candidates = [target_path] + [p for p in FALLBACK_MODELS if p != target_path]

            # If no model exists locally, attempt automatic download of u2net
            if not any(os.path.exists(p) for p in candidates):
                default_target = MODEL_REGISTRY["ganga"]
                print(f"[Ganga AI] No model found in {MODELS_DIR}. Attempting download of gold-standard neural model...")
                try:
                    os.makedirs(MODELS_DIR, exist_ok=True)
                    import urllib.request
                    tmp_target = default_target + ".tmp"
                    urllib.request.urlretrieve(U2NET_URL, tmp_target)
                    os.replace(tmp_target, default_target)
                    print(f"[Ganga AI] Model installed successfully at {default_target}.")
                except Exception as dl_err:
                    print(f"[Ganga AI] Automatic model download failed: {dl_err}")

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
                        cls._sessions[target_path] = sess
                        print(f"[Ganga AI] Neural model {os.path.basename(candidate)} online!")
                        return sess
                    except Exception as e:
                        print(f"[Ganga AI] Error loading {candidate}: {e}")

            raise FileNotFoundError(f"Ganga AI models not found in {MODELS_DIR}. Please ensure model files are present.")

    @classmethod
    def remove_background(cls, image_input, model_name: str = "ganga") -> dict:
        """
        Executes high-precision Ganga AI neural background removal on an image.
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

            in_h = 320
            in_w = 320
            if len(input_shape) >= 4:
                if isinstance(input_shape[2], int) and input_shape[2] > 0:
                    in_h = input_shape[2]
                if isinstance(input_shape[3], int) and input_shape[3] > 0:
                    in_w = input_shape[3]

            im_resized = img.resize((in_w, in_h), Image.Resampling.BILINEAR)
            im_ary = np.array(im_resized, dtype=np.float32) / 255.0

            # Normalization (ImageNet standardization)
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

            ma = float(np.max(raw_out))
            mi = float(np.min(raw_out))
            if ma > mi:
                norm_mask = (raw_out - mi) / (ma - mi)
            else:
                norm_mask = np.zeros_like(raw_out)

            # 5. Full-Resolution Alpha Upscaling via Lanczos-4
            mask_full = cv2.resize(norm_mask, (orig_w, orig_h), interpolation=cv2.INTER_LANCZOS4)
            mask_full = np.clip(mask_full, 0.0, 1.0)

            # S-Curve Contrast Optimization:
            # Eradicates residual background haze/fringe while keeping fine hair strands solid
            low = 0.12
            high = 0.88
            mask_contrast = np.clip((mask_full - low) / (high - low), 0.0, 1.0)

            # Sub-pixel edge anti-aliasing (smooths transitions without pixelated staircase jaggies)
            mask_smooth = cv2.GaussianBlur(mask_contrast, (3, 3), 0.5)
            mask_uint8 = (mask_smooth * 255.0).astype(np.uint8)

            alpha_mask = Image.fromarray(mask_uint8, mode="L")

            # 6. Lossless RGBA Composite
            r, g, b = img.split()
            cutout_img = Image.merge("RGBA", (r, g, b, alpha_mask))

            out_buf = io.BytesIO()
            cutout_img.save(out_buf, "PNG", optimize=True)
            out_b64 = base64.b64encode(out_buf.getvalue()).decode("utf-8")

            duration = round(time.time() - start_time, 3)
            return {
                "success": True,
                "base64Image": f"data:image/png;base64,{out_b64}",
                "width": orig_w,
                "height": orig_h,
                "duration": duration,
                "engine": "Ganga AI Studio Core",
            }
        except Exception as e:
            return {"success": False, "error": str(e) or "Ganga AI processing encountered an error."}
