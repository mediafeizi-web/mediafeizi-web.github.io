const SUPABASE_URL = 'https://tdmhcqiwwzkzgdzvikiu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Oo570G6D0UYC2Sny9xZGjA_qSEo-bhi';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentProfile = null;

async function checkUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        await loadProfile();
    }
}

async function sendOtp() {
    const phone = document.getElementById('phone').value;
    if(!phone || phone.length < 10) return document.getElementById('auth-msg').innerText = 'شماره معتبر وارد کنید';
    
    document.getElementById('btn-send-otp').innerText = 'در حال ارسال...';
    const { error } = await supabaseClient.auth.signInWithOtp({ phone: '+98' + phone.substring(1) });
    
    if (error) {
        document.getElementById('auth-msg').innerText = error.message;
        document.getElementById('btn-send-otp').innerText = 'دریافت کد';
    } else {
        document.getElementById('phone-step').classList.add('hidden');
        document.getElementById('otp-step').classList.remove('hidden');
        document.getElementById('auth-msg').innerText = '';
    }
}

async function verifyOtp() {
    const phone = document.getElementById('phone').value;
    const otp = document.getElementById('otp').value;
    document.getElementById('btn-verify-otp').innerText = 'در حال بررسی...';
    
    const { data, error } = await supabaseClient.auth.verifyOtp({ 
        phone: '+98' + phone.substring(1), 
        token: otp, 
        type: 'sms' 
    });
    
    if (error) {
        document.getElementById('auth-msg').innerText = 'کد وارد شده اشتباه است';
        document.getElementById('btn-verify-otp').innerText = 'تایید و ورود';
    } else {
        currentUser = data.user;
        await loadProfile();
    }
}

async function loadProfile() {
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
    
    if (data) {
        currentProfile = data;
        if (!data.display_name) showSetup();
        else showApp();
    } else {
        showSetup();
    }
}

function showSetup() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.remove('hidden');
}

async function saveProfile() {
    const name = document.getElementById('setup-name').value;
    const username = document.getElementById('setup-username').value;
    const avatar = document.getElementById('setup-avatar').value || `https://ui-avatars.com/api/?name=${name}&background=random`;
    
    if(!name) return alert('نام را وارد کنید');

    const { error } = await supabaseClient.from('profiles').insert({
        id: currentUser.id, 
        display_name: name, 
        username: username, 
        avatar_url: avatar, 
        phone: currentUser.phone
    });
    
    if (error) alert('خطا: ' + error.message);
    else {
        document.getElementById('setup-screen').classList.add('hidden');
        loadProfile();
    }
}

function showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    document.getElementById('prof-avatar').src = currentProfile.avatar_url;
    let nameHTML = currentProfile.display_name;
    if (currentProfile.is_verified) {
        nameHTML += ' <svg class="verified-badge" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
    }
    document.getElementById('prof-name').innerHTML = nameHTML;
    document.getElementById('prof-username').innerText = '@' + (currentProfile.username || 'user');
    document.getElementById('prof-bio').value = currentProfile.bio || '';

    loadMessages();
    loadUsers();
}

async function updateProfile() {
    const bio = document.getElementById('prof-bio').value;
    await supabaseClient.from('profiles').update({ bio: bio }).eq('id', currentUser.id);
    alert('بیوگرافی بروزرسانی شد!');
}

checkUser();
