import path from 'path';

// 🔹 Normaliza nombres eliminando caracteres no válidos
const processName = (name, replacer = '-') => name.match(/\w*/gi)  // Extrae partes alfanuméricas del string
  .filter((x) => x)   // Filtra valores vacíos
  .join(replacer);    // Une los valores con el `replacer`

// 🔹 Convierte una URL en un nombre de archivo seguro (ej. "example-com-path-to-page.html")
export const urlToFilename = (link, defaultFormat = '.html') => {
  const { dir, name, ext } = path.parse(link);
  const slug = processName(dir + name);
  const format = ext || defaultFormat;

  return `${slug}${format}`;
};

// 🔹 Convierte una URL en un nombre de directorio seguro (ej. "example-com-path-to-page_files")
export const urlToDirname = (link, postfix = '_files') => {
  const { dir, name } = path.parse(link);
  const slug = processName(dir + name);

  return `${slug}${postfix}`;
};

// 🔹 Obtiene la extensión de un archivo
export const getExtension = (fileName) => path.extname(fileName);
