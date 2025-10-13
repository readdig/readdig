# Use the latest version of Node
FROM node:20-alpine as builder

# Create app directory
WORKDIR /usr/src/readdig/app

# Copy app source code
COPY . .

# Inatall package and build
RUN yarn install

# Build arguments for React environment variables
ARG REACT_APP_PRODUCT_URL
ARG REACT_APP_PRODUCT_NAME
ARG REACT_APP_PRODUCT_DESCRIPTION
ARG REACT_APP_API_URL
ARG REACT_APP_SENTRY_DSN
ARG REACT_APP_PADDLE_VENDOR_ID

# Build app
RUN yarn build

# Use the latest version of Nginx
FROM nginx:latest

# Copy build file
COPY --from=builder /usr/src/readdig/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
