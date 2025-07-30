document.addEventListener("DOMContentLoaded", function () {
    const dropdownBtn = document.getElementById('dropdown-btn');
    const dropdown = dropdownBtn?.closest('.dropdown');
  
    if (dropdownBtn && dropdown) {
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
  
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    }
  });