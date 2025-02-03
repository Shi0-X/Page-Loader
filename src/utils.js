import path from 'path';

// 🔹 Normaliza nombres eliminando caracteres no válidos
const processName = (name, replacer = '-') => name
  .replace(/[?&=]/g, '')  // Elimina caracteres problemáticos para nombres de archivos
  .match(/\w+/gi)         // Extrae partes alfanuméricas del string
  .join(replacer);        // Une los valores con el `replacer`

// 🔹 Convierte una URL en un nombre de archivo seguro
export const urlToFilename = (link, defaultFormat = '.html') => {
  const { dir, name, ext } = path.parse(link);
  const slug = processName(path.join(dir, name));
  const format = ext || defaultFormat;

  return `${slug}${format}`;
};

// 🔹 Convierte una URL en un nombre de directorio seguro
export const urlToDirname = (link, postfix = '_files') => {
  const { dir, name, ext } = path.parse(link);
  const slug = processName(path.join(dir, name, ext));

  return `${slug}${postfix}`;
};

// 🔹 Obtiene la extensión de un archivo
export const getExtension = (fileName) => path.extname(fileName);

// 🔹 Evita que `outputDirName` apunte a directorios restringidos
export const sanitizeOutputDir = (dir) => {
  const restrictedPaths = ['/sys', '/etc', '/bin', '/usr', '/lib'];
  return restrictedPaths.includes(dir) ? null : dir; // Retorna null en vez de lanzar error
};
