FROM ubuntu:18.04 as builder

RUN apt-get update \
    && apt-get install -y libusb-1.0-0-dev build-essential git curl gnupg gcc-4.8 g++-4.8 \
    && export CXX=g++-4.8

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs
#RUN apt-get install -y npm
RUN npm install yarn -g

COPY package.json yarn.lock* ./
RUN yarn install --no-optional
#RUN apt-get install -y python
#RUN python -V
WORKDIR /app
COPY . .

RUN yarn

COPY localhost.env .env
RUN NODE_ENV=production yarn build

FROM node:10-slim

COPY --from=builder /app .

#RUN yarn add pm2 -G
#RUN npm i node-hid
EXPOSE 3003
#ENTRYPOINT [ "yarn", "pm2", "start", "--no-daemon" ]
#ENTRYPOINT [ "npm", "start"]
CMD [ "npm", "start" ]
