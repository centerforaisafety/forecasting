# Use Ubuntu 24.04 as the base image
FROM ubuntu:24.04

# Update Ubuntu Software repository
RUN apt update 

# Upgrade packages 
RUN apt upgrade -y

# Install npm
RUN apt install -y npm

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy the rest of your app's source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app using serve
CMD ["npm", "run", "dev"]