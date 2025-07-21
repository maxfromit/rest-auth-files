FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# production
# COPY . .

# RUN npm run build

# ENV NODE_ENV=production



# CMD ["sh", "-c", "npm run db:generate && npm run db:migrate && npm run start"]
# CMD ["sh", "-c", "npm run db:push && npm run start"]
# production

#development
# ENV NODE_ENV=development

# CMD ["npx", "tsx", "src/server.ts"]


