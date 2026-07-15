FROM node:20-slim

# Set environment variables for Puppeteer and Node
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROME_PATH=/usr/bin/chromium \
    NODE_ENV=production

# Install system dependencies for Puppeteer & Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Ensure uploads directories exist inside the container
RUN mkdir -p uploads temp_uploads

# Expose the application port
EXPOSE 5000

# Start the application using Node directly (avoiding nodemon in production container)
CMD ["node", "server.js"]
