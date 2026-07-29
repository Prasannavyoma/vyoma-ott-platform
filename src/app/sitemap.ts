import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vyoma-ott.com';

  // 1. Core static routes
  const routes = [
    '',
    '/explore',
    '/courses',
    '/blog',
    '/faq',
    '/subscribe',
    '/about-us',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    // 2. Fetch all dynamic courses
    const courses = await prisma.course.findMany({
      select: { id: true, updatedAt: true },
      // Optional: where: { published: true }
    });

    const courseRoutes = courses.map((course) => ({
      url: `${baseUrl}/explore?course=${course.id}`, // or /courses/[id] if that's the canonical URL
      lastModified: course.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // 3. Fetch all published blogs
    const blogs = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });

    const blogRoutes = blogs.map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: blog.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    return [...routes, ...courseRoutes, ...blogRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return routes; // Fallback to static routes
  }
}
