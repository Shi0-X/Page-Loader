Page Loader Utility

### Hexlet tests and linter status:
[![Actions Status](https://github.com/Shi0-X/fullstack-javascript-project-138/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/Shi0-X/fullstack-javascript-project-138/actions)

### Automated Testing and Linting:

[![Automated Testing and Linting.js CI](https://github.com/Shi0-X/Page-Loader/actions/workflows/page-loader-check.yml/badge.svg)](https://github.com/Shi0-X/Page-Loader/actions/workflows/page-loader-check.yml)

### Code Climate Status:
<a href="https://codeclimate.com/github/Shi0-X/Page-Loader/maintainability"><img src="https://api.codeclimate.com/v1/badges/87da6afca644b8a64572/maintainability" /></a>

Descripción
Page Loader Utility es una herramienta de línea de comandos que descarga una página web desde una URL especificada y la guarda en un directorio local. Es ideal para descargar el HTML de una página web rápidamente.

Instalación
Clona el repositorio:

bash
Copiar código
git clone https://github.com/Shi0-X/Page-Loader.git
cd Page-Loader
Instala las dependencias:

npm install
Enlaza el paquete globalmente usando npm link:

npm link

Uso
Comando principal
page-loader [options] <url>
Opciones
-V, --version : Muestra la versión del programa.
-o, --output [dir] : Especifica el directorio de salida (por defecto, el directorio de ejecución actual).
-h, --help : Muestra la ayuda.
Ejemplo de uso

page-loader --output ./output https://example.com
Salida esperada:

./output/example-com.html
Demostración

https://www.youtube.com/watch?v=t1mdQqiZWMw

Se implementa descarga de imagenes:

https://youtu.be/J2NRMq0D-_I

Desmostracion modo Debug:

https://youtu.be/uU4QIdysCuQ

Pruebas
Para ejecutar las pruebas:

npm test

Estructura del archivo descargado
El archivo descargado lleva el nombre basado en la URL proporcionada:
Se eliminan los caracteres especiales.
Se añade .html al final.
Ejemplo:
Entrada: https://example.com
Salida: example-com.html

Tecnologías utilizadas
Node.js
Axios - Para realizar solicitudes HTTP.
Nock - Para realizar pruebas simulando solicitudes HTTP.
Jest - Framework de pruebas.
Commander - Para la creación de la CLI.