import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// MinIO İstemcisini Yapılandır
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});

async function main() {
    console.log('🌱 Veritabanı tohumlama işlemi başlıyor...');

    // --- MinIO Bucket ve Resim Yükleme ---
    const bucketName = 'profile-photos';
    const profileImagePath = path.join(__dirname, '..', 'profile.png');
    let profileImageUrl = '';

    try {
        const bucketExists = await minioClient.bucketExists(bucketName);
        if (!bucketExists) {
            console.log(`🪣 '${bucketName}' bucket'ı oluşturuluyor...`);
            await minioClient.makeBucket(bucketName);
            // Bucket'ı herkese açık yap
            const policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": { "AWS": ["*"] },
                        "Action": ["s3:GetObject"],
                        "Resource": [`arn:aws:s3:::${bucketName}/*`]
                    }
                ]
            };
            await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
            console.log(`✅ '${bucketName}' bucket'ı oluşturuldu ve politika ayarlandı.`);
        } else {
            console.log(`👍 '${bucketName}' bucket'ı zaten mevcut.`);
        }

        if (fs.existsSync(profileImagePath)) {
            const fileName = `admin-profile-${Date.now()}.png`;
            console.log(`🖼️ Profil resmi '${fileName}' MinIO'ya yükleniyor...`);

            await minioClient.fPutObject(bucketName, fileName, profileImagePath, {});

            // Yüklenen resmin URL'ini al
            // Not: MINIO_DOMAIN ve port ayarlarınızın dışarıdan erişime uygun olduğundan emin olun.
            const domain = process.env.MINIO_DOMAIN || process.env.MINIO_ENDPOINT || 'localhost';
            profileImageUrl = `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${domain}:9000/${bucketName}/${fileName}`;
            console.log(`✅ Profil resmi yüklendi: ${profileImageUrl}`);
        } else {
            console.warn(`⚠️ Profil resmi bulunamadı: ${profileImagePath}`);
        }
    } catch (error) {
        console.error('❌ MinIO işlemi sırasında hata:', error);
    }

    // --- Kullanıcıları Oluşturma ---
    console.log('🧹 Mevcut kullanıcılar temizleniyor...');
    await prisma.user.deleteMany();
    console.log('🗑️ Eski kullanıcılar silindi.');

    const hashedPassword = await bcrypt.hash('123456', 12);
    console.log('🔒 Şifreler hashleniyor...');

    console.log('➕ Örnek kullanıcılar ve admin oluşturuluyor...');
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
                firstName: 'Admin',
                lastName: 'User',
                username: 'admin',
                email: 'admin@example.com',
                password: hashedPassword,
                phone: '5550000000',
                location: 'Merkez',
                bio: 'Sistem Yöneticisi',
                role: 'ADMIN',
                profilePhoto: profileImageUrl || null, // URL varsa ekle
            },
        }),
        // Socket test kullanıcıları
        prisma.user.create({
            data: {
                firstName: 'Socket',
                lastName: 'Test1',
                username: 'sockettest1',
                email: 'sockettest1@test.com',
                password: hashedPassword,
                phone: '5551111111',
                location: 'Test',
                bio: 'Socket Test User 1',
                role: 'USER',
            },
        }),
        prisma.user.create({
            data: {
                firstName: 'Socket',
                lastName: 'Test2',
                username: 'sockettest2',
                email: 'sockettest2@test.com',
                password: hashedPassword,
                phone: '5552222222',
                location: 'Test',
                bio: 'Socket Test User 2',
                role: 'USER',
            },
        }),
    ]);

    console.log('✅ Tohumlama tamamlandı!');
    console.log(`Oluşturulan kullanıcı sayısı: ${users.length}`);
    users.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Rol: ${user.role}`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Tohumlama başarısız oldu:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 