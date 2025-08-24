document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://127.0.0.1:5001';
    const loggedInAdmin = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInAdmin || loggedInAdmin.role !== 'admin') {
        alert('Access Denied.');
        window.location.href = 'index.html';
        return;
    }

    // --- Element Selectors ---
    const enrollmentsTBody = document.querySelector('#enrollments-table tbody');
    const usersTBody = document.querySelector('#users-table tbody');
    const loginHistoryTBody = document.querySelector('#login-history-table tbody');
    const userEditModal = document.getElementById('user-edit-modal');
    const userEditForm = document.getElementById('user-edit-form');
    const conversationList = document.getElementById('conversation-list');
    const adminConversationThread = document.getElementById('admin-conversation-thread');
    const adminReplyForm = document.getElementById('admin-reply-form');
    const currentConvoTitle = document.getElementById('current-convo-title');
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- API Headers ---
    const authHeaders = { 'X-User-ID': loggedInAdmin.id, 'Content-Type': 'application/json' };

    // --- RENDER FUNCTIONS ---

    const renderEnrollmentsTable = async () => {
        if (!enrollmentsTBody) return;
        try {
            const response = await fetch(`${API_URL}/api/admin/enrollments`, { headers: { 'X-User-ID': loggedInAdmin.id } });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch enrollments');
            
            enrollmentsTBody.innerHTML = result.enrollments.map(enroll => {
                let actionButtons = '';
                if (enroll.status === 'Requested') {
                    actionButtons = `<button class="btn btn-sm btn-approve" data-id="${enroll.id}" data-status="Awaiting Payment">Approve</button> <button class="btn btn-sm btn-reject" data-id="${enroll.id}" data-status="Rejected">Reject</button>`;
                } else if (enroll.status === 'Payment Submitted') {
                    actionButtons = `<button class="btn btn-sm btn-approve" data-id="${enroll.id}" data-status="Approved">Confirm Payment</button> <button class="btn btn-sm btn-reject" data-id="${enroll.id}" data-status="Rejected">Reject</button>`;
                } else {
                    actionButtons = `<span class="status-text">${enroll.status}</span>`;
                }
                return `<tr>
                            <td><strong>${enroll.userName}</strong><br><small>${enroll.userEmail}</small></td>
                            <td>${enroll.courseName}</td>
                            <td><span class="status ${enroll.status.toLowerCase().replace(/ /g, '-')}">${enroll.status}</span></td>
                            <td><div class="action-buttons">${actionButtons}</div></td>
                        </tr>`;
            }).join('') || `<tr><td colspan="4">No enrollments found.</td></tr>`;
        } catch (error) {
            console.error('Error fetching enrollments:', error);
            enrollmentsTBody.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`;
        }
    };

    const renderUsersTable = async () => {
        if (!usersTBody) return;
        try {
            const response = await fetch(`${API_URL}/api/admin/users`, { headers: { 'X-User-ID': loggedInAdmin.id } });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch users');

            usersTBody.innerHTML = result.users.map(user => {
                const statusButton = user.status === 'Active'
                    ? `<button class="btn btn-sm btn-reject" data-action="deactivate" data-id="${user.id}">Deactivate</button>`
                    : `<button class="btn btn-sm btn-approve" data-action="activate" data-id="${user.id}">Activate</button>`;
                return `<tr>
                            <td>${user.name}</td>
                            <td>${user.email}<br>${user.mobile}</td>
                            <td>${user.address || 'N/A'}</td>
                            <td><span class="status ${user.status.toLowerCase()}">${user.status}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm" data-action="edit" data-user='${JSON.stringify(user)}'>Edit</button>
                                    ${statusButton}
                                </div>
                            </td>
                        </tr>`;
            }).join('') || `<tr><td colspan="5">No users found.</td></tr>`;
        } catch (error) {
            console.error('Error fetching users:', error);
            usersTBody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
        }
    };

    const renderConversationList = async () => {
        if (!conversationList) return;
        try {
            const response = await fetch(`${API_URL}/api/admin/conversations`, { headers: { 'X-User-ID': loggedInAdmin.id } });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch conversations');
            
            if (result.conversations.length === 0) {
                conversationList.innerHTML = '<li>No conversations found.</li>';
                return;
            }
            conversationList.innerHTML = result.conversations.map(convo => `
                <li data-userid="${convo.userId}" data-username="${convo.userName}">
                    <strong>${convo.userName}</strong>
                    <small>${convo.lastMessage.substring(0, 25)}...</small>
                </li>`).join('');
        } catch (error) {
            console.error('Error fetching conversations:', error);
            conversationList.innerHTML = `<li>${error.message}</li>`;
        }
    };

    const renderAdminConversation = async (userId, userName) => {
        if (!adminConversationThread) return;
        currentConvoTitle.textContent = `Conversation with ${userName}`;
        adminReplyForm.style.display = 'block';
        document.getElementById('reply-user-id').value = userId;
        try {
            const response = await fetch(`${API_URL}/api/messages/${userId}`);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch messages');

            adminConversationThread.innerHTML = result.messages.map(msg => {
                const bubbleClass = msg.senderId === loggedInAdmin.id ? 'admin-bubble' : 'user-bubble';
                return `<div class="message-bubble ${bubbleClass}">
                            <p>${msg.content}</p>
                            <small>${new Date(msg.timestamp).toLocaleString()}</small>
                        </div>`;
            }).join('');
            adminConversationThread.scrollTop = adminConversationThread.scrollHeight;
        } catch (error) {
            console.error('Error fetching conversation:', error);
            adminConversationThread.innerHTML = `<p>${error.message}</p>`;
        }
    };

    const renderLoginHistoryTable = async () => {
        if (!loginHistoryTBody) return;
        try {
            const response = await fetch(`${API_URL}/api/admin/login-history`, { headers: { 'X-User-ID': loggedInAdmin.id } });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch login history');
            
            loginHistoryTBody.innerHTML = result.history.map(log => `
                <tr>
                    <td>${log.userName}</td>
                    <td>${log.userEmail}</td>
                    <td>${new Date(log.loginTime).toLocaleString()}</td>
                </tr>`).join('') || `<tr><td colspan="3">No login history found.</td></tr>`;
        } catch (error) {
            console.error('Error fetching login history:', error);
            loginHistoryTBody.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`;
        }
    };

    // --- API CALLS ---

    const updateEnrollmentStatus = async (enrollmentId, newStatus) => {
        if (!confirm(`Are you sure you want to set status to "${newStatus}"?`)) return;
        try {
            const response = await fetch(`${API_URL}/api/admin/enrollments/${enrollmentId}/status`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({ status: newStatus })
            });
            const result = await response.json();
            alert(result.message);
            if (response.ok) renderEnrollmentsTable();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Could not connect to server.');
        }
    };

    const updateUserStatus = async (userId, isActive) => {
        const action = isActive ? 'activate' : 'deactivate';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            const response = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({ isActive })
            });
            const result = await response.json();
            alert(result.message);
            if (response.ok) renderUsersTable();
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            alert('Could not connect to server.');
        }
    };

    // --- EVENT LISTENERS ---

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
            
            // Re-render table when tab is clicked
            if (tab.dataset.tab === 'enrollments') renderEnrollmentsTable();
            if (tab.dataset.tab === 'users') renderUsersTable();
            if (tab.dataset.tab === 'messaging') renderConversationList();
            if (tab.dataset.tab === 'log-history') renderLoginHistoryTable();
        });
    });

    if (enrollmentsTBody) {
        enrollmentsTBody.addEventListener('click', e => {
            const button = e.target.closest('button[data-id]');
            if (button && button.dataset.status) {
                updateEnrollmentStatus(button.dataset.id, button.dataset.status);
            }
        });
    }

    if (usersTBody) {
        usersTBody.addEventListener('click', e => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            const action = button.dataset.action;
            const userId = button.dataset.id;

            if (action === 'edit') {
                const userData = JSON.parse(button.dataset.user);
                document.getElementById('edit-user-id').value = userData.id;
                document.getElementById('edit-user-name').value = userData.name;
                document.getElementById('edit-user-mobile').value = userData.mobile;
                document.getElementById('edit-user-address').value = userData.address || '';
                userEditModal.style.display = 'flex';
            } else if (action === 'deactivate') {
                updateUserStatus(userId, false);
            } else if (action === 'activate') {
                updateUserStatus(userId, true);
            }
        });
    }

    if (userEditForm) {
        userEditForm.addEventListener('submit', async e => {
            e.preventDefault();
            const userId = document.getElementById('edit-user-id').value;
            const updatedData = {
                name: document.getElementById('edit-user-name').value,
                mobile: document.getElementById('edit-user-mobile').value,
                address: document.getElementById('edit-user-address').value
            };

            try {
                const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: authHeaders,
                    body: JSON.stringify(updatedData)
                });
                const result = await response.json();
                alert(result.message);
                if (response.ok) {
                    userEditModal.style.display = 'none';
                    renderUsersTable();
                }
            } catch (error) {
                console.error('Error updating user:', error);
                alert('Could not connect to server.');
            }
        });
    }

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            userEditModal.style.display = 'none';
        });
    });

    document.getElementById('logout-btn').addEventListener('click', e => {
        e.preventDefault();
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    });

    if (conversationList) {
        conversationList.addEventListener('click', e => {
            const convoItem = e.target.closest('li[data-userid]');
            if (convoItem) {
                document.querySelectorAll('#conversation-list li').forEach(li => li.classList.remove('active'));
                convoItem.classList.add('active');
                renderAdminConversation(convoItem.dataset.userid, convoItem.dataset.username);
            }
        });
    }

    if (adminReplyForm) {
        adminReplyForm.addEventListener('submit', async e => {
            e.preventDefault();
            const receiverId = document.getElementById('reply-user-id').value;
            const content = document.getElementById('admin-reply-message').value.trim();
            if (!receiverId || !content) return;

            try {
                const response = await fetch(`${API_URL}/api/messages`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ senderId: loggedInAdmin.id, receiverId: receiverId, content })
                });
                const result = await response.json();
                if (response.ok) {
                    e.target.reset();
                    const activeUser = document.querySelector('#conversation-list li.active');
                    renderAdminConversation(activeUser.dataset.userid, activeUser.dataset.username);
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Send reply error:', error);
                alert('Could not send reply.');
            }
        });
    }

    // --- INITIAL RENDER ---
    const initialRender = () => {
        renderEnrollmentsTable();
        renderUsersTable();
        renderConversationList();
        renderLoginHistoryTable();
    };

    initialRender();
});