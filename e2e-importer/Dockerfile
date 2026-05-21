FROM node:16

WORKDIR /usr/src/app
COPY package* ./
ARG SAFE_CHAIN_VERSION=1.5.3
ENV SAFE_CHAIN_DIR=$HOME/.safe-chain

RUN curl -fsSL https://github.com/AikidoSec/safe-chain/releases/download/${SAFE_CHAIN_VERSION}/install-safe-chain.sh | sh -s -- --ci --install-dir "$SAFE_CHAIN_DIR"
ENV PATH="$SAFE_CHAIN_DIR/shims:$SAFE_CHAIN_DIR/bin:${PATH}"
RUN npm safe-chain-verify

RUN npm ci

COPY . .

CMD ["npm", "start"]
