// =============================================================
// ==      ملف منطق لوحة التحكم (مع ميزة تعديل اللاعبين)      ==
// =============================================================

import { supabase } from '../config.js';
import { 
    fetchAllPlayers, 
    fetchAllStoreItems, 
    addStoreItem, 
    deleteStoreItem,
    getDashboardStats,
    updatePlayerByAdmin // <-- استيراد الدالة الجديدة
} from '../js/api.js';

// --- عناصر الواجهة ---
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginButton = document.getElementById('admin-login-button');
const logoutButton = document.getElementById('logout-button');
const loginError = document.getElementById('login-error');
const playersTableBody = document.getElementById('players-table-body');
const playerSearchInput = document.getElementById('player-search');
const storeItemsList = document.getElementById('store-items-list');
const addItemButton = document.getElementById('add-item-button');
const totalPlayersStat = document.getElementById('total-players-stat');
const totalQuizzesStat = document.getElementById('total-quizzes-stat');
const averageScoreStat = document.getElementById('average-score-stat');

// ▼▼▼ عناصر واجهة التعديل الجديدة ▼▼▼
const editPlayerModal = document.getElementById('edit-player-modal');
const closeModalButton = document.querySelector('.close-button');
const savePlayerChangesButton = document.getElementById('save-player-changes-button');
const editPlayerIdInput = document.getElementById('edit-player-id');
const editPlayerUsernameInput = document.getElementById('edit-player-username');
const editPlayerXpInput = document.getElementById('edit-player-xp');
const editPlayerDiamondsInput = document.getElementById('edit-player-diamonds');
// ▲▲▲ نهاية عناصر الواجهة الجديدة ▲▲▲

let allPlayers = []; // لتخزين جميع اللاعبين محليًا

// --- التحقق من حالة تسجيل الدخول عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const userRole = await getUserRole();
        if (userRole === 'admin') {
            showDashboard();
        } else {
            showLoginScreen();
            await supabase.auth.signOut(); // تسجيل الخروج إذا لم يكن مشرفًا
        }
    } else {
        showLoginScreen();
    }
});

// --- دوال التحكم بالواجهة ---
function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
}

async function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    await loadDashboardData();
}

// --- منطق المصادقة ---
loginButton.addEventListener('click', async () => {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    loginError.textContent = '';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        loginError.textContent = 'بيانات اعتماد تسجيل الدخول غير صالحة.';
        return;
    }

    const userRole = await getUserRole();
    if (userRole === 'admin') {
        showDashboard();
    } else {
        loginError.textContent = 'ليس لديك صلاحيات المشرف.';
        await supabase.auth.signOut();
    }
});

logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLoginScreen();
});

async function getUserRole() {
    const { data, error } = await supabase.rpc('get_user_role');
    if (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
    return data;
}

// --- تحميل بيانات لوحة التحكم ---
async function loadDashboardData() {
    // تحميل كل البيانات بالتوازي
    const [players, storeItems, stats] = await Promise.all([
        fetchAllPlayers(),
        fetchAllStoreItems(),
        getDashboardStats()
    ]);

    if (players) {
        allPlayers = players;
        renderPlayersTable(allPlayers);
    }
    if (storeItems) {
        renderStoreItems(storeItems);
    }
    if (stats) {
        totalPlayersStat.textContent = stats.total_players;
        totalQuizzesStat.textContent = stats.total_quizzes;
        averageScoreStat.textContent = parseFloat(stats.average_score).toFixed(2) + '%';
    }
}

// --- إدارة اللاعبين ---
function renderPlayersTable(players) {
    playersTableBody.innerHTML = '';
    players.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.id.substring(0, 8)}...</td>
            <td>${player.username}</td>
            <td>${player.email}</td>
            <td>${player.xp}</td>
            <td>${player.diamonds}</td>
            <td>${new Date(player.created_at).toLocaleDateString()}</td>
            <td>
                <button class="edit-btn" data-player-id="${player.id}">تعديل</button>
            </td>
        `;
        playersTableBody.appendChild(row);
    });

    // ▼▼▼ إضافة مستمعي الأحداث لأزرار التعديل الجديدة ▼▼▼
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const playerId = e.target.dataset.playerId;
            openEditModal(playerId);
        });
    });
}

playerSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredPlayers = allPlayers.filter(player => 
        player.username.toLowerCase().includes(searchTerm) ||
        player.email.toLowerCase().includes(searchTerm)
    );
    renderPlayersTable(filteredPlayers);
});

// --- إدارة المتجر ---
// (تبقى دوال إدارة المتجر كما هي)
function renderStoreItems(items) {
    storeItemsList.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name} (ID: ${item.id}) - ${item.price} 💎</span>
            <button class="delete-btn" data-item-id="${item.id}">&times;</button>
        `;
        li.querySelector('.delete-btn').addEventListener('click', async (e) => {
            const itemId = e.target.dataset.itemId;
            if (confirm(`هل أنت متأكد من حذف العنصر ${itemId}؟`)) {
                await deleteStoreItem(itemId);
                await loadDashboardData(); // إعادة تحميل البيانات
            }
        });
        storeItemsList.appendChild(li);
    });
}

addItemButton.addEventListener('click', async () => {
    const newItem = {
        id: document.getElementById('item-id').value,
        name: document.getElementById('item-name').value,
        description: document.getElementById('item-description').value,
        price: parseInt(document.getElementById('item-price').value, 10),
        type: document.getElementById('item-type').value,
        value: document.getElementById('item-value').value,
        sort_order: parseInt(document.getElementById('item-sort-order').value, 10)
    };

    if (!newItem.id || !newItem.name || isNaN(newItem.price)) {
        alert('يرجى ملء الحقول المطلوبة (المعرف، الاسم، السعر) بشكل صحيح.');
        return;
    }

    await addStoreItem(newItem);
    alert('تمت إضافة العنصر بنجاح!');
    await loadDashboardData(); // إعادة تحميل البيانات
});


// ▼▼▼ دوال منطق تعديل اللاعب الجديدة ▼▼▼

/**
 * يفتح نافذة التعديل ويملؤها ببيانات اللاعب المحدد.
 * @param {string} playerId 
 */
function openEditModal(playerId) {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;

    editPlayerIdInput.value = player.id;
    editPlayerUsernameInput.value = player.username;
    editPlayerXpInput.value = player.xp;
    editPlayerDiamondsInput.value = player.diamonds;

    editPlayerModal.classList.remove('hidden');
}

/**
 * يغلق نافذة التعديل.
 */
function closeEditModal() {
    editPlayerModal.classList.add('hidden');
}

// مستمع حدث لإغلاق النافذة عند النقر على زر الإغلاق (×)
closeModalButton.addEventListener('click', closeEditModal);

// مستمع حدث لإغلاق النافذة عند النقر خارجها
window.addEventListener('click', (event) => {
    if (event.target == editPlayerModal) {
        closeEditModal();
    }
});

// مستمع حدث لحفظ التغييرات
savePlayerChangesButton.addEventListener('click', async () => {
    const playerId = editPlayerIdInput.value;
    const updates = {
        username: editPlayerUsernameInput.value,
        xp: parseInt(editPlayerXpInput.value, 10),
        diamonds: parseInt(editPlayerDiamondsInput.value, 10)
    };

    if (!updates.username || isNaN(updates.xp) || isNaN(updates.diamonds)) {
        alert('يرجى التأكد من أن جميع الحقول مملوءة بشكل صحيح.');
        return;
    }

    // استدعاء دالة الواجهة الخلفية للتحديث
    const { error } = await updatePlayerByAdmin(playerId, updates);

    if (error) {
        alert(`فشل تحديث بيانات اللاعب: ${error.message}`);
    } else {
        alert('تم تحديث بيانات اللاعب بنجاح!');
        closeEditModal();
        await loadDashboardData(); // إعادة تحميل البيانات لتعكس التغييرات
    }
});
