import mongoose from "mongoose"

// Generated artifacts (pptx, pdf, generated images) used to live in S3. They
// now live here instead, so the app has no AWS dependency at all.
// The TTL index auto-deletes files after 7 days, mirroring how the old S3
// presigned download links expired.
const fileSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    filename: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        required: true
    },
    data: {
        type: Buffer,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "7d"
    }
})

export default mongoose.models.File || mongoose.model("File", fileSchema)
