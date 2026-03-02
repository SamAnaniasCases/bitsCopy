FROM node:20-alpine

WORKDIR /src

COPY ..

RUN npm install

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "run", "dev"]