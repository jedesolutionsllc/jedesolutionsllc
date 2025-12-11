document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const navLinksItems = document.querySelectorAll('.nav-links a');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');

      // Animate hamburger
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
  }

  // Close mobile menu when clicking a link
  navLinksItems.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');

      // Reset hamburger
      const spans = hamburger.querySelectorAll('span');
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    });
  });

  // Scroll Reveal Animation
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Button click handlers
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

  // Contact form submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Get form data
      const name = this.name.value;
      const email = this.email.value;
      const company = this.company.value;
      const message = this.message.value;

      // Create email content
      const mailto = 'hr@jedesolutionsllc.com';
      const subject = `Contact Form Submission from ${name}`;
      const body = `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\nMessage:\n${message}`;

      // Open email client
      window.location.href = `mailto:${mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Reset form
      this.reset();
    });
  }

  // Dynamic Content Loading
  // Using global variables from included scripts to avoid CORS issues with local file opening
  if (window.expertiseData) {
    loadData(window.expertiseData, 'services-container', renderServiceCard, 'showMoreServicesBtn');
  }

  if (window.jobsData) {
    // Initialize Job Manager
    initJobManager(window.jobsData);
  }

  // Handle resize to update "Show More" logic if needed
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Re-render content to adjust for new screen size
      if (window.expertiseData) loadData(window.expertiseData, 'services-container', renderServiceCard, 'showMoreServicesBtn');
      // Jobs are handled by initJobManager which doesn't need re-init on resize for now, 
      // but if we wanted to change itemsPerPage based on resize, we'd do it here.
    }, 250);
  });
});

// --- Job Manager (Search & Pagination) ---
let jobState = {
  data: [],
  filteredData: [],
  currentPage: 1,
  itemsPerPage: 4, // Updated to 4 as requested
  searchQuery: ''
};

function initJobManager(data) {
  jobState.data = data;
  jobState.filteredData = data;

  const searchInput = document.getElementById('jobSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      jobState.searchQuery = e.target.value.toLowerCase();
      jobState.currentPage = 1; // Reset to page 1 on search
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
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No positions found matching your search.</div>';
    return;
  }

  pageItems.forEach((item, index) => {
    const card = renderJobCard(item);
    container.appendChild(card);
    // Animation
    setTimeout(() => card.classList.add('active'), 50 * index);
  });
}

function renderPagination() {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  container.innerHTML = '';
  const totalPages = Math.ceil(jobState.filteredData.length / jobState.itemsPerPage);

  if (totalPages <= 1) return; // Hide pagination if only 1 page

  // Prev Button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.disabled = jobState.currentPage === 1;
  prevBtn.onclick = () => changePage(jobState.currentPage - 1);
  container.appendChild(prevBtn);

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${i === jobState.currentPage ? 'active' : ''}`;
    btn.textContent = i;
    btn.onclick = () => changePage(i);
    container.appendChild(btn);
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.disabled = jobState.currentPage === totalPages;
  nextBtn.onclick = () => changePage(jobState.currentPage + 1);
  container.appendChild(nextBtn);
}

function changePage(newPage) {
  jobState.currentPage = newPage;
  renderJobs();
  renderPagination();
  // Scroll to top of jobs section
  document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' });
}
function loadData(data, containerId, renderFunction, buttonId) {
  const container = document.getElementById(containerId);
  const button = document.getElementById(buttonId);

  if (!container) return;

  // Determine initial count based on screen size
  const isMobile = window.innerWidth < 768;
  const initialCount = isMobile ? 3 : 6;

  // Clear container to prevent duplication on resize
  container.innerHTML = '';

  // Render initial items
  renderItems(data.slice(0, initialCount), container, renderFunction);

  // Handle "Show More" button
  if (data.length > initialCount) {
    button.style.display = 'inline-block';
    button.onclick = () => {
      // Render remaining items
      renderItems(data.slice(initialCount), container, renderFunction);
      button.style.display = 'none'; // Hide button after expanding
    };
  }
}

function renderItems(items, container, renderFunction) {
  items.forEach((item, index) => {
    const card = renderFunction(item, index);
    container.appendChild(card);

    // Trigger animation for new items
    setTimeout(() => {
      card.classList.add('active'); // Assuming 'reveal' class logic handles opacity
    }, 100 * index);
  });
}

function renderServiceCard(item) {
  const div = document.createElement('div');
  div.className = 'card glass reveal service-card-artistic';
  // Apply dynamic color for hover/border effect
  div.style.setProperty('--accent-color', item.color);

  div.innerHTML = `
    <div class="icon-wrapper">
      <i class="fas ${item.icon}"></i>
    </div>
    <h4>${item.title}</h4>
    <p>${item.description}</p>
  `;
  return div;
}

function renderJobCard(item) {
  const div = document.createElement('div');
  div.className = 'card glass reveal job-card';

  // Construct Mailto Link
  const subject = encodeURIComponent(`Job Application: ${item.title}`);
  const body = encodeURIComponent(`Dear Jede Solutions Hiring Team,

I am interested in applying for the ${item.title} position. Please find my details below:

Name:
Email:
Phone:
LinkedIn/Portfolio:

Thank you,
[Your Name]`);

  const mailtoLink = `mailto:hr@jedesolutionsllc.com?subject=${subject}&body=${body}`;

  div.innerHTML = `
    <div class="job-header">
      <h4>${item.title}</h4>
      <div class="job-meta">
        <i class="fas fa-map-marker-alt"></i> ${item.location}
        <span class="separator">•</span>
        <span class="job-type">${item.type || 'Full-time'}</span>
      </div>
    </div>
    <p>${item.description}</p>
    <a href="${mailtoLink}" class="btn-text">Apply Now <i class="fas fa-arrow-right"></i></a>
  `;
  return div;
}

// Job application function (global scope needed for onclick)
window.applyForJob = function (jobTitle) {
  const email = 'hr@jedesolutionsllc.com';
  const subject = `Job Application: ${jobTitle}`;
  const body = `Dear Jede Solutions Hiring Team,\n\nI am interested in applying for the ${jobTitle} position. Please find my details below:\n\nName: \nEmail: \nPhone: \nLinkedIn/Portfolio: \n\nThank you,\n[Your Name]`;

  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
