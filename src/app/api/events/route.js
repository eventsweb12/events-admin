import connectDB from "@/lib/mongodb";
import Event from "@/lib/models/Event";

export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().sort({ year: 1 });
    return Response.json(events, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("GET /api/events failed:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();

  // carouselImages must be a subset of gallery (if both were provided)
  if (Array.isArray(body.carouselImages) && Array.isArray(body.gallery)) {
    const invalid = body.carouselImages.filter(
      (url) => !body.gallery.includes(url)
    );
    if (invalid.length) {
      return Response.json(
        { error: "carouselImages must be selected from gallery" },
        { status: 400 }
      );
    }
  }

  try {
    const event = await Event.create(body);
    return Response.json(event, { status: 201 });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return Response.json({ error: messages.join(", ") }, { status: 400 });
    }
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}