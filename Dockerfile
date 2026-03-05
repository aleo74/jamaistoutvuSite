# Dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY . /usr/share/nginx/html/
# Nginx sert déjà /usr/share/nginx/html sur le port 80