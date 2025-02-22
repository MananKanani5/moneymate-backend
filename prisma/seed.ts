import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding default expense categories...");

    const categories = [
        { categoryName: "Food", categoryColor: "#FF5733" },
        { categoryName: "Transport", categoryColor: "#33A1FF" },
        { categoryName: "Entertainment", categoryColor: "#FF33E1" },
        { categoryName: "Personal", categoryColor: "#FFD700" },
        { categoryName: "Misc", categoryColor: "#808080" }
    ];

    for (const category of categories) {
        await prisma.expenseCategory.upsert({
            where: { categoryName: category.categoryName },
            update: {},
            create: category
        });
    }

    console.log("✅ Default categories seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
