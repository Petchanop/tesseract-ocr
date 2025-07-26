FROM node:lts-bookworm-slim AS base

RUN apt update && apt upgrade
RUN npm install -g ts-node typescript

FROM base AS development
EXPOSE 3444
CMD ["sleep", "infinity"]