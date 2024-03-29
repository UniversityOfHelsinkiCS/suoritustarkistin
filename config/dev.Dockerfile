FROM node:14.17

# Set timezone to Europe/Helsinki
ENV TZ="Europe/Helsinki"

# Setup
WORKDIR /usr/src/app
COPY . .

EXPOSE 8000

CMD ["npm", "run", "start:dev"]