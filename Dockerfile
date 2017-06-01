FROM node:6

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app/@magda/csw-connector
CMD [ "node", "/usr/src/app/@magda/csw-connector/bin/index.js" ]
