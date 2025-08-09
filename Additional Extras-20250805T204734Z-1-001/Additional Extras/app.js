document.addEventListener('DOMContentLoaded', () => {
    const initDB = () => {
        if (!localStorage.getItem('dhakaDriveUsers')) {
            const adminUser = { id: 1, name: 'Admin', email: 'admin@dhakadrive.com', mobile: '01000000000', password: 'admin', role: 'admin', accountStatus: 'active', document: null, address: '' };
            localStorage.setItem('dhakaDriveUsers', JSON.stringify([adminUser]));
        }
        const requiredKeys = ['dhakaDriveEnrollments', 'dhakaDriveNotifications', 'dhakaDriveMessages', 'dhakaDriveLoginHistory'];
        requiredKeys.forEach(key => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([])); });
    };
    initDB();

    const getEnrollments = () => JSON.parse(localStorage.getItem('dhakaDriveEnrollments')) || [];
    const saveEnrollments = (data) => localStorage.setItem('dhakaDriveEnrollments', JSON.stringify(data));
    const getUsers = () => JSON.parse(localStorage.getItem('dhakaDriveUsers')) || [];
    const saveUsers = (data) => localStorage.setItem('dhakaDriveUsers', JSON.stringify(data));
    const getMessages = () => JSON.parse(localStorage.getItem('dhakaDriveMessages')) || [];
    const saveMessages = (data) => localStorage.setItem('dhakaDriveMessages', JSON.stringify(data));
    const getLoggedInUser = () => JSON.parse(sessionStorage.getItem('loggedInUser'));

    const showNotificationModal = () => {
        const user = getLoggedInUser();
        if (!user) return;
        const allNotifications = JSON.parse(localStorage.getItem('dhakaDriveNotifications')) || [];
        const userNotifications = allNotifications.filter(n => n.userId === user.id).reverse();
        const modal = document.getElementById('notification-modal');
        const list = document.getElementById('notification-list');
        if (userNotifications.length === 0) {
            list.innerHTML = '<p>You have no notifications.</p>';
        } else {
            list.innerHTML = userNotifications.map(n => `<div class="notification-item ${n.read ? '' : 'unread'}"><p>${n.message}</p><small>${new Date(n.id).toLocaleString()}</small></div>`).join('');
        }
        modal.style.display = 'flex';
        const updatedNotifications = allNotifications.map(n => n.userId === user.id ? { ...n, read: true } : n);
        localStorage.setItem('dhakaDriveNotifications', JSON.stringify(updatedNotifications));
        updateNav();
    };

    const updateNav = () => {
        const mainNav = document.getElementById('main-nav');
        if (!mainNav) return;
        const user = getLoggedInUser();
        let navLinks = `<a href="index.html#courses">Courses</a><a href="team.html">Our Team</a><a href="index.html#faq">FAQ</a>`;
        if (user) {
            if (user.role === 'user') {
                const notifications = JSON.parse(localStorage.getItem('dhakaDriveNotifications')) || [];
                const unreadCount = notifications.filter(n => n.userId === user.id && !n.read).length;
                const notifBadge = unreadCount > 0 ? `<span class="notif-count">${unreadCount}</span>` : '';
                navLinks += `<a href="dashboard.html">Dashboard</a><a href="#" id="notification-btn">Notifications${notifBadge}</a>`;
            } else {
                navLinks += `<a href="admin.html">Dashboard</a>`;
            }
            navLinks += `<a href="#" id="logout-btn">Logout</a>`;
        } else {
            navLinks += `<a href="login.html">Login</a><a href="signup.html" class="btn btn-nav">Sign Up</a>`;
        }
        mainNav.innerHTML = navLinks;
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); sessionStorage.removeItem('loggedInUser'); alert('You have been logged out.'); window.location.href = 'index.html'; });
        const notificationBtn = document.getElementById('notification-btn');
        if (notificationBtn) notificationBtn.addEventListener('click', e => { e.preventDefault(); showNotificationModal(); });
    };

    if (document.getElementById('signup-form')) {
        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const mobile = document.getElementById('mobile').value;
            const password = document.getElementById('password').value;
            const users = getUsers();
            if (users.find(user => user.email === email)) { alert('An account with this email already exists.'); return; }
            const newUser = { id: Date.now(), name, email, mobile, password, role: 'user', accountStatus: 'active', document: null, address: '' };
            users.push(newUser);
            saveUsers(users);
            alert('Account created successfully! Please log in.');
            window.location.href = 'login.html';
        });
    }

    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const user = getUsers().find(u => u.email === email && u.password === password);
            if (user) {
                if (user.accountStatus === 'inactive') { alert('Your account has been deactivated. Please contact support.'); return; }
                const loginHistory = JSON.parse(localStorage.getItem('dhakaDriveLoginHistory')) || [];
                loginHistory.push({ userId: user.id, userName: user.name, userEmail: user.email, loginTime: new Date().toISOString() });
                localStorage.setItem('dhakaDriveLoginHistory', JSON.stringify(loginHistory));
                sessionStorage.setItem('loggedInUser', JSON.stringify(user));
                alert(`Welcome back, ${user.name}!`);
                window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
            } else {
                alert('Invalid email or password.');
            }
        });
    }

    const coursePrices = { "Car Driving Course": 5000, "Motorcycle Riding Course": 3000, "Scooter Riding Lessons": 2500, "Bicycle Safety Program": 1000 };
    document.querySelectorAll('.request-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const user = getLoggedInUser();
            if (!user) { alert('Please log in to request enrollment.'); window.location.href = 'login.html'; return; }

            const headerInfo = e.target.closest('.header-info');
            const termsCheckbox = headerInfo.querySelector('.terms-checkbox');
            if (!termsCheckbox || !termsCheckbox.checked) {
                alert('Please read and agree to the Terms and Conditions to proceed.');
                return;
            }
            const courseName = e.target.getAttribute('data-course');
            
            // The check for existing enrollment has been removed to allow re-enrollment.

            document.getElementById('modal-price-course-name').textContent = courseName;
            document.getElementById('modal-course-price').textContent = (coursePrices[courseName] || 0).toLocaleString();
            document.getElementById('price-confirm-modal').style.display = 'flex';
        });
    });

    if (document.getElementById('confirm-price-btn')) {
        document.getElementById('confirm-price-btn').addEventListener('click', () => {
            document.getElementById('price-confirm-modal').style.display = 'none';
            document.getElementById('modal-request-course-name').textContent = document.getElementById('modal-price-course-name').textContent;
            document.getElementById('request-modal').style.display = 'flex';
        });
    }
    
    if (document.getElementById('request-form')) {
        document.getElementById('request-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const user = getLoggedInUser();
            const newRequest = { id: Date.now(), userId: user.id, userName: user.name, userEmail: user.email, userMobile: user.mobile, courseName: document.getElementById('modal-request-course-name').textContent, userPreferredLocation: document.getElementById('user-location').value, assignedLocation: null, trxId: null, paymentMethod: null, status: 'Requested', scheduledSlot: null };
            const enrollments = getEnrollments();
            enrollments.push(newRequest);
            saveEnrollments(enrollments);
            document.getElementById('request-modal').style.display = 'none';
            alert('Your request has been sent! Check your dashboard for updates.');
            window.location.href = 'dashboard.html';
        });
    }

    if (document.getElementById('dashboard')) {
        let user = getLoggedInUser();
        if (!user || user.accountStatus === 'inactive') {
            alert('You must be logged in to view this page or your account is inactive.');
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
            return;
        }

        const renderMyCourses = () => {
            const myCoursesList = document.getElementById('my-courses-list');
            const myEnrollments = getEnrollments().filter(en => en.userId === user.id).reverse();
            if (myEnrollments.length === 0) {
                myCoursesList.innerHTML = `<p>You have not requested any courses yet. <a href="index.html#courses">Explore Courses</a></p>`;
                return;
            }
            const statusLevels = { 'Requested': 10, 'Awaiting Payment': 30, 'Payment Submitted': 50, 'Awaiting Cash Payment': 50, 'Approved': 100, 'Completed': 100 };
            myCoursesList.innerHTML = myEnrollments.map(en => {
                const progress = statusLevels[en.status] || 0;
                let actionButton = '';
                if (en.status === 'Awaiting Payment') {
                    actionButton = `<button class="btn btn-sm btn-pay" data-enroll-id="${en.id}" data-course-name="${en.courseName}">Make Payment</button>`;
                } else if (en.status === 'Approved' && !en.scheduledSlot) {
                    actionButton = `<button class="btn btn-sm schedule-btn" data-enroll-id="${en.id}">Schedule Class</button>`;
                } else if (en.scheduledSlot) {
                    actionButton = `<div class="schedule-info">Scheduled: ${en.scheduledSlot}</div>`;
                }
                return `
                    <div class="course-progress-item">
                        <div class="course-progress-header">
                            <h3>${en.courseName}</h3>
                            <span class="status ${en.status.toLowerCase().replace(/ /g, '-')}">${en.status}</span>
                        </div>
                        <p>Location: ${en.assignedLocation || en.userPreferredLocation}</p>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progress}%;"></div>
                        </div>
                        <div class="course-progress-footer">${actionButton}</div>
                    </div>
                `;
            }).join('');
        };

        const renderLearningMaterials = () => {
            const container = document.getElementById('learning-materials-list');
            const hasApprovedCourse = getEnrollments().some(en => en.userId === user.id && (en.status === 'Approved' || en.status === 'Completed'));
            
            if (hasApprovedCourse) {
                container.innerHTML = `
                    <div class="material-item">
                        <a href="materials\DhakaDrive-Traffic-Signs.pdf" download="DhakaDrive-Traffic-Signs.pdf">BRTA Traffic Signs PDF</a>
                    </div>
                    <div class="material-item">
                        <a href="materials\DhakaDrive-Vehicle-Checklist.pdf" download="DhakaDrive-Vehicle-Checklist.pdf">Pre-Drive Vehicle Checklist</a>
                    </div>
                    <div class="material-item">
                        <a href="materials\DhakaDrive-BRTA-Guide.pdf" download="DhakaDrive-BRTA-Guide.pdf">Guide to BRTA Written Test</a>
                    </div>
                `;
            } else {
                container.innerHTML = `<p>Materials become available once your course enrollment is approved.</p>`;
            }
        };

        const renderUserConversation = () => {
            const container = document.getElementById('user-conversation-thread');
            const conversation = getMessages().find(c => c.userId === user.id);
            if (!conversation || conversation.messages.length === 0) {
                container.innerHTML = '<p class="message-placeholder">No messages yet. Send a message to start a conversation.</p>';
                return;
            }
            container.innerHTML = conversation.messages.map(msg => `
                <div class="message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'admin-bubble'}">
                    <p>${msg.text}</p>
                    <small>${new Date(msg.timestamp).toLocaleString()}</small>
                </div>
            `).join('');
            container.scrollTop = container.scrollHeight;
        };

        document.getElementById('welcome-message').textContent = `Welcome, ${user.name}!`;
        renderMyCourses();
        renderLearningMaterials();
        renderUserConversation();

        document.getElementById('profile-name').value = user.name;
        document.getElementById('profile-mobile').value = user.mobile;
        document.getElementById('profile-address').value = user.address || '';
        if (user.document) {
            document.getElementById('user-document-number').value = user.document.number || '';
            document.getElementById('file-info').textContent = user.document.fileName ? `Current: ${user.document.fileName}` : '';
        }

        document.querySelectorAll('.dash-tab-link').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.dash-tab-link').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.dash-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });

        document.getElementById('my-courses-list').addEventListener('click', e => {
            if (e.target.classList.contains('schedule-btn')) {
                const enrollmentId = e.target.dataset.enrollId;
                document.getElementById('schedule-enrollment-id').value = enrollmentId;
                document.getElementById('schedule-modal').style.display = 'flex';
            }
        });

        document.getElementById('schedule-form').addEventListener('submit', e => {
            e.preventDefault();
            const enrollmentId = document.getElementById('schedule-enrollment-id').value;
            const selectedSlot = document.getElementById('time-slot').value;
            let enrollments = getEnrollments();
            const enrollIndex = enrollments.findIndex(en => en.id == enrollmentId);
            if (enrollIndex > -1) {
                enrollments[enrollIndex].scheduledSlot = selectedSlot;
                saveEnrollments(enrollments);
                alert('Your preferred time slot has been recorded!');
                document.getElementById('schedule-modal').style.display = 'none';
                renderMyCourses();
            }
        });
        
        document.getElementById('profile-update-form').addEventListener('submit', e => {
            e.preventDefault();
            const users = getUsers();
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex > -1) {
                users[userIndex].name = document.getElementById('profile-name').value;
                users[userIndex].mobile = document.getElementById('profile-mobile').value;
                users[userIndex].address = document.getElementById('profile-address').value;
                saveUsers(users);
                sessionStorage.setItem('loggedInUser', JSON.stringify(users[userIndex]));
                alert('Profile updated successfully!');
            }
        });

        document.getElementById('document-submit-form').addEventListener('submit', e => {
            e.preventDefault();
            const docNumber = document.getElementById('user-document-number').value.trim();
            const file = document.getElementById('user-document-file').files[0];
            const updateUserDocument = (fileData = null, fileName = null) => {
                let users = getUsers();
                let userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex > -1) {
                    if (!users[userIndex].document) users[userIndex].document = {};
                    users[userIndex].document.number = docNumber;
                    if (fileData && fileName) {
                       users[userIndex].document.fileData = fileData;
                       users[userIndex].document.fileName = fileName;
                    }
                    saveUsers(users);
                    sessionStorage.setItem('loggedInUser', JSON.stringify(users[userIndex]));
                    alert('Document information updated!');
                    document.getElementById('file-info').textContent = fileName ? `Current: ${fileName}` : '';
                }
            };
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => updateUserDocument(event.target.result, file.name);
                reader.readAsDataURL(file);
            } else {
                 updateUserDocument(user.document?.fileData, user.document?.fileName);
            }
        });

        document.getElementById('support-form').addEventListener('submit', e => {
            e.preventDefault();
            const messageText = document.getElementById('support-message').value.trim();
            if (!messageText) return;

            let conversations = getMessages();
            let userConvoIndex = conversations.findIndex(c => c.userId === user.id);

            const newMessage = {
                sender: 'user',
                text: messageText,
                timestamp: new Date().toISOString()
            };

            if (userConvoIndex > -1) {
                conversations[userConvoIndex].messages.push(newMessage);
            } else {
                conversations.push({
                    userId: user.id,
                    userName: user.name,
                    messages: [newMessage]
                });
            }
            saveMessages(conversations);
            alert('Your message has been sent!');
            e.target.reset();
            renderUserConversation();
        });

        document.getElementById('delete-account-btn').addEventListener('click', () => {
            if (confirm('Are you absolutely sure? This will deactivate your account and cannot be undone.')) {
                let users = getUsers();
                const userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex > -1) {
                    users[userIndex].accountStatus = 'inactive';
                    saveUsers(users);
                    sessionStorage.removeItem('loggedInUser');
                    alert('Your account has been deactivated.');
                    window.location.href = 'index.html';
                }
            }
        });

        // --- Payment Modal Logic ---
        const paymentModal = document.getElementById('payment-modal');
        const paymentTabs = document.querySelectorAll('.payment-tab-link');
        const paymentContents = document.querySelectorAll('.payment-tab-content');

        document.getElementById('my-courses-list').addEventListener('click', e => {
            if (e.target.classList.contains('btn-pay')) {
                const enrollmentId = e.target.dataset.enrollId;
                const courseName = e.target.dataset.courseName;
                const price = coursePrices[courseName] || 0;

                document.getElementById('payment-enrollment-id').value = enrollmentId;
                document.getElementById('payment-course-name').textContent = courseName;
                document.getElementById('payment-course-price').textContent = price.toLocaleString();
                
                paymentModal.style.display = 'flex';
            }
        });

        paymentTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                paymentTabs.forEach(t => t.classList.remove('active'));
                paymentContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });

        const processPayment = (enrollmentId, updates) => {
            let enrollments = getEnrollments();
            const enrollIndex = enrollments.findIndex(en => en.id == enrollmentId);

            if (enrollIndex > -1) {
                enrollments[enrollIndex] = { ...enrollments[enrollIndex], ...updates };
                saveEnrollments(enrollments);
                alert('Your payment information has been submitted. You will be notified once it is confirmed by the admin.');
                paymentModal.style.display = 'none';
                renderMyCourses();
            } else {
                alert('An error occurred. Could not find enrollment.');
            }
        };

        document.getElementById('mfs-payment-form').addEventListener('submit', e => {
            e.preventDefault();
            const enrollmentId = document.getElementById('payment-enrollment-id').value;
            const trxId = document.getElementById('mfs-trx-id').value;
            processPayment(enrollmentId, {
                status: 'Payment Submitted',
                paymentMethod: 'MFS',
                trxId: trxId
            });
            e.target.reset();
        });
        
        document.getElementById('card-payment-form').addEventListener('submit', e => {
            e.preventDefault();
            const enrollmentId = document.getElementById('payment-enrollment-id').value;
            // No real card processing, just simulation
            processPayment(enrollmentId, {
                status: 'Payment Submitted',
                paymentMethod: 'Card',
                trxId: 'N/A'
            });
             e.target.reset();
        });

        document.getElementById('cash-payment-form').addEventListener('submit', e => {
            e.preventDefault();
            const enrollmentId = document.getElementById('payment-enrollment-id').value;
            processPayment(enrollmentId, {
                status: 'Awaiting Cash Payment',
                paymentMethod: 'Cash',
                trxId: null
            });
        });
    }
    
    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', e => e.target.closest('.modal-overlay').style.display = 'none'));
    
    document.querySelectorAll('.toggle-password-icon').forEach(icon => {
        icon.textContent = 'SHOW';
        icon.addEventListener('click', function() {
            const wrapper = this.closest('.password-wrapper');
            const input = wrapper.querySelector('input');
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            this.textContent = isPassword ? 'HIDE' : 'SHOW';
        });
    });

    updateNav();
});
