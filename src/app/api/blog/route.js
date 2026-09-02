import connectDB from "@/lib/mongodb";
import BlogPost from "@/lib/models/BlogPost";

export async function GET(request) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const published = searchParams.get("published");

  const filter = {};
  if (published === "true") filter.published = true;
  if (published === "false") filter.published = false;

  const posts = await BlogPost.find(filter).sort({ createdAt: -1 });
  return Response.json(posts, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();

  const { title, content, images, excerpt, published, publishedAt, source } = body;

  // ვალიდაცია — ორივე ენა სავალდებულოა
  if (!title?.ka || !title?.en) {
    return Response.json(
      { error: "სათაური სავალდებულოა ორივე ენაზე (ka, en)" },
      { status: 400 }
    );
  }

  if (!content?.ka || !content?.en) {
    return Response.json(
      { error: "პოსტის ტექსტი სავალდებულოა ორივე ენაზე (ka, en)" },
      { status: 400 }
    );
  }

  // წყარო optional-ია, მაგრამ თუ name ან url ერთ-ერთი შევსებულია — ორივე სავალდებულოა
  if (source && (source.name || source.url) && !(source.name && source.url)) {
    return Response.json(
      { error: "წყაროს დამატებისას საჭიროა სახელიც და ლინკიც" },
      { status: 400 }
    );
  }

  try {
    const post = await BlogPost.create({
      title,
      content,
      images: images || [],
      excerpt: excerpt || {},
      source: source?.name && source?.url ? { name: source.name, url: source.url } : undefined,
      published: published ?? true,
      publishedAt: publishedAt || Date.now(),
    });

    return Response.json(post, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}