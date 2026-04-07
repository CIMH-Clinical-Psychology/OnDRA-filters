// Replaces any <select> with more than 10 options with a live-filter combobox.
// The original <select> stays hidden so form submission is unaffected.

const THRESHOLD = 10;

function makeCombobox(select) {
  const allOptions = Array.from(select.options).map(o => ({
    value: o.value,
    text: o.text
  }));

  // --- input ---
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Filter…';
  input.value = select.options[select.selectedIndex]?.text ?? '';
  input.autocomplete = 'off';
  input.style.cssText = [
    'width: 100%',
    'box-sizing: border-box',
    'padding: 3px 6px',
    'border: 1px solid #ccc',
    'border-radius: 3px',
    'font-size: 12px'
  ].join(';');

  // --- dropdown list ---
  const list = document.createElement('ul');
  list.style.cssText = [
    'position: absolute',
    'z-index: 9999',
    'background: #fff',
    'border: 1px solid #ccc',
    'border-top: none',
    'border-radius: 0 0 3px 3px',
    'margin: 0',
    'padding: 0',
    'list-style: none',
    'max-height: 220px',
    'overflow-y: auto',
    'display: none',
    'box-shadow: 0 4px 8px rgba(0,0,0,.15)'
  ].join(';');

  // --- wrapper to anchor the absolute list ---
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position: relative; width: 100%;';
  wrapper.appendChild(input);
  wrapper.appendChild(list);

  select.style.display = 'none';
  select.parentNode.insertBefore(wrapper, select);

  let activeIndex = -1;

  function buildList(term) {
    list.innerHTML = '';
    activeIndex = -1;
    const lower = term.toLowerCase();
    const matches = term
      ? allOptions.filter(o =>
          o.text.toLowerCase().includes(lower) ||
          o.value.toLowerCase().includes(lower)
        )
      : allOptions;

    matches.forEach((o, i) => {
      const li = document.createElement('li');
      li.textContent = o.text || '(leer)';
      li.dataset.value = o.value;
      li.style.cssText = [
        'padding: 4px 8px',
        'cursor: pointer',
        'font-size: 12px',
        'white-space: nowrap',
        'overflow: hidden',
        'text-overflow: ellipsis'
      ].join(';');
      li.addEventListener('mousedown', e => {
        e.preventDefault(); // keep focus on input
        selectOption(o);
      });
      li.addEventListener('mouseover', () => setActive(i));
      list.appendChild(li);
    });

    list.style.display = matches.length ? 'block' : 'none';
  }

  function setActive(index) {
    const items = list.querySelectorAll('li');
    items.forEach(li => li.style.background = '');
    activeIndex = index;
    if (index >= 0 && index < items.length) {
      items[index].style.background = '#e8f0fe';
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }

  function selectOption(o) {
    input.value = o.text;
    select.value = o.value;
    // fire change so any existing onchange handlers still run
    select.dispatchEvent(new Event('change', { bubbles: true }));
    list.style.display = 'none';
  }

  function closeList() {
    list.style.display = 'none';
    // if input doesn't match a valid option, restore last valid selection
    const matched = allOptions.find(o => o.text === input.value);
    if (!matched) {
      input.value = allOptions.find(o => o.value === select.value)?.text ?? '';
    }
  }

  input.addEventListener('input', () => buildList(input.value));

  input.addEventListener('focus', () => buildList(input.value));

  input.addEventListener('blur', () => {
    // slight delay so mousedown on list items fires first
    setTimeout(closeList, 150);
  });

  input.addEventListener('keydown', e => {
    const items = list.querySelectorAll('li');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        const val = items[activeIndex].dataset.value;
        selectOption(allOptions.find(o => o.value === val));
      }
    } else if (e.key === 'Escape') {
      closeList();
      input.blur();
    }
  });
}

document.querySelectorAll('select').forEach(sel => {
  if (sel.options.length > THRESHOLD) {
    makeCombobox(sel);
  }
});
