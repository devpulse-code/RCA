# RCA/docker/nginx/Dockerfile
FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

RUN addgroup -S nginxgroup && adduser -S nginxuser -G nginxgroup
USER nginxuser
# end of RCA/docker/nginx/Dockerfile