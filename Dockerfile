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

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

COPY backend/composer.json backend/composer.lock* ./
COPY backend/.env.production .env

RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts

COPY backend/ .

RUN chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache
RUN php artisan key:generate --force
RUN php artisan config:clear
RUN php artisan route:clear

EXPOSE 80

CMD ["php", "artisan", "serve", "--host", "0.0.0.0", "--port", "80"]