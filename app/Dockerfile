# Use the latest version of Node
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /usr/src/readdig/app

# Copy app source code
COPY . .

# Install package and build
RUN yarn install

# Build app
RUN yarn build

# Use the latest version of Nginx
FROM nginx:latest

# Copy build file
COPY --from=builder /usr/src/readdig/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
