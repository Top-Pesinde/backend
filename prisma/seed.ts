import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Varolan kullanıcıları temizle (isteğe bağlı)
    await prisma.user.deleteMany();

    // Örnek kullanıcılar oluştur
    const users = await Promise.all([
        prisma.user.create({
            data: {
                name: 'John Doe',
                email: 'john@example.com',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Jane Smith',
                email: 'jane@example.com',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Ali Veli',
                email: 'ali@example.com',
            },
        }),
    ]);

    console.log('✅ Seeding completed!');
    console.log(`Created ${users.length} users`);
    users.forEach(user => {
        console.log(`- ${user.name} (${user.email})`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 