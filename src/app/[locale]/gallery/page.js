import { getMessages } from "@/lib/i18n";
import { getLivePosts } from "@/lib/content";
import { localizedField } from "@/lib/localize";
import { mediaUrl, thumbnailUrl, isVideo } from "@/lib/media";
import SectionHeading from "../components/SectionHeading";
import GalleryClient from "../components/GalleryClient";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = getMessages(locale);
  return { title: t.gallery.heading, description: t.gallery.sub };
}

export default async function GalleryPage({ params }) {
  const { locale } = await params;
  const t = getMessages(locale);

  // Only live (published + not expired) posts — expired media never renders.
  const posts = await getLivePosts({ limit: 60, withMediaOnly: true });

  const items = posts.flatMap((post) =>
    (post.media || []).map((m, i) => ({
      id: `${post._id}-${i}`,
      kind: isVideo(m) ? "video" : "image",
      url: mediaUrl(m),
      thumb: thumbnailUrl(m, 600) || mediaUrl(m),
      title: localizedField(post, locale, "title"),
      publishedAt: post.publishedAt || null,
      expiresAt: post.type === "temporary" ? post.expiresAt : null,
    }))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        eyebrow={t.meta.tagline}
        title={t.gallery.heading}
        subtitle={t.gallery.sub}
      />
      <GalleryClient items={items} locale={locale} t={t} />
    </div>
  );
}
