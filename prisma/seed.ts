import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding default expense categories...");

    const categories = [
        { categoryName: "Food", categoryColor: "#086942" },
        { categoryName: "Transport", categoryColor: "#fdba1a" },
        { categoryName: "Entertainment", categoryColor: "#e6111b" },
        { categoryName: "Personal", categoryColor: "#00509d" },
        { categoryName: "Misc", categoryColor: "#00509d30" }
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
