import mongoose from "mongoose";

const BilingualStringSchema = new mongoose.Schema(
  {
    geo: { type: String },
    eng: { type: String },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    client: { type: BilingualStringSchema },

    eventName: { type: BilingualStringSchema, required: true }, // e.g. "Apivita — ბრენდის პრეზენტაცია"
    venue: { type: BilingualStringSchema },
    format: { type: BilingualStringSchema },
    audience: { type: BilingualStringSchema },
    year: { type: Number },

    role: { type: BilingualStringSchema },
    about: { type: BilingualStringSchema },

    mainImage: { type: String, required: true }, // only required image
    gallery: [{ type: String }],

    // subset of `gallery` (or standalone) urls picked to show in the carousel
    carouselImages: [{ type: String }],

    youtubeUrl: { type: String }, // link to YouTube video, replaces old file upload

    slug: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// auto-generate slug from eventName.eng (fallback to geo) if not provided
EventSchema.pre("validate", function () {
  if (!this.slug && this.eventName) {
    const base = this.eventName.eng || this.eventName.geo || "event";
    this.slug =
      base
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-") +
      "-" +
      Date.now().toString(36);
  }
});

export default mongoose.models.Event || mongoose.model("Event", EventSchema);