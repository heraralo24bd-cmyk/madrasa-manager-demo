window.MM = window.MM || {};
MM.pageHelp = (() => {
  const e = value => MM.util.esc(value);
  const icon = name => '<svg aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  const copyButton = (field, title) => '<button type="button" class="btn btn-ghost help-copy" data-copy="' + field + '" title="' + title + '" aria-label="' + title + '">' + icon('file') + '</button>';
  const openButton = (kind, label, symbol = 'chevron') => '<button type="button" class="btn btn-primary" data-contact="' + kind + '">' + icon(symbol) + label + '</button>';

  async function copy(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const previous = document.activeElement;
    const input = document.createElement('textarea');
    input.value = text;
    input.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.append(input);
    input.select();
    const ok = document.execCommand('copy');
    input.remove();
    previous?.focus();
    if (!ok) throw new Error('কপি করা যায়নি।');
  }

  async function render(root) {
    root.innerHTML = '<section class="help-page"><div class="r-empty">লোড হচ্ছে</div></section>';
    const section = root.querySelector('.help-page');
    try {
      const [info, app] = await Promise.all([MM.tauri.invoke('support_info'), MM.tauri.invoke('app_info')]);
      if (!root.contains(section)) return;
      section.innerHTML =
        '<header class="help-heading"><img src="assets/support-logo.png" width="72" height="72" alt="Madrasa Manager"><div><h2>সাহায্য ও যোগাযোগ</h2><p>Madrasa Manager</p></div></header>' +
        '<div class="help-contacts">' +
        '<div class="help-row"><div class="help-detail"><h3>ফোন</h3><p dir="ltr" data-phone>' + e(info.phone) + '</p></div><div class="help-actions">' + copyButton('phone', 'ফোন নম্বর কপি') + openButton('phone', 'কল') + '</div></div>' +
        '<div class="help-row"><div class="help-detail"><h3>হোয়াটসঅ্যাপ</h3><p dir="ltr">' + e(info.phone) + '</p></div><div class="help-actions">' + openButton('whatsapp', 'খুলুন') + '</div></div>' +
        '<div class="help-row"><div class="help-detail"><h3>ইমেইল</h3><p dir="ltr" data-email>' + e(info.email) + '</p></div><div class="help-actions">' + copyButton('email', 'ইমেইল কপি') + openButton('email', 'লিখুন', 'mail') + '</div></div>' +
        '<div class="help-row"><div class="help-detail"><h3>ঠিকানা</h3><p data-address>' + e(info.address) + '</p></div><div class="help-actions">' + copyButton('address', 'ঠিকানা কপি') + '</div></div></div>' +
        '<div class="help-status" role="status" aria-live="polite"></div>' +
        '<footer class="help-version"><span>সফটওয়্যার</span><b>' + e(app.name) + ' v' + e(app.version) + '</b></footer>';
      const status = section.querySelector('.help-status');
      section.querySelectorAll('[data-copy], [data-contact]').forEach(button => {
        button.onclick = async () => {
          if (button.disabled) return;
          button.disabled = true;
          status.classList.remove('bad');
          status.textContent = '';
          try {
            if (button.dataset.copy) {
              await copy(info[button.dataset.copy]);
              status.textContent = MM.i18n?.lang === 'en' ? 'Copied' : 'কপি করা হয়েছে';
            } else await MM.tauri.invoke('support_open', { kind: button.dataset.contact });
          } catch (error) {
            status.classList.add('bad');
            status.textContent = String(error);
          } finally { if (button.isConnected) button.disabled = false; }
        };
      });
      MM.i18n?.apply(MM.i18n.lang);
    } catch (error) {
      if (root.contains(section)) {
        section.innerHTML = '<h2>সাহায্য ও যোগাযোগ</h2><div class="r-error">' + e(error) + '</div>';
      }
    }
  }
  return { render };
})();
