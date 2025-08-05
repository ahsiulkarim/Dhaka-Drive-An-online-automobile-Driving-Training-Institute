/*
document.addEventListener('DOMContentLoaded', () => {
    const loggedInAdmin = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInAdmin || loggedInAdmin.role !== 'admin') {
        alert('Access Denied.');
        window.location.href = 'index.html';
        return;
    }

    const enrollmentsTBody = document.querySelector('#enrollments-table tbody');
    const usersTBody = document.querySelector('#users-table tbody');
    const userEditModal = document.getElementById('user-edit-modal');
    const userEditForm = document.getElementById('user-edit-form');
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const conversationList = document.getElementById('conversation-list');
    const adminConversationThread = document.getElementById('admin-conversation-thread');
    const adminReplyForm = document.getElementById('admin-reply-form');
    const replyUserIdInput = document.getElementById('reply-user-id');
    const currentConvoTitle = document.getElementById('current-convo-title');
    const supportList = document.getElementById('support-messages-list');
    const loginHistoryTBody = document.querySelector('#login-history-table tbody');

    const getEnrollments = () => JSON.parse(localStorage.getItem('dhakaDriveEnrollments')) || [];
    const saveEnrollments = (data) => localStorage.setItem('dhakaDriveEnrollments', JSON.stringify(data));
    const getUsers = () => JSON.parse(localStorage.getItem('dhakaDriveUsers')) || [];
    const saveUsers = (data) => localStorage.setItem('dhakaDriveUsers', JSON.stringify(data));
    const getMessages = () => JSON.parse(localStorage.getItem('dhakaDriveMessages')) || [];
    const saveMessages = (data) => localStorage.setItem('dhakaDriveMessages', JSON.stringify(data));
    const getLoginHistory = () => JSON.parse(localStorage.getItem('dhakaDriveLoginHistory')) || [];
    const addNotification = (userId, message) => {
        const notifications = JSON.parse(localStorage.getItem('dhakaDriveNotifications')) || [];
        notifications.push({ id: Date.now(), userId, message, read: false });
        localStorage.setItem('dhakaDriveNotifications', JSON.stringify(notifications));
    };

    const renderEnrollmentsTable = () => {
        const enrollments = getEnrollments().reverse();
        enrollmentsTBody.innerHTML = enrollments.map(enroll => {
            let actionButtons = 'Processed';
            if (enroll.status === 'Requested') {
                actionButtons = `<button class="btn btn-sm btn-approve" data-id="${enroll.id}" data-action="approve-payment">Approve</button><button class="btn btn-sm btn-reject" data-id="${enroll.id}" data-action="reject-request">Reject</button>`;
            } else if (enroll.status === 'Payment Submitted') {
                actionButtons = `<button class="btn btn-sm btn-approve" data-id="${enroll.id}" data-action="confirm-payment">Confirm</button><button class="btn btn-sm btn-reject" data-id="${enroll.id}" data-action="reject-payment">Reject</button>`;
            } else if (enroll.status === 'Awaiting Cash Payment') {
                actionButtons = `<button class="btn btn-sm btn-approve" data-id="${enroll.id}" data-action="confirm-payment">Confirm Cash</button>`;
            }
            const scheduleInfo = enroll.scheduledSlot ? `<strong>Schedule:</strong> ${enroll.scheduledSlot}` : 'Not Scheduled';
            const paymentInfo = enroll.paymentMethod ? `<br><small><strong>Payment:</strong> ${enroll.paymentMethod}${enroll.trxId && enroll.trxId !== 'N/A' ? ` (TrxID: ${enroll.trxId})` : ''}</small>` : '';

            return `<tr><td><strong>${enroll.userName}</strong><br><small>${enroll.userEmail}<br>${enroll.userMobile}${paymentInfo}</small></td><td>${enroll.courseName}</td><td>${enroll.assignedLocation || 'N/A'}<br/><small>${scheduleInfo}</small></td><td>${new Date(enroll.id).toLocaleDateString()}</td><td><span class="status ${enroll.status.toLowerCase().replace(/ /g, '-')}">${enroll.status}</span></td><td><div class="action-buttons">${actionButtons}</div></td></tr>`;
        }).join('') || `<tr><td colspan="6">No enrollments found.</td></tr>`;
    };
/*
    const renderUsersTable = () => {
        const allUsers = getUsers().filter(u => u.role === 'user');
        usersTBody.innerHTML = allUsers.map(u => {
            let docInfo = 'Not Submitted';
            if (u.document) {
                docInfo = u.document.number || 'Number not provided';
                if (u.document.fileData) {
                    docInfo += ` <a href="${u.document.fileData}" target="_blank" class="view-file-link" download="${u.document.fileName || 'document'}">View File</a>`;
                }
            }
            let actionButton;
            if (u.accountStatus === 'inactive') {
                actionButton = `<button class="btn btn-sm btn-approve" data-action="reactivate-user" data-id="${u.id}">Reactivate</button>`;
            } else {
                actionButton = `<button class="btn btn-sm" data-action="edit-user" data-id="${u.id}">Edit</button>`;
            }
            return `<tr><td>${u.name}</td><td>${u.email}<br>${u.mobile}</td><td>${u.address || 'N/A'}</td><td>${docInfo}</td><td><span class="status ${u.accountStatus}">${u.accountStatus}</span></td><td>${actionButton}</td></tr>`;
        }).join('') || `<tr><td colspan="6">No users found.</td></tr>`;
    };
*/






/*
      const renderUsersTable = () => {
        const allUsers = getUsers().filter(u => u.role === 'user');
        usersTBody.innerHTML = allUsers.map(u => {
            let docInfo = 'Not Submitted';
            if (u.document) {
                docInfo = u.document.number || 'Number not provided';
                if (u.document.fileData) {
                    docInfo += ` <a href="${u.document.fileData}" target="_blank" class="view-file-link" download="${u.document.fileName || 'document'}">View File</a>`;
                }
            }
            let actionButton;
            if (u.accountStatus === 'inactive') {
                actionButton = `<button class="btn btn-sm btn-approve" data-action="reactivate-user" data-id="${u.id}">Reactivate</button>`;
            } else {
                actionButton = `<button class="btn btn-sm" data-action="edit-user" data-id="${u.id}">Edit</button>`;
            }
            return `<tr><td>${u.name}</td><td>${u.email}<br>${u.mobile}</td><td>${u.address || 'N/A'}</td><td>${docInfo}</td><td><span class="status ${u.accountStatus}">${u.accountStatus}</span></td><td>${actionButton}</td></tr>`;
        }).join('') || `<tr><td colspan="6">No users found.</td></tr>`;
    };
    
    const renderConversationList = () => {
        const conversations = getMessages().sort((a,b) => new Date(b.messages.slice(-1)[0].timestamp) - new Date(a.messages.slice(-1)[0].timestamp));
        if (conversations.length === 0) {
            conversationList.innerHTML = '<li>No conversations found.</li>';
            return;
        }
        conversationList.innerHTML = conversations.map(convo => {
            const lastMessage = convo.messages[convo.messages.length - 1];
            return `
            <li data-userid="${convo.userId}" data-username="${convo.userName}">
                <strong>${convo.userName}</strong>
                <small>${lastMessage.text.substring(0, 25)}...</small>
            </li>
        `}).join('');
    };

    const renderAdminConversation = (userId) => {
        const conversation = getMessages().find(c => c.userId == userId);
        if (!conversation) {
            adminConversationThread.innerHTML = '<p class="message-placeholder">Could not find this conversation.</p>';
            return;
        }
        adminConversationThread.innerHTML = conversation.messages.map(msg => `
            <div class="message-bubble ${msg.sender === 'admin' ? 'admin-bubble' : 'user-bubble'}">
                <p>${msg.text}</p>
                <small>${new Date(msg.timestamp).toLocaleString()}</small>
            </div>
        `).join('');
        adminConversationThread.scrollTop = adminConversationThread.scrollHeight;
    };

    const renderSupportRequests = () => {
        const conversations = getMessages();
        const firstMessages = conversations.map(convo => {
            const firstUserMessage = convo.messages.find(msg => msg.sender === 'user');
            return firstUserMessage ? { ...firstUserMessage, userName: convo.userName, userEmail: getUsers().find(u => u.id === convo.userId)?.email || 'N/A' } : null;
        }).filter(Boolean);

        if (firstMessages.length === 0) {
            supportList.innerHTML = '<p>No support requests found.</p>';
            return;
        }

        supportList.innerHTML = firstMessages.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(msg => `
            <div class="support-item">
                <div class="support-item-header">
                    <strong>From: ${msg.userName} (${msg.userEmail})</strong>
                    <span>${new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <p>${msg.text}</p>
            </div>
        `).join('');
    };

    const renderLoginHistoryTable = () => {
        const history = getLoginHistory().reverse();
        loginHistoryTBody.innerHTML = history.map(log => 
            `<tr>
                <td>${log.userName}</td>
                <td>${log.userEmail}</td>
                <td>${new Date(log.loginTime).toLocaleString()}</td>
            </tr>`
        ).join('') || `<tr><td colspan="3">No login history found.</td></tr>`;
    };

    tabs.forEach(tab => tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    }));

    enrollmentsTBody.addEventListener('click', e => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        const enrollmentId = button.dataset.id;
        const action = button.dataset.action;
        let enrollments = getEnrollments();
        const enrollmentIndex = enrollments.findIndex(en => en.id == enrollmentId);
        if (enrollmentIndex > -1) {
            const enrollment = enrollments[enrollmentIndex];
            let alertMessage = '';
            switch (action) {
                case 'approve-payment':
                    enrollments[enrollmentIndex].status = 'Awaiting Payment';
                    addNotification(enrollment.userId, `Good news! A slot for "${enrollment.courseName}" is available. Please complete the payment from your dashboard.`);
                    alertMessage = 'Request approved. User notified to make payment.';
                    break;
                case 'confirm-payment':
                    const assignedLocation = prompt("Payment confirmed. Enter the final class location:", enrollment.userPreferredLocation || "Dhanmondi Branch");
                    if (assignedLocation) {
                        enrollments[enrollmentIndex].status = 'Approved';
                        enrollments[enrollmentIndex].assignedLocation = assignedLocation;
                        addNotification(enrollment.userId, `Payment for "${enrollment.courseName}" confirmed! You can now schedule your classes from the dashboard.`);
                        addNotification(enrollment.userId, `Important: Please bring a photocopy of your submitted NID/Passport to all your classes for verification.`);
                        alertMessage = 'Payment confirmed and location set. User notified.';
                    }
                    break;
                case 'reject-request':
                case 'reject-payment':
                    enrollments[enrollmentIndex].status = action === 'reject-request' ? 'Not Available' : 'Payment Rejected';
                    addNotification(enrollment.userId, `We're sorry, there was an issue with your request for "${enrollment.courseName}". Please contact support if you have questions.`);
                    alertMessage = 'Request has been rejected.';
                    break;
            }
            if(alertMessage) alert(alertMessage);
            saveEnrollments(enrollments);
            renderEnrollmentsTable();
        }
    });

    usersTBody.addEventListener('click', e => {
        const editButton = e.target.closest('button[data-action="edit-user"]');
        if (editButton) {
            const userId = editButton.dataset.id;
            const userToEdit = getUsers().find(u => u.id == userId);
            if (userToEdit) {
                document.getElementById('edit-user-id').value = userToEdit.id;
                document.getElementById('edit-user-name').value = userToEdit.name;
                document.getElementById('edit-user-mobile').value = userToEdit.mobile;
                userEditModal.style.display = 'flex';
            }
            return;
        }

        const reactivateButton = e.target.closest('button[data-action="reactivate-user"]');
        if (reactivateButton) {
            const userId = reactivateButton.dataset.id;
            if (confirm('Are you sure you want to reactivate this user account?')) {
                let users = getUsers();
                const userIndex = users.findIndex(u => u.id == userId);
                if (userIndex > -1) {
                    users[userIndex].accountStatus = 'active';
                    saveUsers(users);
                    addNotification(userId, "Your account has been reactivated by the admin. You can now log in.");
                    alert('User account has been reactivated.');
                    renderUsersTable();
                }
            }
        }
    });

    userEditForm.addEventListener('submit', e => {
        e.preventDefault();
        const userId = document.getElementById('edit-user-id').value;
        const newName = document.getElementById('edit-user-name').value;
        const newMobile = document.getElementById('edit-user-mobile').value;
        let users = getUsers();
        const userIndex = users.findIndex(u => u.id == userId);
        if (userIndex > -1) {
            users[userIndex].name = newName;
            users[userIndex].mobile = newMobile;
            saveUsers(users);
            alert('User updated successfully!');
            userEditModal.style.display = 'none';
            renderUsersTable();
        } else {
            alert('Error: User not found.');
        }
    });

    conversationList.addEventListener('click', e => {
        const convoItem = e.target.closest('li[data-userid]');
        if (convoItem) {
            const userId = convoItem.dataset.userid;
            const userName = convoItem.dataset.username;

            document.querySelectorAll('#conversation-list li').forEach(li => li.classList.remove('active'));
            convoItem.classList.add('active');

            currentConvoTitle.textContent = `Conversation with ${userName}`;
            replyUserIdInput.value = userId;
            adminReplyForm.style.display = 'block';
            renderAdminConversation(userId);
        }
    });

    adminReplyForm.addEventListener('submit', e => {
        e.preventDefault();
        const userId = replyUserIdInput.value;
        const messageText = document.getElementById('admin-reply-message').value.trim();
        if (!userId || !messageText) return;

        let conversations = getMessages();
        const convoIndex = conversations.findIndex(c => c.userId == userId);

        if (convoIndex > -1) {
            conversations[convoIndex].messages.push({
                sender: 'admin',
                text: messageText,
                timestamp: new Date().toISOString()
            });

            saveMessages(conversations);
            addNotification(userId, "You have a new message from Admin.");
            renderAdminConversation(userId);
            renderConversationList(); // Re-render to sort by last message time
            e.target.reset();
        } else {
            alert("Error: Could not find conversation to reply to.");
        }
    });

    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', e => e.target.closest('.modal-overlay').style.display = 'none'));
    document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); sessionStorage.removeItem('loggedInUser'); window.location.href = 'index.html'; });

    const renderAll = () => {
        renderEnrollmentsTable();
        renderUsersTable();
        renderConversationList();
        renderSupportRequests();
        renderLoginHistoryTable();
    };
    renderAll();
});
*/


document.addEventListener('DOMContentLoaded', () => {
    const loggedInAdmin = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInAdmin || loggedInAdmin.role !== 'admin') {
        alert('Access Denied.');
        window.location.href = 'index.html';
        return;
    }

    const enrollmentsTBody = document.querySelector('#enrollments-table tbody');
    const usersTBody = document.querySelector('#users-table tbody');
    const userEditModal = document.getElementById('user-edit-modal');
    const userEditForm = document.getElementById('user-edit-form');
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const conversationList = document.getElementById('conversation-list');
    const adminConversationThread = document.getElementById('admin-conversation-thread');
    const adminReplyForm = document.getElementById('admin-reply-form');
    const replyUserIdInput = document.getElementById('reply-user-id');
    const currentConvoTitle = document.getElementById('current-convo-title');
    const supportList = document.getElementById('support-messages-list');
    const loginHistoryTBody = document.querySelector('#login-history-table tbody');

    const getEnrollments = () => JSON.parse(localStorage.getItem('dhakaDriveEnrollments')) || [];
    const saveEnrollments = (data) => localStorage.setItem('dhakaDriveEnrollments', JSON.stringify(data));
    const getUsers = () => JSON.parse(localStorage.getItem('dhakaDriveUsers')) || [];
    const saveUsers = (data) => localStorage.setItem('dhakaDriveUsers', JSON.stringify(data));
    const getMessages = () => JSON.parse(localStorage.getItem('dhakaDriveMessages')) || [];
    const saveMessages = (data) => localStorage.setItem('dhakaDriveMessages', JSON.stringify(data));
    const getLoginHistory = () => JSON.parse(localStorage.getItem('dhakaDriveLoginHistory')) || [];
    const addNotification = (userId, message) => {
        const notifications = JSON.parse(localStorage.getItem('dhakaDriveNotifications')) || [];
        notifications.push({ id: Date.now(), userId, message, read: false });
        localStorage.setItem('dhakaDriveNotifications', JSON.stringify(notifications));
    };

    
    const renderEnrollmentsTable = () => {
        const enrollments = getEnrollments().reverse();
        enrollmentsTBody.innerHTML = enrollments.map(enroll => {
            let actionButtons = 'Processed';
            if (enroll.status === 'Requested') {
                actionButtons = `<button class="btn btn-sm btn-approve" data-id="${enroll.id}" data-action="approve-payment">Approve</button><button class="btn btn-sm btn-reject" data-id="${enroll.id}" data-action="reject-request">Reject</button>`;
            } else if (enroll.status === 'Payment Submitted') {
                actionButtons = `<button class="btn btn-sm btn-approve" data-id="${enroll.id}" data-action="confirm-payment">Confirm</button><button class="btn btn-sm btn-reject" data-id="${enroll.id}" data-action="reject-payment">Reject</button>`;
            } else if (enroll.status === 'Awaiting Cash Payment') {
                actionButtons = `<button class="btn btn-sm btn-approve" data-id="${enroll.id}" data-action="confirm-payment">Confirm Cash</button>`;
            }
            const scheduleInfo = enroll.scheduledSlot ? `<strong>Schedule:</strong> ${enroll.scheduledSlot}` : 'Not Scheduled';
            const paymentInfo = enroll.paymentMethod ? `<br><small><strong>Payment:</strong> ${enroll.paymentMethod}${enroll.trxId && enroll.trxId !== 'N/A' ? ` (TrxID: ${enroll.trxId})` : ''}</small>` : '';

            return `<tr><td><strong>${enroll.userName}</strong><br><small>${enroll.userEmail}<br>${enroll.userMobile}${paymentInfo}</small></td><td>${enroll.courseName}</td><td>${enroll.assignedLocation || 'N/A'}<br/><small>${scheduleInfo}</small></td><td>${new Date(enroll.id).toLocaleDateString()}</td><td><span class="status ${enroll.status.toLowerCase().replace(/ /g, '-')}">${enroll.status}</span></td><td><div class="action-buttons">${actionButtons}</div></td></tr>`;
        }).join('') || `<tr><td colspan="6">No enrollments found.</td></tr>`;
    };
    
    /*
    const renderUsersTable = () => {
        const allUsers = getUsers().filter(u => u.role === 'user');
        usersTBody.innerHTML = allUsers.map(u => {
            let docInfo = 'Not Submitted';
            if (u.document) {
                docInfo = u.document.number || 'Number not provided';
                if (u.document.fileData) {
                    docInfo += ` <a href="${u.document.fileData}" target="_blank" class="view-file-link" download="${u.document.fileName || 'document'}">View File</a>`;
                }
            }

            const editButton = `<button class="btn btn-sm" data-action="edit-user" data-id="${u.id}">Edit</button>`;
            let statusToggleButton;

            if (u.accountStatus === 'active') {
                statusToggleButton = `<button class="btn btn-sm btn-reject" data-action="deactivate-user" data-id="${u.id}">Deactivate</button>`;
            } else {
                statusToggleButton = `<button class="btn btn-sm btn-approve" data-action="reactivate-user" data-id="${u.id}">Reactivate</button>`;
            }
            
            const actionButtons = `<div class="action-buttons">${editButton}${statusToggleButton}</div>`;

            return `<tr>
                        <td>${u.name}</td>
                        <td>${u.email}<br>${u.mobile}</td>
                        <td>${u.address || 'N/A'}</td>
                        <td>${docInfo}</td>
                        <td><span class="status ${u.accountStatus}">${u.accountStatus}</span></td>
                        <td>${actionButtons}</td>
                    </tr>`;
        }).join('') || `<tr><td colspan="6">No users found.</td></tr>`;
    };
    */

    const renderUsersTable = () => {
        const allUsers = getUsers().filter(u => u.role === 'user');
        usersTBody.innerHTML = allUsers.map(u => {
            let docInfo = 'Not Submitted';
            if (u.document) {
                docInfo = u.document.number || 'Number not provided';
                if (u.document.fileData) {
                    docInfo += ` <a href="${u.document.fileData}" target="_blank" class="view-file-link" download="${u.document.fileName || 'document'}">View File</a>`;
                }
            }

            const editButton = `<button class="btn btn-sm" data-action="edit-user" data-id="${u.id}">Edit</button>`;
            let statusToggleButton;

            if (u.accountStatus === 'active') {
                statusToggleButton = `<button class="btn btn-sm btn-reject" data-action="deactivate-user" data-id="${u.id}">Deactivate</button>`;
            } else {
                statusToggleButton = `<button class="btn btn-sm btn-approve" data-action="reactivate-user" data-id="${u.id}">Reactivate</button>`;
            }
            
            const actionButtons = `<div class="action-buttons">${editButton}${statusToggleButton}</div>`;

            return `<tr>
                        <td>${u.name}</td>
                        <td>${u.email}<br>${u.mobile}</td>
                        <td>${u.address || 'N/A'}</td>
                        <td>${docInfo}</td>
                        <td><span class="status ${u.accountStatus}">${u.accountStatus}</span></td>
                        <td>${actionButtons}</td>
                    </tr>`;
        }).join('') || `<tr><td colspan="6">No users found.</td></tr>`;
    };

    const renderConversationList = () => {
        const conversations = getMessages().sort((a,b) => new Date(b.messages.slice(-1)[0].timestamp) - new Date(a.messages.slice(-1)[0].timestamp));
        if (conversations.length === 0) {
            conversationList.innerHTML = '<li>No conversations found.</li>';
            return;
        }
        conversationList.innerHTML = conversations.map(convo => {
            const lastMessage = convo.messages[convo.messages.length - 1];
            return `
            <li data-userid="${convo.userId}" data-username="${convo.userName}">
                <strong>${convo.userName}</strong>
                <small>${lastMessage.text.substring(0, 25)}...</small>
            </li>
        `}).join('');
    };

    const renderAdminConversation = (userId) => {
        const conversation = getMessages().find(c => c.userId == userId);
        if (!conversation) {
            adminConversationThread.innerHTML = '<p class="message-placeholder">Could not find this conversation.</p>';
            return;
        }
        adminConversationThread.innerHTML = conversation.messages.map(msg => `
            <div class="message-bubble ${msg.sender === 'admin' ? 'admin-bubble' : 'user-bubble'}">
                <p>${msg.text}</p>
                <small>${new Date(msg.timestamp).toLocaleString()}</small>
            </div>
        `).join('');
        adminConversationThread.scrollTop = adminConversationThread.scrollHeight;
    };

    const renderSupportRequests = () => {
        const conversations = getMessages();
        const firstMessages = conversations.map(convo => {
            const firstUserMessage = convo.messages.find(msg => msg.sender === 'user');
            return firstUserMessage ? { ...firstUserMessage, userName: convo.userName, userEmail: getUsers().find(u => u.id === convo.userId)?.email || 'N/A' } : null;
        }).filter(Boolean);

        if (firstMessages.length === 0) {
            supportList.innerHTML = '<p>No support requests found.</p>';
            return;
        }

        supportList.innerHTML = firstMessages.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(msg => `
            <div class="support-item">
                <div class="support-item-header">
                    <strong>From: ${msg.userName} (${msg.userEmail})</strong>
                    <span>${new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <p>${msg.text}</p>
            </div>
        `).join('');
    };

    const renderLoginHistoryTable = () => {
        const history = getLoginHistory().reverse();
        loginHistoryTBody.innerHTML = history.map(log => 
            `<tr>
                <td>${log.userName}</td>
                <td>${log.userEmail}</td>
                <td>${new Date(log.loginTime).toLocaleString()}</td>
            </tr>`
        ).join('') || `<tr><td colspan="3">No login history found.</td></tr>`;
    };

    tabs.forEach(tab => tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    }));

    enrollmentsTBody.addEventListener('click', e => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        const enrollmentId = button.dataset.id;
        const action = button.dataset.action;
        let enrollments = getEnrollments();
        const enrollmentIndex = enrollments.findIndex(en => en.id == enrollmentId);
        if (enrollmentIndex > -1) {
            const enrollment = enrollments[enrollmentIndex];
            let alertMessage = '';
            switch (action) {
                case 'approve-payment':
                    enrollments[enrollmentIndex].status = 'Awaiting Payment';
                    addNotification(enrollment.userId, `Good news! A slot for "${enrollment.courseName}" is available. Please complete the payment from your dashboard.`);
                    alertMessage = 'Request approved. User notified to make payment.';
                    break;
                case 'confirm-payment':
                    const assignedLocation = prompt("Payment confirmed. Enter the final class location:", enrollment.userPreferredLocation || "Dhanmondi Branch");
                    if (assignedLocation) {
                        enrollments[enrollmentIndex].status = 'Approved';
                        enrollments[enrollmentIndex].assignedLocation = assignedLocation;
                        addNotification(enrollment.userId, `Payment for "${enrollment.courseName}" confirmed! You can now schedule your classes from the dashboard.`);
                        addNotification(enrollment.userId, `Important: Please bring a photocopy of your submitted NID/Passport to all your classes for verification.`);
                        alertMessage = 'Payment confirmed and location set. User notified.';
                    }
                    break;
                case 'reject-request':
                case 'reject-payment':
                    enrollments[enrollmentIndex].status = action === 'reject-request' ? 'Not Available' : 'Payment Rejected';
                    addNotification(enrollment.userId, `We're sorry, there was an issue with your request for "${enrollment.courseName}". Please contact support if you have questions.`);
                    alertMessage = 'Request has been rejected.';
                    break;
            }
            if(alertMessage) alert(alertMessage);
            saveEnrollments(enrollments);
            renderEnrollmentsTable();
        }
    });

    usersTBody.addEventListener('click', e => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const userId = button.dataset.id;
        const action = button.dataset.action;

        let users = getUsers();
        const userIndex = users.findIndex(u => u.id == userId);

        if (userIndex === -1) {
            alert('Error: User not found.');
            return;
        }

        switch (action) {
            case 'edit-user':
                const userToEdit = users[userIndex];
                document.getElementById('edit-user-id').value = userToEdit.id;
                document.getElementById('edit-user-name').value = userToEdit.name;
                document.getElementById('edit-user-mobile').value = userToEdit.mobile;
                document.getElementById('edit-user-address').value = userToEdit.address || '';
                userEditModal.style.display = 'flex';
                break;

            case 'reactivate-user':
                if (confirm('Are you sure you want to reactivate this user account?')) {
                    users[userIndex].accountStatus = 'active';
                    saveUsers(users);
                    addNotification(userId, "Your account has been reactivated by the admin. You can now log in.");
                    alert('User account has been reactivated.');
                    renderUsersTable();
                }
                break;
            
            case 'deactivate-user':
                if (confirm('Are you sure you want to deactivate this user account? The user will not be able to log in.')) {
                    users[userIndex].accountStatus = 'inactive';
                    saveUsers(users);
                    addNotification(userId, "Your account has been deactivated by an administrator. Please contact support for assistance.");
                    alert('User account has been deactivated.');
                    renderUsersTable();
                }
                break;
        }
    });

    userEditForm.addEventListener('submit', e => {
        e.preventDefault();
        const userId = document.getElementById('edit-user-id').value;
        const newName = document.getElementById('edit-user-name').value;
        const newMobile = document.getElementById('edit-user-mobile').value;
        const newAddress = document.getElementById('edit-user-address').value;

        let users = getUsers();
        const userIndex = users.findIndex(u => u.id == userId);
        if (userIndex > -1) {
            users[userIndex].name = newName;
            users[userIndex].mobile = newMobile;
            users[userIndex].address = newAddress;
            saveUsers(users);
            alert('User updated successfully!');
            userEditModal.style.display = 'none';
            renderUsersTable();
        } else {
            alert('Error: User not found.');
        }
    });

    conversationList.addEventListener('click', e => {
        const convoItem = e.target.closest('li[data-userid]');
        if (convoItem) {
            const userId = convoItem.dataset.userid;
            const userName = convoItem.dataset.username;

            document.querySelectorAll('#conversation-list li').forEach(li => li.classList.remove('active'));
            convoItem.classList.add('active');

            currentConvoTitle.textContent = `Conversation with ${userName}`;
            replyUserIdInput.value = userId;
            adminReplyForm.style.display = 'block';
            renderAdminConversation(userId);
        }
    });

    adminReplyForm.addEventListener('submit', e => {
        e.preventDefault();
        const userId = replyUserIdInput.value;
        const messageText = document.getElementById('admin-reply-message').value.trim();
        if (!userId || !messageText) return;

        let conversations = getMessages();
        const convoIndex = conversations.findIndex(c => c.userId == userId);

        if (convoIndex > -1) {
            conversations[convoIndex].messages.push({
                sender: 'admin',
                text: messageText,
                timestamp: new Date().toISOString()
            });

            saveMessages(conversations);
            addNotification(userId, "You have a new message from Admin.");
            renderAdminConversation(userId);
            renderConversationList(); 
            e.target.reset();
        } else {
            alert("Error: Could not find conversation to reply to.");
        }
    });

    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', e => e.target.closest('.modal-overlay').style.display = 'none'));
    document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); sessionStorage.removeItem('loggedInUser'); window.location.href = 'index.html'; });

    const renderAll = () => {
        renderEnrollmentsTable();
        renderUsersTable();
        renderConversationList();
        renderSupportRequests();
        renderLoginHistoryTable();
    };
    renderAll();
});