import connectDB from "@/lib/mongodb";
import BlogPost from "@/lib/models/BlogPost";

// დამხმარე ფუნქცია — ქართული/ინგლისური სათაურიდან slug-ის გენერაცია
function generateSlug(title) {
  return title
    .toString()
    .toLowerCase()
    .trim()
    // ტრანსლიტერაცია ან უბრალოდ space -> dash, სხვა სიმბოლოების მოცილება
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-");
}

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

  const { title, content, images, excerpt, published, publishedAt } = body;

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

  // slug ან მოცემულია, ან გენერირდება ინგლისური სათაურიდან
  let slug = body.slug ? generateSlug(body.slug) : generateSlug(title.en);

  // უნიკალურობის შემოწმება — თუ დაკავებულია, ბოლოში ემატება რიცხვი
  let uniqueSlug = slug;
  let counter = 1;
  while (await BlogPost.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  try {
    const post = await BlogPost.create({
      title,
      slug: uniqueSlug,
      content,
      images: images || [],
      excerpt: excerpt || {},
      published: published ?? true,
      publishedAt: publishedAt || Date.now(),
    });

    return Response.json(post, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}