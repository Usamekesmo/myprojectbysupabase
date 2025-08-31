// =============================================================
// ==      ملف لوحة التحكم للمشرف (نسخة التشخيص)     ==
// =============================================================

console.log("1. بدء تشغيل ملف admin.js");

import { supabase } from '../js/config.js';
import { 
    fetchAllPlayers, 
    fetchAllStoreItems, 
    addStoreItem, 
    deleteStoreItem, 
    getDashboardStats,
    updatePlayerByAdmin 
} from '../js/api.js';

// --- عناصر الواجهة ---
console.log("2. جاري تحديد عناصر الواجهة...");
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const welcomeMessage = document.getElementById('welcome-message');
const playersTableBody = document.getElementById('players-table-body');
const storeTableBody = document.getElementById('store-table-body');
const addItemForm = document.getElementById('add-item-form');
const statsContainer = document.getElementById('stats-container');
const editModal = document.getElementById('edit-player-modal');
const editForm = document.getElementById('edit-player-form');
const closeModalButton = document.querySelector('.close-button');
console.log(" - عنصر نافذة التعديل (editModal):", editModal);

let currentEditingPlayerId = null;

// --- دوال عرض الشاشات ---
const showLoginScreen = () => {
    console.log("استدعاء showLoginScreen()");
    if(loginScreen) loginScreen.classList.remove('hidden');
    if(dashboardScreen) dashboardScreen.classList.add('hidden');
};

const showDashboard = async () => {
    console.log("استدعاء showDashboard()");
    if(loginScreen) loginScreen.classList.add('hidden');
    if(dashboardScreen) dashboardScreen.classList.remove('hidden');
    const { data: { user } } = await supabase.auth.getUser();
    if(welcomeMessage) welcomeMessage.textContent = `مرحباً بك أيها المشرف، ${user.email}`;
    await loadAllData();
};

// --- تحميل البيانات ---
const loadAllData = async () => {
    console.log("استدعاء loadAllData()");
    await populatePlayersTable();
    await populateStoreTable();
    await loadStats();
};

// --- منطق اللاعبين ---
const populatePlayersTable = async () => {
    console.log("استدعاء populatePlayersTable()");
    // ... (بقية الكود يبقى كما هو)
    const players = await fetchAllPlayers();
    if(playersTableBody) playersTableBody.innerHTML = '';
    if (players && playersTableBody) {
        players.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${player.username || 'لا يوجد اسم'}</td><td>${player.email}</td><td>${player.xp}</td><td>${player.diamonds}</td><td>${new Date(player.created_at).toLocaleDateString()}</td><td><button class="edit-btn" data-player-id="${player.id}">تعديل</button></td>`;
            playersTableBody.appendChild(row);
        });
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const playerId = e.target.dataset.playerId;
                const playerRow = e.target.closest('tr');
                const playerData = { id: playerId, username: playerRow.cells[0].textContent, xp: playerRow.cells[2].textContent, diamonds: playerRow.cells[3].textContent };
                openEditModal(playerData);
            });
        });
    }
};

// --- منطق نافذة التعديل ---
const openEditModal = (player) => {
    console.log("!!! استدعاء openEditModal() للاعب:", player);
    currentEditingPlayerId = player.id;
    if(document.getElementById('edit-username')) document.getElementById('edit-username').value = player.username;
    if(document.getElementById('edit-xp')) document.getElementById('edit-xp').value = player.xp;
    if(document.getElementById('edit-diamonds')) document.getElementById('edit-diamonds').value = player.diamonds;
    if(editModal) editModal.classList.remove('hidden');
};

const closeEditModal = () => {
    console.log("استدعاء closeEditModal()");
    if(editModal) editModal.classList.add('hidden');
    currentEditingPlayerId = null;
};

// ... (بقية الدوال تبقى كما هي)
const populateStoreTable = async () => { /* ... */ };
const loadStats = async () => { /* ... */ };
const getUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('players').select('role').eq('id', user.id).single();
    return data ? data.role : null;
};


// --- معالجات الأحداث (Event Handlers) ---
console.log("3. جاري ربط مستمعي الأحداث...");
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => { /* ... */ });
}
if (addItemForm) {
    addItemForm.addEventListener('submit', async (e) => { /* ... */ });
}
if (editForm) {
    editForm.addEventListener('submit', async (e) => { /* ... */ });
}
if (closeModalButton) {
    console.log(" - تم العثور على زر الإغلاق، جاري ربط الحدث.");
    closeModalButton.addEventListener('click', closeEditModal);
} else {
    console.error(" - لم يتم العثور على زر الإغلاق (.close-button).");
}

// --- التحقق من حالة تسجيل الدخول عند تحميل الصفحة ---
console.log("4. جاري ربط حدث DOMContentLoaded...");
document.addEventListener('DOMContentLoaded', async () => {
    console.log("5. تم إطلاق حدث DOMContentLoaded.");
    const { data: { session } } = await supabase.auth.getSession();
    console.log(" - هل توجد جلسة؟", session ? "نعم" : "لا");
    if (session) {
        const userRole = await getUserRole();
        console.log(" - دور المستخدم:", userRole);
        if (userRole === 'admin') {
            await showDashboard();
        } else {
            showLoginScreen();
            await supabase.auth.signOut();
        }
    } else {
        showLoginScreen();
    }
    console.log("6. انتهى منطق DOMContentLoaded.");
});

console.log("7. انتهى تحميل ملف admin.js.");
