import mongoose from "mongoose";

const LocalizedStringSchema = {
  ka: { type: String, required: true },
  en: { type: String, required: true },
};

const BlogPostSchema = new mongoose.Schema(
  {
    // სათაური ორივე ენაზე
    title: {
      ka: { type: String, required: true },
      en: { type: String, required: true },
    },

    // ბლოგის პოსტის ტექსტი (HTML ფორმატში — მოდის Rich Text Editor-იდან)
    // შეიცავს: აბზაცებს <p>, bullet points <ul><li>, სათაურებს <h2>/<h3>, ლინკებს <a href="">
    content: {
      ka: { type: String, required: true },
      en: { type: String, required: true },
    },

    // მოკლე აღწერა (სურვილისამებრ, useful SEO/preview-სთვის)
    excerpt: {
      ka: { type: String },
      en: { type: String },
    },

    // ერთი ან რამდენიმე სურათი — თუ 1 ელემენტია, უბრალოდ სურათი; თუ მეტი, სლაიდერი frontend-ზე
    images: [
      {
        url: { type: String, required: true },
        alt: {
          ka: { type: String },
          en: { type: String },
        },
      },
    ],

    // წყარო — თუ პოსტი სხვა საიტიდან მოკლედ გადმოცემულია, სავალდებულოა მითითება
    source: {
      name: { type: String },
      url: { type: String },
    },

    // გამოქვეყნების თარიღი (განსხვავებული createdAt-ისგან, თუ გინდათ ცალკე კონტროლი)
    publishedAt: { type: Date, default: Date.now },

    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.BlogPost || mongoose.model("BlogPost", BlogPostSchema);