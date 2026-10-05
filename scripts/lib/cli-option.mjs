// Preserve embedded '=' characters in URLs and other option values.
export const optionValue = (argv, name, fallback) => argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
