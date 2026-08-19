import connectDB from "@/lib/mongodb";
import BlogPost from "@/lib/models/BlogPost";

export async function GET() {
  await connectDB();
  const posts = await BlogPost.find().sort({ createdAt: -1 });
  return Response.json(posts);
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();

  const post = await BlogPost.create(body);
  return Response.json(post, { status: 201 });
}