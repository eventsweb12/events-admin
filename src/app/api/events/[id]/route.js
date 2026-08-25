import connectDB from "@/lib/mongodb";
import Event from "@/lib/models/Event";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const event = await Event.findById(id);
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json(event, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("GET /api/events/[id] failed:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // carouselImages must be a subset of gallery. If gallery isn't part of
    // this update, fall back to the event's existing gallery for the check.
    if (Array.isArray(body.carouselImages)) {
      const gallery =
        body.gallery ?? (await Event.findById(id).select("gallery")).gallery;

      const invalid = body.carouselImages.filter(
        (url) => !gallery.includes(url)
      );
      if (invalid.length) {
        return Response.json(
          { error: "carouselImages must be selected from gallery" },
          { status: 400 }
        );
      }
    }

    const event = await Event.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json(event);
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return Response.json({ error: messages.join(", ") }, { status: 400 });
    }
    console.error("PUT /api/events/[id] failed:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/events/[id] failed:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}