FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath

WORKDIR /var/www/html

COPY backend/composer.json backend/composer.lock* ./
RUN composer install --no-dev --no-interaction --optimize-autoloader

COPY backend/ .

RUN chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache
RUN php artisan config:clear
RUN php artisan route:clear
RUN php artisan cache:clear

EXPOSE 8080

CMD ["php", "artisan", "serve", "--host", "0.0.0.0", "--port", "8080"]