// =============================================================
// ==      وحدة منطق المتجر (Store) - نسخة نهائية كاملة         ==
// =============================================================

import * as ui from './ui.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as achievements from './achievements.js';
import { updateAvailablePages } from './main.js';

let storeItemsCache = [];

/**
 * تعرض عناصر المتجر في التبويبات المخصصة لها.
 */
export function renderStoreItems(items, playerData) {
    storeItemsCache = items;
    document.querySelectorAll('.items-container').forEach(container => container.innerHTML = '');

    items.forEach(item => {
        const container = document.getElementById(`${item.type}-store-items`);
        if (!container) return;

        const isOwned = checkIfOwned(item, playerData.inventory);
        let priceText = `${item.price} 💎`;
        let canAfford = playerData.diamonds >= item.price;
        let buttonText = 'شراء';

        if (item.type === 'exchange') {
            priceText = `التكلفة: ${item.price} XP`;
            canAfford = playerData.xp >= item.price;
            buttonText = 'استبدال';
        }

        if (isOwned) buttonText = 'تم الشراء';

        const itemDiv = document.createElement('div');
        itemDiv.className = `store-item ${isOwned ? 'owned-item' : ''}`;
        itemDiv.innerHTML = `
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p class="item-price">${priceText}</p>
            <button class="buy-button" data-item-id="${item.id}" ${isOwned || !canAfford ? 'disabled' : ''}>
                ${buttonText}
            </button>
        `;

        if (!isOwned) {
            itemDiv.querySelector('.buy-button').addEventListener('click', (e) => {
                purchaseItem(e.target.dataset.itemId);
            });
        }
        container.appendChild(itemDiv);
    });
}

/**
 * يتحقق مما إذا كان اللاعب يمتلك عنصرًا (خاصة للحزم).
 */
function checkIfOwned(item, inventory) {
    if (item.type === 'pages' || item.type === 'qari' || item.type === 'themes') {
        return inventory.includes(item.id);
    }
    if (item.type === 'ranges' || item.type === 'juz') {
        const [start, end] = item.value.split('-').map(Number);
        for (let i = start; i <= end; i++) {
            if (!inventory.includes(`page_${i}`)) return false;
        }
        return true; // يمتلك كل الصفحات في الحزمة
    }
    return false; // عناصر الاستبدال والتحديات لا تُمتلك
}

/**
 * يعالج منطق شراء عنصر معين.
 */
async function purchaseItem(itemId) {
    const item = storeItemsCache.find(i => i.id === itemId);
    if (!item) return;

    if (item.type === 'exchange') {
        if (player.playerData.xp < item.price) {
            alert("نقاط خبرتك غير كافية.");
            return;
        }
        player.playerData.xp -= item.price;
        player.playerData.diamonds += parseInt(item.value, 10);
    } else {
        if (player.playerData.diamonds < item.price) {
            alert("ألماسك غير كافٍ.");
            return;
        }
        player.playerData.diamonds -= item.price;

        if (item.type === 'ranges' || item.type === 'juz') {
            const [start, end] = item.value.split('-').map(Number);
            for (let i = start; i <= end; i++) {
                const pageId = `page_${i}`;
                if (!player.playerData.inventory.includes(pageId)) {
                    player.playerData.inventory.push(pageId);
                }
            }
        } else {
            player.playerData.inventory.push(item.id);
        }
    }

    alert(`تهانينا! تمت عملية "${item.name}" بنجاح.`);
    
    achievements.checkAchievements('item_purchased', { itemId: item.id, itemType: item.type });
    await player.savePlayer();

    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerHeader(player.playerData, levelInfo);
    renderStoreItems(storeItemsCache, player.playerData);
    updateAvailablePages();
    if (item.type === 'qari') {
        ui.populateQariSelect(ui.qariSelect, player.playerData.inventory);
    }
}
