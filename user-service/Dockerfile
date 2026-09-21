FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev

COPY . .

EXPOSE 5001

CMD ["npm", "start"]
