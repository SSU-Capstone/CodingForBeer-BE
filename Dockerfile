FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 8082

CMD [ "node", "server.js"]