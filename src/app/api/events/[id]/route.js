import connectDB from "@/lib/mongodb";
import Event from "@/lib/models/Event";

export async function GET(request, { params }) {
  const { id } = await params;
  await connectDB();
  const event = await Event.findById(id);
  if (!event) return Response.json({ error: "ვერ მოიძებნა" }, { status: 404 });
  return Response.json(event);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  await connectDB();
  const body = await request.json();

  try {
    const event = await Event.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!event) return Response.json({ error: "ვერ მოიძებნა" }, { status: 404 });
    return Response.json(event);
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return Response.json({ error: messages.join(", ") }, { status: 400 });
    }
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await connectDB();

  const event = await Event.findByIdAndDelete(id);
  if (!event) return Response.json({ error: "ვერ მოიძებნა" }, { status: 404 });

  return Response.json({ success: true });
}