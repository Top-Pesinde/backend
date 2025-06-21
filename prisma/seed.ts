import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Varolan kullanıcıları temizle (isteğe bağlı)
    await prisma.user.deleteMany();

    // Şifreleri hash'le
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Örnek kullanıcılar oluştur
    const users = await Promise.all([
        prisma.user.create({
            data: {
                firstName: 'John',
                lastName: 'Doe',
                username: 'johndoe',
                email: 'john@example.com',
                password: hashedPassword,
                phone: '5551234567',
                location: 'İstanbul',
                bio: 'Test kullanıcı',
                role: 'USER',
            },
        }),
        prisma.user.create({
            data: {
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
                email: 'jane@example.com',
                password: hashedPassword,
                phone: '5559876543',
                location: 'Ankara',
                bio: 'Test kullanıcı 2',
                role: 'GOALKEEPER',
                lisans: true,
            },
        }),
        prisma.user.create({
            data: {
                firstName: 'Ali',
                lastName: 'Veli',
                username: 'aliveli',
                email: 'ali@example.com',
                password: hashedPassword,
                phone: '5555555555',
                location: 'İzmir',
                role: 'REFEREE',
            },
        }),
        prisma.user.create({
            data: {
                firstName: 'Test',
                lastName: 'Admin',
                username: 'admin',
                email: 'admin@example.com',
                password: hashedPassword,
                phone: '5550000000',
                location: 'İstanbul',
                role: 'ADMIN',
            },
        }),
    ]);

    console.log('✅ Seeding completed!');
    console.log(`Created ${users.length} users`);
    users.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Phone: ${user.phone}`);
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