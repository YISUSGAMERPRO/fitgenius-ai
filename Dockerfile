FROM node:22-alpine

WORKDIR /app

COPY server/package.json ./
RUN npm install --production

COPY server/server.js .
COPY start.sh .
RUN chmod +x start.sh

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["./start.sh"]
