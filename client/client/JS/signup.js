document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const email = document.getElementById('email').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
  
    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'Passwords do not match.'
      });
      return;
    }
  
    try {
      const response = await fetch('https://webfinalprojserver-production.up.railway.app/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          username,
          password,
          confirmPassword,
          role: 'buyer'
        })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Signup Successful!',
          text: 'Redirecting to login...'
        });
  
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Signup Failed',
          text: data.message || 'Please try again.'
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Server Error',
        text: 'Something went wrong. Please try again later.'
      });
    }
  });