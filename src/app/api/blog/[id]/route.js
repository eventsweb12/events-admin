import connectDB from "@/lib/mongodb";
import BlogPost from "@/lib/models/BlogPost";

export async function GET(request, { params }) {
  const { id } = await params;
  await connectDB();
  const post = await BlogPost.findById(id);
  if (!post) return Response.json({ error: "ვერ მოიძებნა" }, { status: 404 });
  return Response.json(post);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  await connectDB();
  const body = await request.json();
  const post = await BlogPost.findByIdAndUpdate(id, body, { new: true });
  return Response.json(post);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await connectDB();
  await BlogPost.findByIdAndDelete(id);
  return Response.json({ success: true });
}