import * as inventory from '../util/inventory.js';
import * as blockitem from '../util/blockitem.js';
import { getNWeaponConfig } from '../util/Tool.js';
import { SetPlayerAttr, GetPlayerAttr } from './AttrComp.js';
import { Item as JItem } from '@LLSELib/object/Item.js';
/**
 * 获取指定玩家的属性
 * @param {cn.nukkit.Player} player 玩家对象
 * @returns {object} 一个包含属性键值对的对象
 */
export default function (player) {
    const _C = contain('NWeapon_C');
    let result = {};
    let ItemList = [blockitem.getItemInHand(player)];
    let inv = inventory.getPlayerInv(player);
    let SlotList = [player.getInventory().getHeldItemIndex(), 36, 37, 38, 39];
    /**
     * 合并属性的值
     * @param {*} obj 
     * @param {*} value 
     * @param {*} forging 
     * @returns 
     */
    let MergeAttrValue = function (obj, value, forging) {
        if (!forging) {
            forging = 1;
        }
        if (!obj) {
            obj = 0;
        }
        if (typeof (value) === "object") {
            if (typeof (obj) != "object") {
                obj = [obj, obj];
            }
            obj[0] += Math.ceil(value[0] * forging);
            obj[1] += Math.ceil(value[1] * forging);
        } else if (typeof (obj) === "object") {
            obj[0] += Math.ceil(value * forging);
            obj[1] += Math.ceil(value * forging);
        } else {
            obj += value * forging;
        }
        return obj;
    }
    var effectSuit = {};
    /**
     * 武器属性解析
     * @param {JItem} item 
     * @param {object} attrList 
     */
    let EquipAttrCore = function (item, attrList) {
        let suitName = attrList.套装;
        if (suitName) {
            if (effectSuit[suitName]) {
                effectSuit[suitName]++;
            } else {
                effectSuit[suitName] = 1;
            }
        }
        for (let key in attrList.属性) {
            let attr = attrList.属性[key];
            if (typeof (attr) === "string") {
                let arr = attr.split("-");
                attr = [new Number(arr[0]), new Number(arr[1])];
            }
            result[key] = MergeAttrValue(result[key], attr);
        }
        let forgingAttr = item.getNamedTag().getString('forging');
        if (forgingAttr != "") {// 锻造属性解析
            forgingAttr = JSON.parse(forgingAttr);
            for (key in forgingAttr.attr) {
                value = forgingAttr.attr[key];
                if (forgingAttr.attr[key].length === 1) {
                    value = value[0];
                }
                result[key] = MergeAttrValue(result[key], value, forgingAttr.info.intensity);
            }
        }
        let gemList = item.getNamedTag().getString('GemList');
        if (gemList != "") {// 宝石属性解析
            gemList = JSON.parse(gemList);
            for (var i = 0; i < gemList.inlay.length; i++) {
                let GemData = _C.GemConfig[gemList.inlay[i]];
                if (!GemData) {
                    continue;
                }
                for (let key in GemData.属性) {
                    let attr = GemData.属性[key];
                    if (typeof (attr) === "string") {
                        let arr = attr.split("-");
                        attr = [new Number(arr[0]), new Number(arr[1])];
                    }
                    result[key] = MergeAttrValue(result[key], attr);
                }
            }
        }
        let seiko = item.getNamedTag().getString('Seiko');
        if (seiko != "") {// 精工属性解析
            seiko = JSON.parse(seiko);
            let type = attrList.类型 == "武器" ? 0 : 1;
            let attrdata = _C.MainConfig.Seiko.attr[type][seiko.level - 1];
            for (let key in attrdata) {
                let attr = attrdata[key];
                if (typeof (attr) === "string") {
                    let arr = attr.split("-");
                    attr = [new Number(arr[0]), new Number(arr[1])];
                }
                result[key] = MergeAttrValue(result[key], attr);
            }
        }
        let strengthen = item.getNamedTag().getString('Strengthen');
        if (strengthen != "") {// 强化属性解析
            strengthen = JSON.parse(strengthen);
            let type = attrList.类型 == "武器" ? 0 : 1;
            let attrdata = _C.MainConfig.Strengthen.attr[type][strengthen.level - 1];
            for (let key in attrdata) {
                let attr = attrdata[key];
                if (typeof (attr) === "string") {
                    let arr = attr.split("-");
                    attr = [new Number(arr[0]), new Number(arr[1])];
                }
                result[key] = MergeAttrValue(result[key], attr);
            }
        }
    }
    let unavailableTips = [];
    let isChange = false;
    /**
     * 用来处理物品中 NWeapon 数据的核心
     * @param {JItem} item 
     * @param {*} type 
     * @param {*} slot 
     * @param {*} Callback 
     * @returns 
     */
    const funcCore = function (item, type, slot, Callback) {
        if (item === false || item.getId() === 0) {
            return;
        }
        const name = item.getCustomName();
        let attr = getNWeaponConfig(type + ";" + name);
        if (!attr) {
            return;
        }
        if (attr.限制等级 > player.getExperienceLevel()) {
            unavailableTips.push(name + "§r§f, 使用等级不足");
            return;
        }
        if (attr.定制者 && attr.定制者 != player.name && !player.isOp()) {
            unavailableTips.push("你不是" + name + "§r的定制者");
            return;
        }
        if (attr.生效槽 && attr.生效槽.indexOf(slot) === -1) {
            return;
        }
        if (_C.MainConfig.bind) {
            if (_C.MainConfig.bind.defaultBind) {
                let itemAfter = itemBindPlayer(item, player, true, false);
                if (itemAfter) {
                    Callback(itemAfter);
                }
            }
            let bindObj = item.getNamedTag().getString('playerBind');
            if (bindObj) {
                bindObj = JSON.parse(bindObj);
                if (bindObj.name != player.name) {
                    unavailableTips.push(name + "§r§f, 您不是该装备的主人");
                    return;
                }
            }
        }
        if (_C.MainConfig.允许附魔 || item.getEnchantments().length == 0) {
            EquipAttrCore(item, attr);
        }
    }
    // 主手武器
    funcCore(inventory.getEntityItemInHand(player), "Weapon", player.getInventory().getHeldItemIndex(), function (itemAfter) {
        inventory.setEntityItemInHand(player, itemAfter);
    });
    // 副手武器
    funcCore(inventory.getEntityItemInOffHand(player), "Weapon", null, function (itemAfter) {
        inventory.setEntityItemInOffHand(player, itemAfter);
    });
    // 护甲槽 36,37,38,39
    for (let i = 36; i < 40; i++) {
        funcCore(inventory.getInventorySlot(inv, i), "Armor", i, function (itemAfter) {
            inv.setItem(i, itemAfter);
            isChange = true;
        });
    }
    // 配饰槽 9 - 35
    for (let i = 9; i < 36; i++) {
        funcCore(inventory.getInventorySlot(inv, i), "Jewelry", i, function (itemAfter) {
            inv.setItem(i, itemAfter);
            isChange = true;
        });
    }
    if (isChange) {
        inventory.setPlayerInv(player, inv);
    }
    if (unavailableTips.length) {
        player.sendPopup("§c§l您佩戴了无法使用的装备§r：\n" + unavailableTips.join("\n"));
    }
    // 套装属性
    var eventChangeSuit = [];
    //var playerAttr = database.memoryStorage.getItem("PlayerAttr");
    var MainAttrForSuit = GetPlayerAttr(player, 1).EffectSuit, hasMainAttrForSuit = [];
    if (!MainAttrForSuit) return result;

    var newList = [];
    for (suitName in effectSuit) {
        const suitTag = suitName + ":" + effectSuit[suitName];
        newList.push(suitTag);
        // mainAttr中不存在,添加属性
        if (MainAttrForSuit.indexOf(suitTag) === -1 && _C.MainConfig.EffectSuit[suitTag]) {
            hasMainAttrForSuit.push(suitTag);
            SetPlayerAttr(player, suitTag, _C.MainConfig.EffectSuit[suitTag].attr);
            eventChangeSuit.push("§r§f你感受到了 §l" + suitTag + " §r§f的§d套装§f属性！");
        }
    }
    MainAttrForSuit.forEach(v => {
        // 删除属性
        if (newList.indexOf(v) === -1) {
            SetPlayerAttr(player, v, {});
            eventChangeSuit.push("§r§f§l" + v + " §r§f套装§f属性已经流失...");
        }
    });
    MainAttrForSuit = hasMainAttrForSuit;
    //database.memoryStorage.setItem("playerAttr", playerAttr);
    if (eventChangeSuit.length) {
        SetPlayerAttr(player, "EffectSuit", MainAttrForSuit);
        player.sendPopup(eventChangeSuit.join("\n"));
    }
    return result;
}