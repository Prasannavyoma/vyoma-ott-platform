const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.testimonial.create({
    data: {
      name: "Aditya Sharma",
      role: "Sanskrit Enthusiast",
      content: "Vyoma has been an absolute game changer for my understanding of ancient scriptures. The way the teachers break down complex grammar into simple, digestible pieces is nothing short of brilliant. Highly recommended!",
      rating: 5,
      status: "APPROVED"
    }
  });

  await prisma.blogPost.create({
    data: {
      title: "The Beauty of Sanskrit Grammar: A Beginner's Guide",
      slug: "beauty-of-sanskrit-grammar",
      excerpt: "Sanskrit grammar is often seen as intimidating, but beneath its complex rules lies an incredibly logical and mathematical structure. In this post, we explore...",
      content: "<p>Sanskrit grammar (Vyākaraṇa) is often seen as intimidating, but beneath its complex rules lies an incredibly logical and mathematical structure.</p><h2>The Paninian System</h2><p>Panini's Ashtadhyayi is considered one of the greatest intellectual achievements of ancient India. It functions almost like a modern programming language...</p><blockquote>Sanskrit is not just a language, it is a perfect algorithmic system.</blockquote><p>We invite you to explore our courses to dive deeper into this beautiful language.</p>",
      author: "Vyoma Team",
      thumbnailUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop",
      published: true
    }
  });

  console.log("Dummy data seeded successfully.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
