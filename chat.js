let currentReceiverId = null; 

function switchTab(tab) {
    document.getElementById('tab-chat').classList.add('hidden');
    document.getElementById('tab-users').classList.add('hidden');
    document.getElementById('tab-profile').classList.add('hidden');
    
    document.getElementById('nav-chat').className = 'text-gray-400 flex flex-col items-center w-1/3';
    document.getElementById('nav-users').className = 'text-gray-400 flex flex-col items-center w-1/3';
    document.getElementById('nav-profile').className = 'text-gray-400 flex flex-col items-center w-1/3';
    document.getElementById(`nav-${tab}`).className = 'text-blue-500 flex flex-col items-center w-1/3';

    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    
    if (tab === 'chat' && currentReceiverId) {
        currentReceiverId = null; 
        document.getElementById('header-title').innerText = 'چت عمومی 🌍';
        loadMessages();
    }
}

async function loadMessages() {
    const box = document.getElementById('chat-box');
    box.innerHTML = '<p class="text-center text-gray-500 mt-4">در حال بارگذاری پیام‌ها...</p>';
    
    let query = supabaseClient.from('messages').select('*, profiles(display_name, avatar_url, is_verified)').order('created_at', { ascending: true });
    
    if (currentReceiverId) {
        query = query.or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${currentReceiverId}),and(sender_id.eq.${currentReceiverId},receiver_id.eq.${currentUser.id})`);
    } else {
        query = query.is('receiver_id', null);
    }

    const { data: messages } = await query;
    box.innerHTML = '';
    
    if(messages && messages.length > 0) {
        messages.forEach(msg => {
            const isMe = msg.sender_id === currentUser.id;
            const verified = msg.profiles.is_verified ? '<svg class="verified-badge" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>' : '';
            
            box.innerHTML += `
                <div class="flex ${isMe ? 'justify-end' : 'justify-start'} mb-2">
                    <div class="max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-blue-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}">
                        ${!isMe && !currentReceiverId ? `<div class="text-xs text-blue-300 mb-1 flex items-center">${msg.profiles.display_name} ${verified}</div>` : ''}
                        <div class="text-sm whitespace-pre-wrap">${msg.content}</div>
                    </div>
                </div>
            `;
        });
        box.scrollTop = box.scrollHeight;
    } else {
        box.innerHTML = '<p class="text-center text-gray-500 mt-4">هنوز پیامی وجود ندارد. اولین نفر باشید!</p>';
    }
}

async function sendMessage() {
    const input = document.getElementById('msg-input');
    const content = input.value.trim();
    if (!content) return;
    
    input.value = ''; 
    await supabaseClient.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: currentReceiverId,
        content: content
    });
    loadMessages();
}

async function loadUsers() {
    const { data: users } = await supabaseClient.from('profiles').select('*').neq('id', currentUser.id).eq('is_blocked', false);
    const list = document.getElementById('users-list');
    list.innerHTML = '';
    
    if(users && users.length > 0) {
        users.forEach(u => {
            const verified = u.is_verified ? '<svg class="verified-badge" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>' : '';
            
            list.innerHTML += `
                <div onclick="openPrivateChat('${u.id}', '${u.display_name}')" class="bg-slate-800 p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-700 border border-slate-700 transition-all">
                    <img src="${u.avatar_url}" class="w-10 h-10 rounded-full object-cover">
                    <div class="flex-1">
                        <div class="font-bold flex items-center text-sm">${u.display_name} ${verified}</div>
                        <div class="text-xs text-gray-400" dir="ltr">@${u.username || 'user'}</div>
                    </div>
                    <div class="text-blue-500 text-xs">گفتگو</div>
                </div>
            `;
        });
    } else {
        list.innerHTML = '<p class="text-center text-gray-500 mt-4">کاربر دیگری یافت نشد.</p>';
    }
}

function openPrivateChat(id, name) {
    currentReceiverId = id;
    document.getElementById('header-title').innerText = 'چت با ' + name;
    switchTab('chat');
}

function logout() {
    supabaseClient.auth.signOut();
    location.reload();
}
