import path from 'path';

// 🔹 Normaliza nombres eliminando caracteres no válidos
const processName = (name, replacer = '-') => name
  .replace(/[?&=]/g, '')  // Elimina caracteres problemáticos para nombres de archivos
  .match(/\w+/gi)         // Extrae partes alfanuméricas del string
  .join(replacer);        // Une los valores con el `replacer`

// 🔹 Convierte una URL en un nombre de archivo seguro (ej. "example-com-path-to-page.html")
export const urlToFilename = (link, defaultFormat = '.html') => {
  const { dir, name, ext } = path.parse(link);
  const slug = processName(path.join(dir, name));
  const format = ext || defaultFormat;

  return `${slug}${format}`;
};

// 🔹 Convierte una URL en un nombre de directorio seguro (ej. "example-com-path-to-page_files")
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
  if (restrictedPaths.includes(dir)) {
    throw new Error(`❌ No se puede usar el directorio restringido: ${dir}`);
  }
  return dir;
};
