# Dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
# Nginx sert déjà /usr/share/nginx/html sur le port 80