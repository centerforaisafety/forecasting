# Dockerfile

## Authentication
```bash
# Use credentials for centerforaisafety docker hub account
docker login
```

## Build
```bash
cd {path}/forecasting_platform/backend/src/

# Apple Silicon
docker build --platform linux/arm64 -t centerforaisafety/image-repo:forecasting-backend-linux-arm64 .

# x86
docker build --platform linux/amd64 -t centerforaisafety/image-repo:forecasting-backend-linux-amd64 .
```

## Run
```bash
# Create network
docker network create forecasting-network

# Apple Silicon
docker run -d -p 8089:8089 --network forecasting-network --name forecasting-backend centerforaisafety/image-repo:forecasting-backend-linux-arm64

# x86
docker run -d -p 8089:8089 --network forecasting-network --name forecasting-backend centerforaisafety/image-repo:forecasting-backend-linux-amd64
```

## Push
```bash
# Apple Silicon
docker push centerforaisafety/image-repo:forecasting-backend-linux-arm64

# x86
docker push centerforaisafety/image-repo:forecasting-backend-linux-amd64
```