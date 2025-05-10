# Use the node image as the base image
FROM node:18-bullseye

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY package*.json ./
RUN npm install

# Python3, pip3 설치
RUN apt-get update && apt-get install -y python3 python3-pip

# requirements.txt를 먼저 복사
COPY requirements.txt .

# pip로 패키지 설치 (설치 로그 확인)
RUN pip3 install --no-cache-dir -r requirements.txt

# flask 설치 확인 (import 테스트)
RUN python3 -c "import flask; import flask_cors"

COPY . .

# Expose the port on which the API will listen
EXPOSE 3055

# Run the server when the container launches
CMD sh -c "python3 api_server.py & node server.js"