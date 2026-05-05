document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const navLinksItems = document.querySelectorAll('.nav-links a');

  function setMenuOpen(isOpen) {
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
      setMenuOpen(navLinks.classList.contains('active'));

      const spans = hamburger.querySelectorAll('span');
      if (navLinks.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
    setMenuOpen(false);
  }

  navLinksItems.forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks) {
        navLinks.classList.remove('active');
      }
      if (hamburger) {
        hamburger.classList.remove('active');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
      setMenuOpen(false);
    });
  });

  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const requestTalentBtn = document.getElementById('requestTalentBtn');
  if (requestTalentBtn) {
    requestTalentBtn.addEventListener('click', () => {
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    });
  }

  const servicesBtn = document.getElementById('servicesBtn');
  if (servicesBtn) {
    servicesBtn.addEventListener('click', () => {
      document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const contactSubmitBtn = document.getElementById('contactSubmitBtn');
    const contactFormStatus = document.getElementById('contactFormStatus');

    function getContactApiUrl() {
      const meta = document.querySelector('meta[name="contact-api-url"]');
      const raw = meta?.getAttribute('content')?.trim() ?? '';

      if (!raw) {
        return '/.netlify/functions/contact';
      }

      const base = raw.replace(/\/$/, '');
      if (base.endsWith('/api/contact') || base.includes('/.netlify/functions/contact')) {
        return base;
      }

      try {
        const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
        if (url.hostname.endsWith('vercel.app')) {
          return `${url.origin}/api/contact`;
        }
        return `${url.origin}/.netlify/functions/contact`;
      } catch {
        return '/.netlify/functions/contact';
      }
    }

    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const apiUrl = getContactApiUrl();

      if (contactFormStatus) {
        contactFormStatus.textContent = '';
        contactFormStatus.classList.remove('is-error', 'is-success');
      }

      const fd = new FormData(this);
      const name = String(fd.get('name') ?? '').trim();
      const email = String(fd.get('email') ?? '').trim();
      const company = String(fd.get('company') ?? '').trim();
      const message = String(fd.get('message') ?? '').trim();
      const company_website = String(fd.get('company_website') ?? '').trim();

      const originalBtnText = contactSubmitBtn ? contactSubmitBtn.textContent : '';
      if (contactSubmitBtn) {
        contactSubmitBtn.disabled = true;
        contactSubmitBtn.textContent = 'Sending…';
      }

      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            company,
            message,
            company_website
          })
        });

        let data = {};
        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (!res.ok || !data.ok) {
          const msg =
            (data && data.error) ||
            (res.status === 403
              ? 'This site cannot submit from this page. Please contact us by email.'
              : 'Something went wrong. Please try again or email hr@jedesolutionsllc.com.');
          if (contactFormStatus) {
            contactFormStatus.textContent = msg;
            contactFormStatus.classList.add('is-error');
          }
          return;
        }

        this.reset();
        if (contactFormStatus) {
          contactFormStatus.textContent =
            'Thank you — your message was sent. We will get back to you soon.';
          contactFormStatus.classList.add('is-success');
        }
      } catch {
        if (contactFormStatus) {
          contactFormStatus.textContent =
            'Could not reach the server. Run `netlify dev`, deploy the site to Netlify, or set contact-api-url in the page meta tag.';
          contactFormStatus.classList.add('is-error');
        }
      } finally {
        if (contactSubmitBtn) {
          contactSubmitBtn.disabled = false;
          contactSubmitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  if (window.expertiseData) {
    loadData(window.expertiseData, 'services-container', renderServiceCard, 'showMoreServicesBtn');
  }

  if (window.jobsData) {
    initJobManager(window.jobsData);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.expertiseData) {
        loadData(window.expertiseData, 'services-container', renderServiceCard, 'showMoreServicesBtn');
      }
    }, 250);
  });

  initSectionNavHighlight();
});

function initSectionNavHighlight() {
  const sectionIds = ['hero', 'services', 'jobs', 'about', 'contact'];
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!navLinks.length) return;

  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    navLinks.forEach(a => {
      const href = a.getAttribute('href');
      a.classList.toggle('active', href === `#${id}`);
    });
  };

  const headerVar = getComputedStyle(document.documentElement)
    .getPropertyValue('--header-height')
    .trim()
    .replace('px', '');
  const headerPx = Math.max(0, parseFloat(headerVar) || 90);
  const topOffset = Math.round(headerPx + 6);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) {
        const id = visible[0].target.getAttribute('id');
        if (id) setActive(id);
      }
    },
    {
      threshold: [0.15, 0.3, 0.45, 0.6],
      rootMargin: `-${topOffset}px 0px -55% 0px`
    }
  );

  sections.forEach(s => observer.observe(s));
}

let jobState = {
  data: [],
  filteredData: [],
  currentPage: 1,
  itemsPerPage: 4,
  searchQuery: ''
};

let jobManagerInitialized = false;

function initJobManager(data) {
  if (jobManagerInitialized) return;
  jobManagerInitialized = true;

  jobState.data = data;
  jobState.filteredData = data;

  const searchInput = document.getElementById('jobSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      jobState.searchQuery = e.target.value.toLowerCase();
      jobState.currentPage = 1;
      filterJobs();
    });
  }

  filterJobs();
}

function filterJobs() {
  const query = jobState.searchQuery;
  if (!query) {
    jobState.filteredData = jobState.data;
  } else {
    jobState.filteredData = jobState.data.filter(job => {
      return (
        job.title.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    });
  }
  renderJobs();
  renderPagination();
}

function renderJobs() {
  const container = document.getElementById('jobs-container');
  if (!container) return;

  container.innerHTML = '';

  const start = (jobState.currentPage - 1) * jobState.itemsPerPage;
  const end = start + jobState.itemsPerPage;
  const pageItems = jobState.filteredData.slice(start, end);

  if (pageItems.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'jobs-empty-state';
    empty.textContent = 'No positions found matching your search.';
    container.appendChild(empty);
    return;
  }

  pageItems.forEach((item, index) => {
    const card = renderJobCard(item);
    container.appendChild(card);
    setTimeout(() => card.classList.add('active'), 50 * index);
  });
}

function renderPagination() {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  container.innerHTML = '';
  const totalPages = Math.ceil(jobState.filteredData.length / jobState.itemsPerPage);

  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'pagination-btn';
  prevBtn.setAttribute('aria-label', 'Previous page');
  prevBtn.innerHTML = '<i class="fas fa-chevron-left" aria-hidden="true"></i>';
  prevBtn.disabled = jobState.currentPage === 1;
  prevBtn.addEventListener('click', () => changePage(jobState.currentPage - 1));
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pagination-btn ${i === jobState.currentPage ? 'active' : ''}`;
    btn.textContent = String(i);
    if (i === jobState.currentPage) {
      btn.setAttribute('aria-current', 'page');
    }
    btn.addEventListener('click', () => changePage(i));
    container.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'pagination-btn';
  nextBtn.setAttribute('aria-label', 'Next page');
  nextBtn.innerHTML = '<i class="fas fa-chevron-right" aria-hidden="true"></i>';
  nextBtn.disabled = jobState.currentPage === totalPages;
  nextBtn.addEventListener('click', () => changePage(jobState.currentPage + 1));
  container.appendChild(nextBtn);
}

function changePage(newPage) {
  jobState.currentPage = newPage;
  renderJobs();
  renderPagination();
  document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' });
}

function loadData(data, containerId, renderFunction, buttonId) {
  const container = document.getElementById(containerId);
  const button = document.getElementById(buttonId);

  if (!container) return;

  const isMobile = window.innerWidth < 768;
  const initialCount = isMobile ? 3 : 6;

  container.innerHTML = '';

  if (button) {
    button.onclick = null;
    if (data.length > initialCount) {
      button.style.display = 'inline-block';
      button.onclick = () => {
        renderItems(data.slice(initialCount), container, renderFunction);
        button.style.display = 'none';
      };
    } else {
      button.style.display = 'none';
    }
  }

  renderItems(data.slice(0, initialCount), container, renderFunction);
}

function renderItems(items, container, renderFunction) {
  items.forEach((item, index) => {
    const card = renderFunction(item, index);
    container.appendChild(card);

    setTimeout(() => {
      card.classList.add('active');
    }, 100 * index);
  });
}

function renderServiceCard(item) {
  const div = document.createElement('div');
  div.className = 'card glass reveal service-card-artistic';
  div.style.setProperty('--accent-color', item.color);

  const iconWrap = document.createElement('div');
  iconWrap.className = 'icon-wrapper';
  const icon = document.createElement('i');
  icon.className = `fas ${item.icon}`;
  icon.setAttribute('aria-hidden', 'true');
  iconWrap.appendChild(icon);

  const h4 = document.createElement('h4');
  h4.textContent = item.title;

  const p = document.createElement('p');
  p.textContent = item.description;

  div.appendChild(iconWrap);
  div.appendChild(h4);
  div.appendChild(p);
  return div;
}

function renderJobCard(item) {
  const div = document.createElement('div');
  div.className = 'card glass reveal job-card';

  const subject = encodeURIComponent(`Job Application: ${item.title}`);
  const body = encodeURIComponent(`Dear Jede Solutions Hiring Team,

I am interested in applying for the ${item.title} position. Please find my details below:

Name:
Email:
Phone:
LinkedIn/Portfolio:

Thank you,
[Your Name]`);

  const header = document.createElement('div');
  header.className = 'job-header';

  const h4 = document.createElement('h4');
  h4.textContent = item.title;

  const meta = document.createElement('div');
  meta.className = 'job-meta';

  const locIcon = document.createElement('i');
  locIcon.className = 'fas fa-map-marker-alt';
  locIcon.setAttribute('aria-hidden', 'true');
  meta.appendChild(locIcon);

  meta.appendChild(document.createTextNode(` ${item.location}`));

  const sep = document.createElement('span');
  sep.className = 'separator';
  sep.setAttribute('aria-hidden', 'true');
  sep.textContent = '•';

  const typeSpan = document.createElement('span');
  typeSpan.className = 'job-type';
  typeSpan.textContent = item.type || 'Full-time';

  meta.appendChild(sep);
  meta.appendChild(typeSpan);

  header.appendChild(h4);
  header.appendChild(meta);

  const p = document.createElement('p');
  p.textContent = item.description;

  const a = document.createElement('a');
  a.href = `mailto:hr@jedesolutionsllc.com?subject=${subject}&body=${body}`;
  a.className = 'btn-text';
  a.appendChild(document.createTextNode('Apply Now '));
  const arrow = document.createElement('i');
  arrow.className = 'fas fa-arrow-right';
  arrow.setAttribute('aria-hidden', 'true');
  a.appendChild(arrow);

  div.appendChild(header);
  div.appendChild(p);
  div.appendChild(a);
  return div;
}
