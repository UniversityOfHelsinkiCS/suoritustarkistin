FROM node:24

# Set timezone to Europe/Helsinki
ENV TZ="Europe/Helsinki"

# Setup
WORKDIR /usr/src/app

# Installed in the image: the host's node_modules may hold macOS binaries that do not run here
COPY package* ./
COPY .npmrc ./
RUN npm ci

COPY . .

EXPOSE 8000

CMD ["npm", "run", "start:dev"]