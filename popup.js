const themeForm = document.querySelector('fieldset');
const status = document.querySelector('#status');

chrome.storage.sync.get({ theme: 'blue' }, ({ theme }) => {
  const input = themeForm.querySelector(`[value="${theme}"]`) || themeForm.querySelector('[value="blue"]');
  input.checked = true;
});

themeForm.addEventListener('change', ({ target }) => {
  if (!target.matches('input[name="theme"]')) return;

  chrome.storage.sync.set({ theme: target.value }, () => {
    status.textContent = target.value === 'off'
      ? 'Tryb ciemny został wyłączony.'
      : 'Motyw został zastosowany.';

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.url?.startsWith('https://edu.pans.wloclawek.pl/')) {
        chrome.tabs.reload(tab.id);
      }
    });
  });
});
