/* =======================================
   main.js — وظائف مشتركة بين جميع الصفحات
======================================= */

/* --- ARTICLES STATE --- */
// Merge stored articles with DEFAULT_ARTICLES: keep admin-written articles + add any new defaults
const _storedArticles = JSON.parse(localStorage.getItem('altaraf_v1_articles') || 'null');
let articles;
if (_storedArticles) {
  const storedIds = new Set(_storedArticles.map(a => a.id));
  const missing = DEFAULT_ARTICLES.filter(a => !storedIds.has(a.id));
  articles = [..._storedArticles, ...missing].sort((a, b) => new Date(b.date) - new Date(a.date));
} else {
  articles = JSON.parse(JSON.stringify(DEFAULT_ARTICLES));
}

function saveArticles() {
  localStorage.setItem('altaraf_v1_articles', JSON.stringify(articles));
}

/* --- NOTIFICATION --- */
function showNotif(msg, duration = 3200) {
  const n = document.getElementById('notif');
  if (!n) return;
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), duration);
}

/* --- SCROLL REVEAL --- */
function initReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(el => obs.observe(el));
}

/* --- COUNTER ANIMATION --- */
function initCounters() {
  var els = document.querySelectorAll('.stat-num[data-target]');
  if (!els.length) return;

  function runCounter(el) {
    if (el._counted) return;
    el._counted = true;
    var target   = parseInt(el.getAttribute('data-target'));
    var duration = 2000;
    var start    = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var cur   = Math.floor(eased * target);
      el.textContent = cur.toLocaleString('en') + (progress < 1 ? '' : '+');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { runCounter(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(function(el) { el.textContent = '0'; obs.observe(el); });
  } else {
    // fallback: شغّل مباشرة
    els.forEach(function(el) { el.textContent = '0'; runCounter(el); });
  }
}

/* --- MOBILE MENU --- */
function toggleMenu() {
  document.getElementById('nav-links').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('nav-links').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

/* --- MODAL --- */
function openModal(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}
function overlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

/* --- ARTICLE CARD HTML --- */
function articleCardHTML(a) {
  const href = a.url ? a.url : `article.html?id=${a.id}`;
  return `
  <a class="article-card" href="${href}">
    <div class="article-cover">
      ${a.image ? `<img src="${a.image}" alt="${a.title}">` : `<div class="article-cover-placeholder">📰</div>`}
    </div>
    <div class="article-body">
      <div class="article-tag">${a.tag}</div>
      <div class="article-title">${a.title}</div>
      <div class="article-excerpt">${a.excerpt}</div>
      <div class="article-meta">
        <span>✍️ ${a.author}</span>
        <span>📅 ${a.date}</span>
      </div>
    </div>
  </a>`;
}

/* --- ADD ARTICLE FORM --- */
function openAddArticle() {
  openModal('✍️ إضافة مقال جديد', `
    <div class="form-group">
      <label>عنوان المقال *</label>
      <input type="text" id="af-title" placeholder="عنوان جذاب وواضح...">
    </div>
    <div class="form-group">
      <label>مقتطف / وصف مختصر *</label>
      <textarea id="af-excerpt" rows="3" placeholder="وصف مختصر يظهر في بطاقة المقال..."></textarea>
    </div>
    <div class="form-group">
      <label>التصنيف / الوسم *</label>
      <input type="text" id="af-tag" placeholder="مثال: كمرات، أنابيب، صيانة، نصائح...">
    </div>
    <div class="form-group">
      <label>اسم الكاتب</label>
      <input type="text" id="af-author" value="فريق أشكال الترف">
    </div>
    <div class="form-group">
      <label>صورة الغلاف</label>
      <div class="img-upload-zone" id="img-zone">
        <span class="img-upload-icon">🖼️</span>
        <div class="img-upload-text">اضغط أو اسحب صورة هنا<br><small style="color:rgba(138,155,176,.5)">JPG · PNG · WEBP – حد أقصى 5 ميجابايت</small></div>
        <input type="file" id="af-img" accept="image/jpeg,image/png,image/webp">
        <img id="img-preview" class="img-preview">
      </div>
    </div>
    <div class="form-group">
      <label>محتوى المقال *</label>
      <textarea id="af-content" rows="13" placeholder="اكتب محتوى المقال هنا... استخدم أسطراً جديدة للفقرات."></textarea>
    </div>
    <div style="display:flex;gap:1rem;padding-top:.5rem">
      <button class="btn-primary" style="flex:1" onclick="saveArticle()">🚀 نشر المقال</button>
      <button class="btn-outline" onclick="closeModal()">إلغاء</button>
    </div>
  `);
  setupImgUpload();
}

function setupImgUpload() {
  const inp = document.getElementById('af-img');
  const preview = document.getElementById('img-preview');
  const zone = document.getElementById('img-zone');
  if (!inp) return;
  inp.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showNotif('⚠️ حجم الصورة يجب أن يكون أقل من 5 ميجابايت'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result; preview.style.display = 'block';
      zone.style.borderColor = 'var(--gold)'; zone.style.background = 'rgba(201,168,76,.04)';
    };
    reader.readAsDataURL(file);
  });
}

function saveArticle() {
  const title   = document.getElementById('af-title')?.value?.trim();
  const excerpt = document.getElementById('af-excerpt')?.value?.trim();
  const tag     = document.getElementById('af-tag')?.value?.trim();
  const author  = document.getElementById('af-author')?.value?.trim() || 'فريق أشكال الترف';
  const content = document.getElementById('af-content')?.value?.trim();
  const preview = document.getElementById('img-preview');
  const image   = (preview && preview.style.display !== 'none' && preview.src.startsWith('data:')) ? preview.src : null;

  if (!title || !excerpt || !tag || !content) {
    showNotif('⚠️ يرجى ملء جميع الحقول الإلزامية (*)');
    return;
  }
  const newArticle = {
    id: Date.now(), title, excerpt, tag, author, content, image,
    date: new Date().toISOString().split('T')[0]
  };
  articles.unshift(newArticle);
  saveArticles();
  closeModal();
  showNotif('✅ تم نشر المقال بنجاح!');
  setTimeout(() => location.reload(), 800);
}

function deleteArticle(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع.')) return;
  articles = articles.filter(a => a.id !== id);
  saveArticles();
  showNotif('🗑️ تم حذف المقال');
  setTimeout(() => { window.location.href = 'articles.html'; }, 900);
}

/* ==============================
   RANDOM PHONE PICKER
   (يقرأ الأرقام من إعدادات الـ admin إذا وُجدت)
============================== */
const _adminSettings = (() => { try { const v = localStorage.getItem('altaraf_v1_settings'); return v ? JSON.parse(v) : {}; } catch { return {}; } })();
const PHONES = (_adminSettings.phones && _adminSettings.phones.length >= 2) ? _adminSettings.phones : ['0503728688', '0580295393'];

// يختار رقم واحد عند تحميل الصفحة ويستخدمه للزرين معاً
const _picked  = PHONES[Math.floor(Math.random() * PHONES.length)];
const _waNum   = '966' + _picked.slice(1);   // → 966XXXXXXXXX
const _waMsg   = encodeURIComponent('مرحباً، أود الاستفسار عن عرض سعر من أشكال الترف للحديد الصناعي');
const _waLink  = `https://wa.me/${_waNum}?text=${_waMsg}`;
const _callLink = `tel:${_picked}`;

function injectFloatingBtns() {
  const wrap = document.createElement('div');
  wrap.className = 'float-btns';
  wrap.innerHTML = `
    <!-- زر واتساب – عرض سعر -->
    <a class="float-btn float-btn-wa" href="${_waLink}" target="_blank" rel="noopener" aria-label="عرض سعر عبر واتساب">
      <span class="float-btn-icon">
        <svg viewBox="0 0 24 24" fill="currentColor" width="21" height="21">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </span>
      عرض سعر
    </a>

    <!-- زر اتصال -->
    <a class="float-btn float-btn-call" href="${_callLink}" aria-label="اتصل بنا">
      <span class="float-btn-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" width="19" height="19">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.64A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
        </svg>
      </span>
      اتصل بنا
    </a>`;
  document.body.appendChild(wrap);
}

/* --- INIT ON EVERY PAGE --- */
document.addEventListener('DOMContentLoaded', () => {

  /* Inject nav logo */
  const logoEl = document.getElementById('nav-logo-icon');
  if (logoEl) {
    logoEl.innerHTML = '<img src="logo/logo1.png" alt="أشكال الترف" width="405" height="443" style="height:44px;width:auto;display:block">';
    logoEl.style.width = 'auto';
    logoEl.style.height = '44px';
  }

  /* Set active nav link */
  const page = document.body.dataset.page;
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  /* Navbar scroll shadow */
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  /* ESC closes modal */
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* Init scroll reveal */
  initReveal();

  /* Inject floating contact buttons */
  injectFloatingBtns();

  /* أي زر يربط بـ contact.html → حوّله لاتصال مباشر (ماعدا روابط الـ nav العادية) */
  document.querySelectorAll(
    'a.btn-primary[href="contact.html"], a.btn-outline[href="contact.html"], .nav-cta[href="contact.html"], a.prod-action[href="contact.html"]'
  ).forEach(btn => {
    btn.href = _callLink;
    btn.removeAttribute('target');
  });
});
