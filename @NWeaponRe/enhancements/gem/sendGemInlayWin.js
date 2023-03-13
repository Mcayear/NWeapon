import { Player as JPlayer } from 'cn.nukkit.Player';
import { Item as JItem } from 'cn.nukkit.item.Item';
import * as blockitem from '../../util/blockitem.js';
import * as inventory from '../../util/inventory.js';
import * as Tool from '../../util/Tool.js';
import { mc } from '@LLSELib';

/**
 * 
 * @param {JPlayer} player 
 * @returns 
 */
export function sendGemInlayWin(player) {
    /** 获取共享变量 */
    var _C = contain('NWeapon_C');
    let HandItem = blockitem.getItemInHand(player);
    let HandItemName = HandItem.getCustomName();
    let HandItemData = _C.WeaponConfig[HandItemName] || _C.ArmorConfig[HandItemName];
    let usableList = [[], []];
    if (!HandItemData) {
        return player.sendMessage("[NWeapon] §c请手持NWeapon装备,宝石将镶嵌至手中装备");
    }
    if (HandItemData.镶嵌.length === 0) {
        return player.sendMessage("[NWeapon] 装备 " + HandItemName + " §r没有镶嵌槽数据");
    }
    let nbtObj = HandItem.getNamedTag().getString('GemList');
    if (nbtObj === '') {
        nbtObj = { info: HandItemData.镶嵌, inlay: [] };
        HandItem.getNamedTag().putString('GemList', JSON.stringify(nbtObj));
        HandItem.setNamedTag(HandItem.getNamedTag());
        blockitem.getItemInHand(player, HandItem);
    } else {
        nbtObj = JSON.parse(nbtObj);
    }
    for (let i = 0; i < nbtObj.info.length; i++) {// 获取未镶嵌的宝石槽类型
        if (nbtObj.inlay[i] == null || nbtObj.inlay[i] == "") {// 判断 null & ""
            usableList[0].push(nbtObj.info[i]);
            usableList[1].push(i);
        }
    }
    let invItem = inventory.getItemsInInv(inventory.getPlayerInv(player));
    let winx = mc.newCustomForm("宝石镶嵌");
    let usableGemList = [];
    let haveGemList = [];
    for (let i = 0; i < invItem.length; i++) {
        let data = _C.GemConfig[invItem[i].getCustomName()];
        if (data && usableList[0].indexOf(data.类别.replace(/§./g, "")) > -1) {
            let bind = invItem[i].getNamedTag().getString('PlayerBind');
            if (bind && JSON.parse(bind).name != player.name) {
                continue;
            }// 检查物品绑定
            usableGemList.push(invItem[i].getCustomName());
            invItem[i].setCount(1);
            haveGemList.push(invItem[i]);
        }
    }
    winx.addLabel("宝石不可拆卸，默认成功率30%");
    winx.addDropdown("选择宝石", ["请选择", ...usableGemList]);
    winx.setCallback((player_, data) => {
        let player = player_._PNXPlayer;
        let sel = usableGemList[data[1]];
        if (sel === "请选择") {
            return player.sendMessage("[NWeapon] §7未选择宝石，已取消镶嵌");
        }
        /**
         * @type {JItem[]}
         */
        let gem = haveGemList[usableGemList.indexOf(sel)];
        if (!blockitem.addItemToPlayer(player, gem)) {
            return player.sendMessage("[NWeapon] §c背包未携带该宝石");
        }
        if (HandItemData.不可镶嵌属性) {
            const GemData = _C.GemConfig[gem.getCustomName()];
            if (!GemData) {
                return player.sendMessage("[NWeapon] §c未能成功获取 §r" + gem.getCustomName() + " §r§c的宝石信息");
            }
            for (let key in GemData.属性) {
                if (HandItemData.不可镶嵌属性.indexOf(key) > -1) {
                    return player.sendMessage("[NWeapon] §c该装备不允许镶嵌 §r" + gem.getCustomName() + " §r§c宝石，因为含有§6 " + key + " §c属性！");
                }
            }
        }
        if (!blockitem.isSame(HandItem, blockitem.getItemInHand(player), true, true)) {
            return player.sendMessage("[NWeapon] §c手持物品发生变更");
        }
        let probability = Number(_C.MainConfig.默认镶嵌概率);

        let failProtect = 0;
        let luck = false;
        let bagitems = inventory.getPlayerInv(player);
        for (var i = 0; i < 9; i++) {
            let item = inventory.getInventorySlot(bagitems, i);
            if (item.getCustomName() && item.getNamedTag().getString('NWeaponNameTag')) {
                let arr = item.getNamedTag().getString('NWeaponNameTag').split(";");
                if (arr[0] === _C.ItemTypeList["宝石券"]) {
                    let count = 1;
                    let luck_ = item.getNamedTag().getString('Luck') || 0;
                    let failProtect_ = item.getNamedTag().getString('FailProtect') || 0;
                    if (luck && luck_) {
                        continue;
                    } else if (luck_ > 0) {
                        if (item.getNamedTag().getString('stacking')) {
                            count = Math.ceil(1 / luck_);
                            if (item.getCount() < count) {
                                count = item.getCount();
                            }
                        }
                        probability += Number(luck_) * count;
                        luck = true;
                    }
                    if (failProtect && failProtect_) {
                        continue;
                    } else if (failProtect_) {
                        failProtect = Number(failProtect_);
                    }
                    item.setCount(count);
                    blockitem.removeItemFromPlayer(player, item);
                    player.sendMessage("[NWeapon] §7你消耗了 " + item.getCustomName() + "§r§7 *" + count);
                }
            }
        }
        if (Tool.getProbabilisticResults(probability)) {
            blockitem.setItemLore(HandItem, blockitem.setItemLore(HandItem).replace("§r§3[§7可镶嵌<" + _C.GemConfig[sel].类别.replace(/§./g, "") + ">§3]", sel));
            let nbtObj = JSON.parse(HandItem.getNamedTag().getString('GemList'));
            nbtObj.inlay[usableList[1][usableList[0].indexOf(_C.GemConfig[sel].类别.replace(/§./g, ""))]] = sel;
            HandItem.getNamedTag().putString('GemList', JSON.stringify(nbtObj));
            HandItem.setNamedTag(HandItem.getNamedTag());
            blockitem.getItemInHand(player, HandItem);
            blockitem.removeItemFromPlayer(player, gem);
            player.sendMessage("[NWeapon] §a镶嵌成功");
        } else {
            player.sendMessage("[NWeapon] §c镶嵌失败");
            if (Tool.getProbabilisticResults(failProtect)) {
                player.sendTitle("§2宝石受到保护", "");
            } else {
                blockitem.removeItemFromPlayer(player, gem);
            }
        }
    });
    mc.getPlayer(sender.getName()).sendForm(winx);
}