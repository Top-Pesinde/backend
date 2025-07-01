# 1. Base Image
FROM node:18-alpine AS base

# 2. Set working directory
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy prisma schema
COPY prisma ./prisma/

# 6. Generate Prisma Client
RUN npx prisma generate

# 7. Copy the rest of the source code
COPY . .

# 8. Build the project
RUN npm run build


# --- Production Image ---
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Copy built assets and dependencies from the base stage
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/prisma ./prisma
COPY package*.json ./

# Set the command to run the application
CMD ["node", "dist/src/index.js"] 