# Use Node.js Alpine image for a smaller footprint
FROM node:10-alpine

# Create app directory and set permissions
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# Set working directory
WORKDIR /home/node/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Switch to non-root user
USER node

# Install dependencies
RUN npm install

# Copy application files
COPY --chown=node:node . .

# Expose application port
EXPOSE 3000

# Run the application
CMD ["node", "index.js"]
