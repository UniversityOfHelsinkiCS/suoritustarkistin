FROM cypress/base:14.7.0

# Set timezone to Europe/Helsinki
ENV TZ="Europe/Helsinki"

# Setup
WORKDIR /usr/src/app
ARG SAFE_CHAIN_VERSION=1.5.3
ENV SAFE_CHAIN_DIR=$HOME/.safe-chain

RUN curl -fsSL https://github.com/AikidoSec/safe-chain/releases/download/${SAFE_CHAIN_VERSION}/install-safe-chain.sh | sh -s -- --ci --install-dir "$SAFE_CHAIN_DIR"
ENV PATH="$SAFE_CHAIN_DIR/shims:$SAFE_CHAIN_DIR/bin:${PATH}"
RUN npm safe-chain-verify

COPY package* ./

RUN npm install --production=false

COPY . .

RUN npm run test:build

EXPOSE 8001

CMD ["npm", "run", "start:ci"]
