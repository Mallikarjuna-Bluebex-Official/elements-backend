import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

// Parse JSON bodies for all routes on this router
router.use(express.json());

// ─── config ───────────────────────────────────────────────────────────────────
// Base directory where assets live on the VM: /var/www/assets/<type>/<file>
const ASSETS_BASE = process.env.ASSETS_BASE || "/var/www/assets";
const BASE_URL    = process.env.BASE_URL    || "https://elementsoneastcoast.com";

const ALLOWED_TYPES      = ["banner", "gallery", "promotion"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov"];

// ─── helpers ──────────────────────────────────────────────────────────────────

function resolveDir(type) {
  if (!ALLOWED_TYPES.includes(type)) return null;
  return path.join(ASSETS_BASE, type);
}

function isAllowedFile(filename) {
  return ALLOWED_EXTENSIONS.includes(path.extname(filename).toLowerCase());
}

// ─── multer ───────────────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter(req, file, cb) {
    if (isAllowedFile(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${path.extname(file.originalname)}`));
    }
  },
});

// ─── POST /api/media/upload ───────────────────────────────────────────────────

router.post("/upload", upload.single("file"), (req, res) => {
  try {
    const { type } = req.body;
    const dir = resolveDir(type);

    if (!dir)       return res.status(400).json({ error: `Invalid type "${type}".` });
    if (!req.file)  return res.status(400).json({ error: "No file provided." });

    const safeName = path.basename(req.file.originalname).replace(/\s+/g, "_");
    const destPath = path.join(dir, safeName);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(destPath, req.file.buffer);

    const url = `${BASE_URL}/uploads/${type}/${safeName}`;
    console.log(`[media] uploaded → ${destPath}`);
    return res.status(201).json({ success: true, url, name: safeName });

  } catch (err) {
    console.error("[media/upload]", err.message);
    return res.status(500).json({ error: "Upload failed.", detail: err.message });
  }
});

// ─── POST /api/media/replace ──────────────────────────────────────────────────

router.post("/replace", upload.single("file"), (req, res) => {
  try {
    const { type, replaceName } = req.body;
    const dir = resolveDir(type);

    if (!dir)         return res.status(400).json({ error: `Invalid type "${type}".` });
    if (!req.file)    return res.status(400).json({ error: "No file provided." });
    if (!replaceName) return res.status(400).json({ error: "replaceName is required." });

    // Delete old file
    const oldPath = path.join(dir, path.basename(replaceName));
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
      console.log(`[media] deleted old → ${oldPath}`);
    }

    // Write new file
    const safeName = path.basename(req.file.originalname).replace(/\s+/g, "_");
    const destPath = path.join(dir, safeName);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(destPath, req.file.buffer);

    const url = `${BASE_URL}/uploads/${type}/${safeName}`;
    console.log(`[media] replaced → ${destPath}`);
    return res.status(200).json({ success: true, url, name: safeName });

  } catch (err) {
    console.error("[media/replace]", err.message);
    return res.status(500).json({ error: "Replace failed.", detail: err.message });
  }
});

// GET /api/media/list?type=banner
router.get("/list", (req, res) => {
  try {
    const { type } = req.query;
    const dir = resolveDir(type);
    if (!dir) return res.status(400).json({ error: `Invalid type "${type}".` });
    if (!fs.existsSync(dir)) return res.json({ files: [] });

    const files = fs.readdirSync(dir)
      .filter(name => isAllowedFile(name))
      .map((name, i) => ({
        id: `${type}-${i}-${name}`,
        name,
        url: `${BASE_URL}/uploads/${type}/${name}`,
      }));

    return res.json({ files });
  } catch (err) {
    console.error("[media/list]", err.message);
    return res.status(500).json({ error: "Failed to list files." });
  }
});

// ─── DELETE /api/media/delete ─────────────────────────────────────────────────

router.delete("/delete", (req, res) => {
  try {
    console.log("[media/delete] body:", req.body);
    const { type, name } = req.body;
    const dir = resolveDir(type);

    if (!dir)  return res.status(400).json({ error: `Invalid type "${type}".` });
    if (!name) return res.status(400).json({ error: "name is required." });

    const targetPath = path.join(dir, path.basename(name));
    console.log("[media/delete] targetPath:", targetPath);

    if (!fs.existsSync(targetPath)) {
      // Already gone — keep UI in sync
      return res.status(200).json({ success: true, note: "File already deleted." });
    }

    fs.unlinkSync(targetPath);//this only works if the backend is running on the same machine as the files.
    console.log(`[media] deleted → ${targetPath}`);
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("[media/delete]", err.message);
    return res.status(500).json({ error: "Delete failed.", detail: err.message });
  }
});

export default router;
