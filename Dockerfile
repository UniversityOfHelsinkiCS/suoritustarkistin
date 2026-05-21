FROM registry.access.redhat.com/ubi8/nodejs-14

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

ARG BASE_PATH
ENV BASE_PATH=$BASE_PATH
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
ARG SAFE_CHAIN_VERSION=1.5.3
ENV SAFE_CHAIN_DIR=$HOME/.safe-chain

RUN curl -fsSL https://github.com/AikidoSec/safe-chain/releases/download/${SAFE_CHAIN_VERSION}/install-safe-chain.sh | sh -s -- --ci --install-dir "$SAFE_CHAIN_DIR"
ENV PATH="$SAFE_CHAIN_DIR/shims:$SAFE_CHAIN_DIR/bin:${PATH}"
RUN safe-chain --version

# Setup
COPY package* ./
RUN npm ci -f --omit-dev --ignore-scripts
COPY . .

RUN npm run build

EXPOSE 7000

CMD ["npm", "start"]
