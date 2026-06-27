FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

ARG MAXMIND_ACCOUNT_ID
ARG MAXMIND_LICENSE_KEY

RUN addgroup -S app && adduser -S app -G app

COPY package*.json ./

RUN MAXMIND_ACCOUNT_ID=$MAXMIND_ACCOUNT_ID MAXMIND_LICENSE_KEY=$MAXMIND_LICENSE_KEY npm install --omit=dev && npm cache clean --force

COPY src ./src

USER app

EXPOSE 3010

CMD ["node", "src/server.js"]
