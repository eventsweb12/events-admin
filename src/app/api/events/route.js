import connectDB from "@/lib/mongodb";
import Event from "@/lib/models/Event";

export async function GET() {
  await connectDB();
  const events = await Event.find().sort({ date: 1 });
  return Response.json(events);
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();

  const event = await Event.create(body);
  return Response.json(event, { status: 201 });
}