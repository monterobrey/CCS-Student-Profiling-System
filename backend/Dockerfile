FROM oven/laravel:php8.2-fpm

RUN rm -rf /var/www/html/var/cache/* /var/www/html/var/log/*

COPY --chown=laravel:laravel . /var/www/html

RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8080

CMD ["sh", "/start.sh"]