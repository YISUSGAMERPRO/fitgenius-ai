FROM node:22-alpine

WORKDIR /app

COPY server/package.json ./
RUN npm install --production

COPY server/server.js .

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]
