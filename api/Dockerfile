# Use node
FROM node:20-alpine

# Install PM2 globally
RUN yarn global add pm2

# Create app directory
WORKDIR /usr/src/readdig/api

# Copy app source code
COPY . .

# Inatall package
RUN yarn install

# Remove the existing build directory and create a fresh one
RUN rm -rf ./dist && mkdir ./dist

# Build to dist
RUN yarn build

# Copy email files to fresh /dist directory
COPY ./src/utils/email/templates ./dist/utils/email/templates

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 8000
EXPOSE 8000

# Use entrypoint script to run migrations before starting app
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pm2-runtime", "start", "ecosystem.config.prod.cjs"]
