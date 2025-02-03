import path from 'path';

const processName = (name, replacer = '-') => name
  .replace(/[?&=]/g, '')
  .match(/\w+/gi)
  .join(replacer);

export const urlToFilename = (link, defaultFormat = '.html') => {
  const { dir, name, ext } = path.parse(link);
  const slug = processName(path.join(dir, name));
  const format = ext || defaultFormat;
  return `${slug}${format}`;
};

export const urlToDirname = (link, postfix = '_files') => {
  const { dir, name, ext } = path.parse(link);
  const slug = processName(path.join(dir, name, ext));
  return `${slug}${postfix}`;
};

export const getExtension = (fileName) => path.extname(fileName);

export const sanitizeOutputDir = (dir) => {
  const restrictedPaths = ['/sys', '/etc', '/bin', '/usr', '/lib'];
  const finalDir = dir || process.cwd();
  return restrictedPaths.includes(finalDir) ? null : finalDir;
};
