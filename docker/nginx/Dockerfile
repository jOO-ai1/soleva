FROM nginx:alpine

# Remove the default.conf file to avoid conflicts
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/production.conf /etc/nginx/conf.d/production.conf

# Create necessary directories
RUN mkdir -p /var/www/certbot /var/log/nginx

# Set proper permissions
RUN chown -R nginx:nginx /var/www/certbot /var/log/nginx

# Expose ports
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
