FROM node:6

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app/component
ENTRYPOINT [ "node", "/usr/src/app/component/bin/index.js" ]
