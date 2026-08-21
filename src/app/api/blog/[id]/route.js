import connectDB from "@/lib/mongodb";
import BlogPost from "@/lib/models/BlogPost";

export async function GET(request, { params }) {
  const { id } = await params;
  await connectDB();

  const post = await BlogPost.findById(id);
  if (!post) return Response.json({ error: "ვერ მოიძებნა" }, { status: 404 });

  return Response.json(post, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  await connectDB();
  const body = await request.json();

  // თუ title/content იცვლება, დავრწმუნდეთ რომ ორივე ენა მოცემულია
  if (body.title && (!body.title.ka || !body.title.en)) {
    return Response.json(
      { error: "სათაური სავალდებულოა ორივე ენაზე (ka, en)" },
      { status: 400 }
    );
  }

  if (body.content && (!body.content.ka || !body.content.en)) {
    return Response.json(
      { error: "პოსტის ტექსტი სავალდებულოა ორივე ენაზე (ka, en)" },
      { status: 400 }
    );
  }

  try {
    const post = await BlogPost.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!post) return Response.json({ error: "ვერ მოიძებნა" }, { status: 404 });

    return Response.json(post);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await connectDB();

  const deleted = await BlogPost.findByIdAndDelete(id);
  if (!deleted) return Response.json({ error: "ვერ მოიძებნა" }, { status: 404 });

  return Response.json({ success: true });
}