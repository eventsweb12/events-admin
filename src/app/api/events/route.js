import connectDB from "@/lib/mongodb";
import Event from "@/lib/models/Event";

export async function GET() {
  await connectDB();
  const events = await Event.find().sort({ year: 1 });
  return Response.json(events);
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();

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