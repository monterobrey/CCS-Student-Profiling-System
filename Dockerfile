FROM php:8.2

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY backend/composer.json backend/composer.lock* ./
COPY backend/.env.production .env

RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts

COPY backend/ .

RUN mkdir -p storage bootstrap/cache && chmod -R 777 storage bootstrap/cache

RUN php artisan key:generate --no-interaction --force

EXPOSE $PORT

CMD ["php", "artisan", "serve", "--host", "0.0.0.0", "--port", "$PORT"]