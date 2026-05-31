export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) { node.replaceChildren(); return node; }
export function byId(id) { return document.getElementById(id); }
export function button(text, attrs = {}) { return el('button', { ...attrs, text }); }
export function navButton(text, path, attrs = {}) { return button(text, { ...attrs, 'data-nav': path }); }
