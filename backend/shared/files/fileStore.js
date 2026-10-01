import crypto from "crypto"
import path from "path"
import File from "./file.model.js"

// Replaces the old S3 upload/presign pair. saveArtifact stores the buffer in
// MongoDB and returns an unguessable key; artifactUrl turns that key into a
// download link served by the same app (GET /api/files/:key).

export const saveArtifact = async (filename, buffer, contentType) => {
    const ext = path.extname(filename) || ""
    const key = `${crypto.randomUUID()}${ext}`

    await File.create({
        key,
        filename,
        contentType,
        data: buffer
    })

    return key
}

export const getArtifact = async (key) => {
    return File.findOne({ key })
}

// Relative URL on purpose: the SPA is served from the same origin, so the
// browser resolves it correctly no matter what domain the app runs on.
export const artifactUrl = (key) => `/api/files/${key}`
