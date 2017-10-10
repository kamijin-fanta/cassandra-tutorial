FROM node:8.6.0-alpine

RUN mkdir -p /apps/views/
WORKDIR /apps
ADD views/ views/
ADD index.js .
ADD package.json .
ADD data.yaml .
RUN npm i
CMD node index.js cassandra01
