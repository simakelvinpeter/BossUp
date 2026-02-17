/**
 * Auth Page Scripts
 * =================
 * Handles login and signup form submissions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    if (TokenManager.isAuthenticated()) {
        const userData = TokenManager.getUserData();
        redirectToDashboard(userData?.role);
        return;
    }

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        initLoginForm(loginForm);
    }

    // Signup Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        initSignupForm(signupForm);
    }

    // Password toggle
    initPasswordToggle();

    // Role selector (signup page)
    initRoleSelector();
});

function initLoginForm(form) {
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = form.email.value.trim();
        const password = form.password.value;

        // Show loading
        setLoading(submitBtn, true);
        hideError(errorDiv);

        try {
            const response = await API.login(email, password);
            
            if (response) {
                // Redirect based on role
                redirectToDashboard(response.role);
            }
        } catch (error) {
            showError(errorDiv, error.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

function initSignupForm(form) {
    const errorDiv = document.getElementById('signup-error');
    const submitBtn = document.getElementById('signup-btn');

    // Check for role in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    if (roleParam === 'business') {
        selectRole('BUSINESS_OWNER');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = form.email.value.trim();
        const password = form.password.value;
        const role = form.role.value;
        const country = form.country.value;
        const fullName = form.full_name?.value?.trim() || null;

        // Validation
        if (password.length < 8) {
            showError(errorDiv, 'Password must be at least 8 characters');
            return;
        }

        if (!form.terms?.checked) {
            showError(errorDiv, 'You must agree to the Terms of Service');
            return;
        }

        // Show loading
        setLoading(submitBtn, true);
        hideError(errorDiv);

        try {
            const response = await API.signup(email, password, role, country, fullName);
            
            if (response) {
                // Redirect based on role
                redirectToDashboard(response.role);
            }
        } catch (error) {
            showError(errorDiv, error.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

function initRoleSelector() {
    const roleBtns = document.querySelectorAll('.role-btn');
    const roleInput = document.getElementById('role');

    if (!roleBtns.length || !roleInput) return;

    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.dataset.role;
            selectRole(role);
        });
    });
}

function selectRole(role) {
    const roleBtns = document.querySelectorAll('.role-btn');
    const roleInput = document.getElementById('role');

    roleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.role === role);
    });

    if (roleInput) {
        roleInput.value = role;
    }
}

function initPasswordToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-password');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        });
    });
}

// UI Helpers
function setLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');

    if (loading) {
        btn.disabled = true;
        if (text) text.style.display = 'none';
        if (loader) loader.style.display = 'inline';
    } else {
        btn.disabled = false;
        if (text) text.style.display = 'inline';
        if (loader) loader.style.display = 'none';
    }
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideError(element) {
    if (element) {
        element.style.display = 'none';
    }
}
