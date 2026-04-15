import { Hono } from "hono";
import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { auth } from "../auth";
import { env } from "../env";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB for audio
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_AUDIO_TYPES = ["audio/mp4", "audio/m4a", "audio/x-m4a", "audio/mpeg", "audio/wav", "audio/webm", "audio/ogg"];
const ALLOWED_AUDIO_EXTENSIONS = [".m4a", ".mp3", ".wav", ".webm", ".ogg", ".mp4"];

// Ensure upload directory exists on module load
if (!existsSync(UPLOAD_DIR)) {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export const uploadsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// POST /api/uploads/photo - Upload a photo
uploadsRouter.post("/photo", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get("photo");

    if (!file || !(file instanceof File)) {
      return c.json({ error: { message: "No photo file provided", code: "NO_FILE" } }, 400);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({
        error: {
          message: "Invalid file type. Allowed: jpg, jpeg, png, webp",
          code: "INVALID_TYPE"
        }
      }, 400);
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return c.json({
        error: {
          message: "File too large. Maximum size is 5MB",
          code: "FILE_TOO_LARGE"
        }
      }, 400);
    }

    // Get original extension
    const originalName = file.name || "photo";
    const ext = path.extname(originalName).toLowerCase() || ".jpg";

    // Validate extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return c.json({
        error: {
          message: "Invalid file extension. Allowed: jpg, jpeg, png, webp",
          code: "INVALID_EXTENSION"
        }
      }, 400);
    }

    // Generate unique filename
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    // Return the URL path to access the photo
    const url = `${env.BACKEND_URL}/api/uploads/${filename}`;

    return c.json({
      data: {
        filename,
        url,
        size: file.size,
        type: file.type
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({
      error: {
        message: "Failed to upload file",
        code: "UPLOAD_FAILED"
      }
    }, 500);
  }
});

// POST /api/uploads/image - Upload an image for chat (accepts `file` field)
uploadsRouter.post("/image", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return c.json({ error: { message: "No image file provided", code: "NO_FILE" } }, 400);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({
        error: {
          message: "Invalid file type. Allowed: jpg, jpeg, png, webp",
          code: "INVALID_TYPE"
        }
      }, 400);
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return c.json({
        error: {
          message: "File too large. Maximum size is 5MB",
          code: "FILE_TOO_LARGE"
        }
      }, 400);
    }

    const originalName = file.name || "image.jpg";
    const ext = path.extname(originalName).toLowerCase() || ".jpg";

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return c.json({
        error: {
          message: "Invalid file extension. Allowed: jpg, jpeg, png, webp",
          code: "INVALID_EXTENSION"
        }
      }, 400);
    }

    const filename = `chat_${randomUUID()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    const url = `${env.BACKEND_URL}/api/uploads/${filename}`;

    return c.json({
      data: {
        filename,
        url,
        size: file.size,
        type: file.type
      }
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return c.json({
      error: {
        message: "Failed to upload image",
        code: "UPLOAD_FAILED"
      }
    }, 500);
  }
});

// POST /api/uploads/voice - Upload a voice message
uploadsRouter.post("/voice", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get("audio");

    if (!file || !(file instanceof File)) {
      return c.json({ error: { message: "No audio file provided", code: "NO_FILE" } }, 400);
    }

    // Validate file type (be lenient as mobile can report different types)
    const isValidType = ALLOWED_AUDIO_TYPES.includes(file.type) || file.type.startsWith("audio/");
    if (!isValidType) {
      return c.json({
        error: {
          message: "Invalid file type. Must be an audio file.",
          code: "INVALID_TYPE"
        }
      }, 400);
    }

    // Validate file size
    if (file.size > MAX_AUDIO_SIZE) {
      return c.json({
        error: {
          message: "File too large. Maximum size is 10MB",
          code: "FILE_TOO_LARGE"
        }
      }, 400);
    }

    // Get original extension or default to .m4a
    const originalName = file.name || "voice.m4a";
    let ext = path.extname(originalName).toLowerCase();
    if (!ext || !ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      ext = ".m4a";
    }

    // Generate unique filename
    const filename = `voice_${randomUUID()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    // Return the URL path to access the audio
    const url = `${env.BACKEND_URL}/api/uploads/${filename}`;

    return c.json({
      data: {
        filename,
        url,
        size: file.size,
        type: file.type
      }
    });
  } catch (error) {
    console.error("Voice upload error:", error);
    return c.json({
      error: {
        message: "Failed to upload voice message",
        code: "UPLOAD_FAILED"
      }
    }, 500);
  }
});

// GET /api/uploads/:filename - Serve uploaded photos
uploadsRouter.get("/:filename", async (c) => {
  const filename = c.req.param("filename");

  // Validate filename to prevent directory traversal
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return c.json({ error: { message: "Invalid filename", code: "INVALID_FILENAME" } }, 400);
  }

  const filepath = path.join(UPLOAD_DIR, filename);

  // Check if file exists
  try {
    await stat(filepath);
  } catch {
    return c.json({ error: { message: "File not found", code: "NOT_FOUND" } }, 404);
  }

  // Determine content type from extension
  const ext = path.extname(filename).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".m4a": "audio/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".webm": "audio/webm",
    ".ogg": "audio/ogg",
    ".mp4": "audio/mp4"
  };

  const contentType = contentTypeMap[ext];
  if (!contentType) {
    return c.json({ error: { message: "Invalid file type", code: "INVALID_TYPE" } }, 400);
  }

  // Read and return file
  try {
    const fileBuffer = await readFile(filepath);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      }
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return c.json({ error: { message: "Failed to serve file", code: "SERVE_FAILED" } }, 500);
  }
});
