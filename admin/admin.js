// =============================================================
// ==      ملف لوحة التحكم للمشرف (النسخة النهائية مع إصلاح style)     ==
// =============================================================

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

let currentEditingPlayerId = null;

// --- دوال عرض الشاشات ---
const showLoginScreen = () => {
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
};

const showDashboard = async () => {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    const { data: { user } } = await supabase.auth.getUser();
    welcomeMessage.textContent = `مرحباً بك أيها المشرف، ${user.email}`;
    await loadAllData();
};

// --- تحميل البيانات ---
const loadAllData = async () => {
    await populatePlayersTable();
    await populateStoreTable();
    await loadStats();
};

// --- منطق اللاعبين ---
const populatePlayersTable = async () => {
    const players = await fetchAllPlayers();
    playersTableBody.innerHTML = '';
    if (players) {
        players.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.username || 'لا يوجد اسم'}</td>
                <td>${player.email}</td>
                <td>${player.xp}</td>
                <td>${player.diamonds}</td>
                <td>${new Date(player.created_at).toLocaleDateString()}</td>
                <td><button class="edit-btn" data-player-id="${player.id}">تعديل</button></td>
            `;
            playersTableBody.appendChild(row);
        });
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const playerId = e.target.dataset.playerId;
                const playerRow = e.target.closest('tr');
                const playerData = {
                    id: playerId,
                    username: playerRow.cells[0].textContent,
                    xp: playerRow.cells[2].textContent,
                    diamonds: playerRow.cells[3].textContent
                };
                openEditModal(playerData);
            });
        });
    }
};

// --- منطق نافذة التعديل (باستخدام style.display) ---
const openEditModal = (player) => {
    currentEditingPlayerId = player.id;
    document.getElementById('edit-username').value = player.username;
    document.getElementById('edit-xp').value = player.xp;
    document.getElementById('edit-diamonds').value = player.diamonds;
    editModal.style.display = 'flex'; // استخدام flex لإظهار النافذة وتوسيطها
};

const closeEditModal = () => {
    editModal.style.display = 'none'; // استخدام none لإخفاء النافذة
    currentEditingPlayerId = null;
};

// --- منطق المتجر ---
const populateStoreTable = async () => {
    const items = await fetchAllStoreItems();
    storeTableBody.innerHTML = '';
    if (items) {
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.price}</td>
                <td>${item.type}</td>
                <td><button class="delete-btn" data-item-id="${item.id}">حذف</button></td>
            `;
            storeTableBody.appendChild(row);
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const itemId = e.target.dataset.itemId;
                if (confirm('هل أنت متأكد من أنك تريد حذف هذا العنصر؟')) {
                    await deleteStoreItem(itemId);
                    await populateStoreTable();
                }
            });
        });
    }
};

// --- منطق الإحصائيات ---
const loadStats = async () => {
    const stats = await getDashboardStats();
    statsContainer.innerHTML = 'جاري تحميل الإحصائيات...';
    if (stats) {
        statsContainer.innerHTML = `
            <div class="stat-card"><h4>إجمالي اللاعبين</h4><p>${stats.total_players}</p></div>
            <div class="stat-card"><h4>إجمالي الاختبارات</h4><p>${stats.total_quizzes}</p></div>
            <div class="stat-card"><h4>متوسط النقاط</h4><p>${stats.average_score ? stats.average_score.toFixed(2) : 0}</p></div>
        `;
    } else {
        statsContainer.innerHTML = 'فشل تحميل الإحصائيات.';
    }
};

// --- معالجات الأحداث (Event Handlers) ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        const email = e.target.email.value;
        const password = e.target.password.value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            loginError.textContent = 'بيانات اعتماد تسجيل الدخول غير صالحة.';
            loginError.classList.remove('hidden');
        } else {
            const userRole = await getUserRole();
            if (userRole === 'admin') {
                await showDashboard();
            } else {
                loginError.textContent = 'ليس لديك صلاحيات المشرف.';
                loginError.classList.remove('hidden');
                await supabase.auth.signOut();
            }
        }
    });
}

if (addItemForm) {
    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newItem = {
            id: e.target.id.value, name: e.target.name.value, description: e.target.description.value,
            price: parseInt(e.target.price.value, 10), type: e.target.type.value,
            value: e.target.value.value, sortOrder: parseInt(e.target.sortOrder.value, 10)
        };
        await addStoreItem(newItem);
        addItemForm.reset();
        await populateStoreTable();
    });
}

if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentEditingPlayerId) return alert("خطأ: لا يوجد لاعب محدد للتعديل.");
        const updates = {
            username: document.getElementById('edit-username').value,
            xp: parseInt(document.getElementById('edit-xp').value, 10),
            diamonds: parseInt(document.getElementById('edit-diamonds').value, 10)
        };
        const { error } = await updatePlayerByAdmin(currentEditingPlayerId, updates);
        if (error) {
            alert(`فشل تحديث بيانات اللاعب: ${error.message}`);
        } else {
            alert("تم تحديث بيانات اللاعب بنجاح!");
            closeEditModal();
            await populatePlayersTable();
        }
    });
}

if (closeModalButton) {
    closeModalButton.addEventListener('click', closeEditModal);
}

// --- التحقق من الدور ---
const getUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('players').select('role').eq('id', user.id).single();
    return data ? data.role : null;
};

// --- التحقق من حالة تسجيل الدخول عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const userRole = await getUserRole();
        if (userRole === 'admin') {
            await showDashboard();
        } else {
            showLoginScreen();
            await supabase.auth.signOut();
        }
    } else {
        showLoginScreen();
    }
});
