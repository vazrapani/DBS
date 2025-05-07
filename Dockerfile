# Use the node image as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY package*.json ./

RUN npm install

COPY . .

# Expose the port on which the API will listen
EXPOSE 3055

# Run the server when the container launches
CMD ["node", "server.js"]