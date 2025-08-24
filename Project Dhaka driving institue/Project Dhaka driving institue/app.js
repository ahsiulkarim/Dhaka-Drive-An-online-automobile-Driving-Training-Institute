document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:5001';

    // --- HELPERS ---
    const getLoggedInUser = () => JSON.parse(sessionStorage.getItem('loggedInUser'));

    // --- RENDER FUNCTIONS ---

    const getCourseHtmlFilename = (courseName) => {
        switch (courseName) {
            case 'Car Driving': return 'course-car.html';
            case 'Motorcycle Riding': return 'course-bike.html';
            case 'Scooter Riding': return 'course-scooter.html';
            case 'Bicycle Riding': return 'course-bicycle.html';
            default: return 'index.html'; // Fallback
        }
    };

    const renderCourses = async () => {
        const courseListContainer = document.querySelector('.course-list');
        if (!courseListContainer) return;
        try {
            const response = await fetch(`${API_URL}/api/courses`);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch courses');
            courseListContainer.innerHTML = result.courses.map(course => `
                <div class="course-card">
                    <img src="${course.image_path}" alt="${course.name}">
                    <div class="course-card-content">
                        <h3>${course.name}</h3>
                        <p>${course.description}</p>
                        <div class="course-card-footer">
                            <span class="price">৳ ${course.price}</span>
                            <a href="${getCourseHtmlFilename(course.name)}?id=${course.id}" class="btn">View Details</a>
                        </div>
                    </div>
                </div>`).join('');
        } catch (error) {
            console.error('Error fetching courses:', error);
            courseListContainer.innerHTML = `<p>${error.message}</p>`;
        }
    };

    const renderMyCourses = async () => {
        const myCoursesList = document.getElementById('my-courses-list');
        if (!myCoursesList) return;
        const user = getLoggedInUser();
        if (!user) return;
        try {
            const response = await fetch(`${API_URL}/api/enrollments?userId=${user.id}`);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch enrollments');
            if (result.enrollments.length === 0) {
                myCoursesList.innerHTML = `<p>You have not requested any courses yet. <a href="index.html#courses">Explore Courses</a></p>`;
                return;
            }
            const statusLevels = { 'Requested': 10, 'Awaiting Payment': 30, 'Approved': 100, 'Rejected': 0 };
            myCoursesList.innerHTML = result.enrollments.map(en => {
                const progress = statusLevels[en.status] || 0;
                return `
                    <div class="course-progress-item">
                        <div class="course-progress-header">
                            <h3>${en.courseName}</h3>
                            <span class="status ${en.status.toLowerCase().replace(/ /g, '-')}">${en.status}</span>
                        </div>
                        <div class="progress-bar-container"><div class="progress-bar" style="width: ${progress}%;"></div></div>
                    </div>`;
            }).join('');
        } catch (error) {
            console.error('Error fetching enrollments:', error);
            myCoursesList.innerHTML = `<p>${error.message}</p>`;
        }
    };

    const renderUserConversation = async () => {
        const conversationThread = document.getElementById('user-conversation-thread');
        if (!conversationThread) return;
        const user = getLoggedInUser();
        if (!user) return;
        try {
            const response = await fetch(`${API_URL}/api/messages/${user.id}`);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch messages');
            
            if(result.messages.length === 0){
                conversationThread.innerHTML = '<p class="message-placeholder">No messages yet. Send a message to start a conversation.</p>';
                return;
            }
            conversationThread.innerHTML = result.messages.map(msg => {
                const bubbleClass = msg.senderId === user.id ? 'user-bubble' : 'admin-bubble';
                return `<div class="message-bubble ${bubbleClass}">
                            <p>${msg.content}</p>
                            <small>${new Date(msg.timestamp).toLocaleString()}</small>
                        </div>`;
            }).join('');
            conversationThread.scrollTop = conversationThread.scrollHeight;
        } catch (error) {
            console.error('Error fetching conversation:', error);
            conversationThread.innerHTML = `<p>${error.message}</p>`;
        }
    };

    // --- ACTION FUNCTIONS ---

    const enrollUser = async (courseId) => {
        const user = getLoggedInUser();
        if (!user) {
            alert('Please log in to enroll.');
            return window.location.href = 'login.html';
        }
        if (!confirm('Are you sure you want to enroll in this course?')) return;
        try {
            const response = await fetch(`${API_URL}/api/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, courseId: courseId })
            });
            const result = await response.json();
            alert(result.message);
            if (response.ok) window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Enrollment error:', error);
            alert('Could not connect to server.');
        }
    };

    // --- EVENT LISTENERS ---

    if (document.getElementById('signup-form')) {
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const mobile = document.getElementById('mobile').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch(`${API_URL}/api/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, mobile, password })
                });
                const result = await response.json();
                alert(result.message);
                if (response.ok) window.location.href = 'login.html';
            } catch (error) {
                console.error('Signup error:', error);
                alert('Could not connect to server.');
            }
        });
    }

    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch(`${API_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    sessionStorage.setItem('loggedInUser', JSON.stringify(result.user));
                    alert(`Welcome back, ${result.user.fullName}!`);
                    window.location.href = result.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Could not connect to server.');
            }
        });
    }

    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('request-btn')) {
            enrollUser(e.target.dataset.courseId);
        }
    });

    if (document.getElementById('support-form')) {
        document.getElementById('support-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = getLoggedInUser();
            const content = document.getElementById('support-message').value.trim();
            if (!content || !user) return;

            try {
                const response = await fetch(`${API_URL}/api/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ senderId: user.id, receiverId: 'admin', content })
                });
                const result = await response.json();
                if (response.ok) {
                    e.target.reset();
                    renderUserConversation();
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Send message error:', error);
                alert('Could not send message.');
            }
        });
    }

    // --- INITIALIZATION ---

    const updateNav = () => {
        const mainNav = document.querySelector('nav');
        if (!mainNav) return;
        const user = getLoggedInUser();
        let navLinks = '';
        if(document.querySelector('.logo')){
             navLinks += `<a href="index.html" class="logo">Dhaka Drive</a>`;
        }
        navLinks += `<a href="index.html#courses">Courses</a><a href="team.html">Our Team</a><a href="index.html#faq">FAQ</a>`;
        if (user) {
            if (user.role === 'user') {
                navLinks += `<a href="dashboard.html">Dashboard</a><a href="#" id="notification-btn">Notifications</a>`;
            } else {
                navLinks += `<a href="admin.html">Dashboard</a>`;
            }
            navLinks += `<a href="#" id="logout-btn">Logout</a>`;
        } else {
            navLinks += `<a href="login.html">Login</a><a href="signup.html" class="btn btn-nav">Sign Up</a>`;
        }
        mainNav.innerHTML = navLinks;
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => { 
                e.preventDefault(); 
                sessionStorage.removeItem('loggedInUser'); 
                alert('You have been logged out.'); 
                window.location.href = 'index.html'; 
            });
        }
    };

    // Page-specific initializations
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
        renderCourses();
    }

    if (path.endsWith('dashboard.html')) {
        const user = getLoggedInUser();
        if (!user) {
            alert('You must be logged in to view this page.');
            window.location.href = 'login.html';
        } else {
            document.getElementById('welcome-message').textContent = `Welcome, ${user.fullName}!`;
            renderMyCourses();
            renderUserConversation();
        }
    }

    updateNav();
});