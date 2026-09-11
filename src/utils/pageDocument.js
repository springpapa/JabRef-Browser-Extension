export function withLocation(doc, url) {
  const location = new URL(url);
  return new Proxy(doc, { get(target, prop, receiver) {
    if (prop === "location") return location;
    const value = Reflect.get(target, prop, receiver);
    return typeof value === "function" ? value.bind(target) : value;
  } });
}
