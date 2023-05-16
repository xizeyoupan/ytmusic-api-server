基于Meting-API的音乐反代，支持ytmusic和spotify。

## docker

intemd/ytmusic-api

sudo docker run -d --name meting-additional -p 3000:3000 intemd/ytmusic-api:latest

## 环境变量/配置

- PORT：caddy内部监听端口，也是默认暴露端口
- UID/GID
