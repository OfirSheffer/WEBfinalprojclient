// Handle login form submission
document.getElementById('Login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const role = document.getElementById('role').value.toLowerCase();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!role || !username || !password) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Fields',
      text: 'Please fill in all fields including role.'
    });
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();

    if (response.ok) {
      if (data.user.role !== role) {
        Swal.fire({
          icon: 'error',
          title: 'Role Mismatch',
          text: 'You selected the wrong role for this user.'
        });
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('userId', data.user && (data.user._id || data.user.id));

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'Redirecting...'
      });

      setTimeout(() => {
        if (data.user.role === 'buyer') {
          window.location.href = 'buyer-dashboard.html';
        } else if (data.user.role === 'manager') {
          window.location.href = 'manager-dashboard.html';
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Unknown Role',
            text: 'Role not recognized. Please contact the administrator.'
          });
        }
      }, 1500);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: data.message || 'Invalid credentials. Please try again.'
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Server Error',
      text: 'An error occurred. Please try again later.'
    });
  }
});

