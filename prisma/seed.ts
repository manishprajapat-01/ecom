import { PrismaClient, Role, AddressType, DiscountType } from "@prisma/client";
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS, SAMPLE_COUPONS } from "../src/lib/data/sample-catalog.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with BharatBazaar catalog...");

  // 1. Create Admin(s) & Test Customer
  // Admin phone numbers come from ADMIN_PHONES (comma separated). Falls back to the demo admin.
  const adminPhones = (process.env.ADMIN_PHONES || "9876543210")
    .split(",")
    .map((p) => p.replace(/\D/g, "").slice(-10))
    .filter((p) => /^[6-9]\d{9}$/.test(p));

  for (const phone of adminPhones) {
    await prisma.user.upsert({
      where: { phone },
      update: { role: Role.ADMIN },
      create: {
        phone,
        name: "Admin Manager",
        role: Role.ADMIN,
      },
    });
  }

  const testCustomer = await prisma.user.upsert({
    where: { phone: "9812345678" },
    update: {},
    create: {
      phone: "9812345678",
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      role: Role.CUSTOMER,
      addresses: {
        create: [
          {
            fullName: "Rahul Sharma",
            phone: "9812345678",
            houseFlat: "Flat 402, Green Glen Heights",
            street: "Bellandur Outer Ring Road",
            landmark: "Near EcoSpace Tech Park",
            city: "Bengaluru",
            state: "Karnataka",
            pinCode: "560103",
            type: AddressType.HOME,
            isDefault: true,
          },
        ],
      },
    },
  });

  console.log(`Created admin(s) [${adminPhones.join(", ")}] and test user (${testCustomer.phone})`);

  // 2. Categories
  for (const cat of SAMPLE_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
        icon: cat.iconName,
        sortOrder: cat.sortOrder,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        icon: cat.iconName,
        sortOrder: cat.sortOrder,
      },
    });
  }
  console.log(`Seeded ${SAMPLE_CATEGORIES.length} categories`);

  // 3. Products
  for (const prod of SAMPLE_PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        title: prod.title,
        shortDesc: prod.shortDesc,
        longDesc: prod.longDesc,
        brand: prod.brand,
        categoryId: prod.categoryId,
        regularPrice: prod.regularPrice,
        sellingPrice: prod.sellingPrice,
        discountPercent: prod.discountPercent,
        sku: prod.sku,
        stock: prod.stock,
        isPublished: prod.isPublished,
        isFeatured: prod.isFeatured,
        rating: prod.rating,
        reviewCount: prod.reviewCount,
        specifications: prod.specifications,
      },
      create: {
        id: prod.id,
        title: prod.title,
        slug: prod.slug,
        shortDesc: prod.shortDesc,
        longDesc: prod.longDesc,
        brand: prod.brand,
        categoryId: prod.categoryId,
        regularPrice: prod.regularPrice,
        sellingPrice: prod.sellingPrice,
        discountPercent: prod.discountPercent,
        sku: prod.sku,
        stock: prod.stock,
        isPublished: prod.isPublished,
        isFeatured: prod.isFeatured,
        rating: prod.rating,
        reviewCount: prod.reviewCount,
        specifications: prod.specifications,
        images: {
          create: prod.images.map((img, idx) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
            sortOrder: idx,
          })),
        },
      },
    });
  }
  console.log(`Seeded ${SAMPLE_PRODUCTS.length} products`);

  // 4. Coupons
  for (const coup of SAMPLE_COUPONS) {
    await prisma.coupon.upsert({
      where: { code: coup.code },
      update: {
        description: coup.description,
        discountType: coup.discountType as DiscountType,
        discountValue: coup.discountValue,
        minOrderValue: coup.minOrderValue,
        maxDiscount: coup.maxDiscount || null,
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      create: {
        code: coup.code,
        description: coup.description,
        discountType: coup.discountType as DiscountType,
        discountValue: coup.discountValue,
        minOrderValue: coup.minOrderValue,
        maxDiscount: coup.maxDiscount || null,
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`Seeded coupons`);

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
