# Monepero

Turborepo ile yönetilen monorepo projesi.

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Turbo'yu global olarak yükle (opsiyonel)
npm install -g turbo
```

## Geliştirme

```bash
# Tüm paketleri geliştirme modunda çalıştır
npm run dev

# Belirli bir paketi çalıştır
npx turbo run dev --filter=express-api-services
```

## Build

```bash
# Tüm paketleri build et
npm run build

# Belirli bir paketi build et
npx turbo run build --filter=express-api-services
```

## Test

```bash
# Tüm testleri çalıştır
npm run test

# Belirli bir pakette test çalıştır
npx turbo run test --filter=express-api-services
```

## Veritabanı

```bash
# Prisma schema'yı generate et
npm run db:generate

# Veritabanını push et
npm run db:push

# Migration çalıştır
npm run db:migrate
```

## Paketler

- `packages/api` - Express.js API

## Özellikler

- 🚀 **Turborepo** - Hızlı build ve cache sistemi
- 📦 **Workspaces** - NPM workspaces desteği
- 🔄 **Hot Reload** - Geliştirme sırasında otomatik yenileme
- 🧪 **Testing** - Jest ile test desteği
- 🔍 **Linting** - ESLint ve Prettier
- 🗄️ **Database** - Prisma ORM 