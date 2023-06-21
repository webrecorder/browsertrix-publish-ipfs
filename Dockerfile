FROM node:20

WORKDIR /app/

ADD package.json /app/package.json
RUN yarn install

ADD index.js /app/
ADD src/*.js /app/src/
ADD replay.car /app/

CMD node index.js
