FROM node:16

WORKDIR /usr/src/app
COPY package* ./
ARG SAFE_CHAIN_VERSION=1.5.3

RUN curl -fsSL https://github.com/AikidoSec/safe-chain/releases/download/${SAFE_CHAIN_VERSION}/install-safe-chain.sh | sh -s -- --ci --install-dir /opt/safe-chain
ENV PATH="/opt/safe-chain/shims:/opt/safe-chain/bin:${PATH}"
RUN npm safe-chain-verify

RUN npm ci

COPY . .

CMD ["npm", "start"]
