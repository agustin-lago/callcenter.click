'use strict';

const CONTENT_FILE = 'content.md';

const ICONS = {
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  card: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9 8H7v-2h4v2zm6-4H7v-2h10v2z"/><path d="M16 3H8L6 7h12l-2-4z"/></svg>',
  crown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1h14v1z"/></svg>',
  support: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'
};

function parseContent(source) {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  const settings = {};
  const blocks = [];
  let index = 0;

  if (lines[index] && lines[index].trim() === '---') {
    index += 1;
    while (index < lines.length && lines[index].trim() !== '---') {
      const separator = lines[index].indexOf(':');
      if (separator > 0) {
        const key = lines[index].slice(0, separator).trim().toLowerCase();
        const value = lines[index].slice(separator + 1).trim();
        settings[key] = value;
      }
      index += 1;
    }
    index += 1;
  }

  while (index < lines.length) {
    const opening = lines[index].trim().match(/^:::(text|box|button|card)(?:\s+([\w-]+))?$/i);
    if (!opening) {
      index += 1;
      continue;
    }

    const type = opening[1].toLowerCase();
    const variant = (opening[2] || '').toLowerCase();
    const body = [];
    index += 1;

    while (index < lines.length && lines[index].trim() !== ':::') {
      body.push(lines[index]);
      index += 1;
    }

    if (index >= lines.length) {
      throw new Error('El bloque ' + type + ' no tiene cierre :::');
    }

    blocks.push({ type, variant, content: body.join('\n').trim() });
    index += 1;
  }

  return { settings, blocks };
}

function appendFormattedText(element, content) {
  const parts = content.split(/(\*\*.*?\*\*|\n)/g);

  parts.forEach((part) => {
    if (part === '\n') {
      element.append(document.createElement('br'));
    } else if (part.startsWith('**') && part.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      element.append(strong);
    } else if (part) {
      element.append(document.createTextNode(part));
    }
  });
}

function createTextBlock(block) {
  const element = document.createElement('div');
  const allowedStyles = ['welcome', 'welcome2', 'footer'];
  element.className = allowedStyles.includes(block.variant) ? block.variant : 'content-text';
  appendFormattedText(element, block.content);
  return element;
}

function createBox(block) {
  const secondary = block.variant === 'secondary';
  const box = document.createElement('div');
  box.className = secondary ? 'box2' : 'box';

  block.content.split(/\r?\n/).filter((line) => line.trim()).forEach((line) => {
    const paragraph = document.createElement('p');
    const isBig = line.trim().startsWith('# ');
    paragraph.className = isBig ? 'big' : secondary ? 'box2-text' : 'box-text';
    appendFormattedText(paragraph, isBig ? line.trim().slice(2) : line.trim());
    box.append(paragraph);
  });

  return box;
}

function createButton(block) {
  const match = block.content.match(/^\[([^\]]+)]\(([^)]+)\)$/s);
  if (!match) {
    throw new Error('El contenido de un botón debe tener el formato [Texto](URL).');
  }

  const url = new URL(match[2].trim(), document.baseURI);
  if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
    throw new Error('El botón contiene una URL no permitida.');
  }

  const button = document.createElement('a');
  button.className = 'cta';
  button.href = url.href;
  button.target = '_blank';
  button.rel = 'noopener noreferrer';
  button.textContent = match[1];
  return button;
}

function createCard(block) {
  const card = document.createElement('div');
  card.className = 'icon-box';

  const icon = ICONS[block.variant] || ICONS.star;
  card.insertAdjacentHTML('beforeend', icon);

  const text = document.createElement('p');
  text.textContent = block.content;
  card.append(text);
  return card;
}

function renderPage(settings, blocks) {
  const root = document.getElementById('content');
  root.replaceChildren();
  document.title = settings.title || 'Call center';

  let logo = null;
  if (settings.logo) {
    logo = document.createElement('img');
    logo.className = 'logo';
    logo.src = settings.logo;
    logo.alt = settings.logo_alt || '';
  }

  let cardGroup = null;
  let boxGroup = null;
  let logoPlaced = false;

  blocks.forEach((block) => {
    if (block.type === 'card') {
      boxGroup = null;
      if (!cardGroup) {
        cardGroup = document.createElement('div');
        cardGroup.className = 'icons';
        root.append(cardGroup);
      }
      cardGroup.append(createCard(block));
      return;
    }

    cardGroup = null;
    if (block.type === 'box') {
      if (!boxGroup) {
        boxGroup = document.createElement('div');
        boxGroup.className = 'boxes';
        root.append(boxGroup);
      }
      boxGroup.append(createBox(block));
      return;
    }

    boxGroup = null;
    if (block.type === 'text') {
      root.append(createTextBlock(block));
      if (logo && !logoPlaced && block.variant === 'welcome') {
        root.append(logo);
        logoPlaced = true;
      }
    }
    if (block.type === 'button') root.append(createButton(block));
  });

  if (logo && !logoPlaced) root.prepend(logo);
}

async function loadContent() {
  const root = document.getElementById('content');

  try {
    const response = await fetch(CONTENT_FILE, { cache: 'no-cache' });
    if (!response.ok) throw new Error('No se pudo cargar ' + CONTENT_FILE + '.');

    const content = parseContent(await response.text());
    renderPage(content.settings, content.blocks);
  } catch (error) {
    console.error(error);
    const message = document.createElement('p');
    message.className = 'content-error';
    message.textContent = 'No se pudo cargar el contenido de la página.';
    root.replaceChildren(message);
  }
}

loadContent();
