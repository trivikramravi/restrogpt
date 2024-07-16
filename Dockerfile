# --------------> The build image
FROM node:18 AS build
WORKDIR /roma/app

COPY . .

# Manually remove NX cache to avoid integrity issues
RUN rm -rf /roma/app/.nx/cache
COPY ./package.json /roma/app

RUN npm install

# Reset NX cache
RUN npx nx reset

# --------------> The production image
FROM node:18
WORKDIR /roma/app

COPY ./package.json /roma/app
COPY docker-entrypoint.sh /roma/app/docker-entrypoint.sh
RUN chmod +x /roma/app/docker-entrypoint.sh
RUN npm install
RUN npm install -g nx

# Clear the cache before the build
RUN rm -rf /roma/app/.nx/cache
COPY --from=build /roma/app/node_modules /roma/app/node_modules
COPY --from=build /roma/app ./
COPY ./ .

ENV NODE_ENV=development
EXPOSE 3000
ENTRYPOINT ["/roma/app/docker-entrypoint.sh"]
CMD ["nx", "serve", "web-agent", "--verbose"]
