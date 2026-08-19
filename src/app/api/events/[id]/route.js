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
  const event = await Event.findByIdAndUpdate(id, body, { new: true });
  return Response.json(event);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await connectDB();
  await Event.findByIdAndDelete(id);
  return Response.json({ success: true });
}