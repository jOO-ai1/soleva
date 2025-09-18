FROM nginx:alpine

# Remove the default.conf file to avoid conflicts
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/
COPY startup.sh /usr/local/bin/startup.sh

# Create necessary directories
RUN mkdir -p /var/www/certbot /var/log/nginx

# Set proper permissions
RUN chown -R nginx:nginx /var/www/certbot /var/log/nginx
RUN chmod +x /usr/local/bin/startup.sh

# Expose ports
EXPOSE 80 443

# Start Nginx with SSL detection
CMD ["/usr/local/bin/startup.sh"]
