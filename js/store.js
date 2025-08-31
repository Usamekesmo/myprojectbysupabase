// =============================================================
// ==      وحدة منطق المتجر (مع Supabase) (النسخة النهائية)     ==
// =============================================================

import * as ui from './ui.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as achievements from './achievements.js';

/**
 * يعرض شاشة المتجر ويملأها بالبيانات الحالية.
 */
export function openStore() {
    const storeItems = progression.getStoreItems();
    ui.displayStore(storeItems, player.playerData, purchaseItem);
    ui.showScreen(ui.storeScreen);
}

/**
 * يعالج منطق شراء عنصر معين.
 * @param {string} itemId - معرف العنصر المطلوب شراؤه.
 */
async function purchaseItem(itemId) {
    const storeItems = progression.getStoreItems();
    const item = storeItems.find(i => i.id === itemId);

    if (!item) {
        alert("عفواً، هذا العنصر غير موجود.");
        return;
    }

    // --- التحقق من الشروط بناءً على نوع العنصر ---
    if (item.type === 'xp_exchange') {
        // حالة خاصة: استبدال نقاط الخبرة
        if (player.playerData.xp < item.price) {
            alert(`عفواً، لا تملك ما يكفي من نقاط الخبرة (${item.price} نقطة) لإتمام هذه العملية.`);
            return;
        }
    } else {
        // الحالات الأخرى: الشراء بالألماس
        if (player.playerData.diamonds < item.price) {
            alert("عفواً، لا تملك ما يكفي من الألماس لشراء هذا العنصر.");
            return;
        }
        if (player.playerData.inventory.includes(itemId)) {
            alert("أنت تمتلك هذا العنصر بالفعل!");
            return;
        }
    }

    // --- عملية الشراء ---
    ui.toggleLoader(true);

    // --- تنفيذ العملية بناءً على نوع العنصر ---
    if (item.type === 'xp_exchange') {
        player.playerData.xp -= item.price; // خصم نقاط الخبرة
        player.playerData.diamonds += parseInt(item.value, 10); // إضافة الألماس
        alert(`تهانينا! لقد استبدلت ${item.price} نقطة خبرة مقابل ${item.value} ألماسة.`);
    } else {
        // خصم السعر من ألماس اللاعب
        player.playerData.diamonds -= item.price;
        // إضافة العنصر إلى ممتلكات اللاعب
        player.playerData.inventory.push(itemId);
        alert(`تهانينا! لقد اشتريت "${item.name}".`);
    }

    // --- عمليات ما بعد الشراء ---

    // 1. التحقق من الإنجازات المتعلقة بالشراء
    achievements.checkAchievements('item_purchased', {
        itemId: item.id,
        itemType: item.type,
        price: item.price
    });

    // 2. حفظ بيانات اللاعب المحدثة في قاعدة البيانات
    await player.savePlayer();

    ui.toggleLoader(false);

    // 3. إعادة بناء واجهة المتجر وواجهة اللاعب لتعكس التغييرات
    openStore();
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerDisplay(player.playerData, levelInfo);
}
