# Use official Node.js lightweight image
FROM node:18-alpine

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory inside the container
WORKDIR /app

# Copy package definition files first (including lockfile if present)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["pnpm", "run", "dev"]
