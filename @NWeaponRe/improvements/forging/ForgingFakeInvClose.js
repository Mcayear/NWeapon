import * as blockitem from '../../util/blockitem.js';
import * as inventory from '../../util/inventory.js';
import * as Tool from '../../util/Tool.js';
import { File } from '@LLSELib';

// 锻造 - 虚拟物品栏关闭事件处理
export function ForgingFakeInvClose (event) {
    var player = event.getPlayer();
    var inv = event.getAction().getInventory();

    let drawing = inventory.getInventorySlot(inv, 0);
    let itemData, weapon;
    if (drawing.getId() === 0) {
        for (let item of inv.getContents().values()) {// 失败，返回所有材料
            blockitem.addItemToPlayer(player, item);
        }
        return player.sendMessage("[NWeapon] §7已取消锻造，未放入图纸");
    }
    /** 获取共享变量 */
    var _C = contain('NWeapon_C');
    /** 玩家的一些临时数据 */
    var PlayerSmithingTempData = contain('PlayerSmithingTempData');
    let PaperData = Tool.onlyNameGetItem('paper', drawing.getCustomName());
    if (!PaperData) {
        for (let item of inv.getContents().values()) {// 失败，返回所有材料
            blockitem.addItemToPlayer(player, item);
        }
        logger.warn("[NWeapon] §7无法获取图纸数据：" + drawing.getCustomName());
        return player.sendMessage("[NWeapon] §7无法获取图纸数据：" + drawing.getCustomName());
    }
    let needList = Tool.cloneObjectFn(PlayerSmithingTempData[player.name].方案[0]);
    if (_C.MainConfig.锻造模式 === 0) {// 需要旧装备时
        needList.push.apply(PlayerSmithingTempData[player.name].方案[1]);
        weapon = inventory.getInventorySlot(inv, 1);
        itemData = _C.WeaponConfig[weapon.getCustomName()] || _C.ArmorConfig[weapon.getCustomName()];
    } else {
        let tag = PlayerSmithingTempData[player.name].方案[1][0].split('@')[1].split(':');
        itemData = Tool.onlyNameGetItem(tag[0], tag[1]);
        weapon = Tool.getItem(null, itemData);
    }

    let FnReq = examineNeed(needList, inv, false);
    if (!FnReq[0]) {
        for (let item of inv.getContents().values()) {// 失败，没有足够的需求，返回所有材料
            blockitem.addItemToPlayer(player, item);
        }
        return player.sendMessage("[NWeapon] §7已取消锻造，缺少材料：" + FnReq[1]);
    }
    // 判断图纸是否需要返回
    if (PaperData.消耗) {
        FnReq[1].setItem(0, blockitem.buildItem(0, 0, 0));
    }
    // 锻造石处理
    let Strength = Number(((Math.random().toString().substr(2, 2) - 0 + 1) / 1.7).toFixed(2));// 强度
    for (let i = 0; i < FnReq[1].getSize(); i++) {
        let item = FnReq[1].getItem(i);
        if (!item.getId()) continue;
        if (item.getNamedTag() == null) continue;
        let NameTag = item.getNamedTag().getString('NWeaponNameTag');
        if (NameTag && NameTag.slice(0, NameTag.indexOf(";")) === ItemTypeList["锻造石"] && Strength < 100) {
            let num2 = 0;
            for (let num = 1; num <= item.getCount(); num++) {
                Strength += item.getNamedTag().getString('Strength') * 100;
                num2++;
                if (Strength >= 100) break;
                continue;
            }
            if (item.getCount() === num2) {
                FnReq[1].setItem(i, blockitem.buildItem(0, 0, 0));
            } else {
                let temp = item.clone();
                temp.setCount(item.getCount() - num2);
                FnReq[1].setItem(i, temp);
            }
            if (Strength >= 100) break;// 跳出循环
        }
    }
    if (Strength > 100) {
        Strength = 100;
    }

    for (let item of inv.getContents().values()) {// 将其它材料返回
        blockitem.addItemToPlayer(player, item);
    }

    let paperExp = PlayerSmithingTempData[player.name].获得经验;

    let index = Tool.getArrayProbabilisticResults(_C.MainConfig.锻造[1]), addxp = _C.MainConfig.锻造[1].length - index;
    if (paperExp) {
        addxp = 3+(paperExp * (Math.random() > 0.5 ? getRandomNum([1, 2]) : getRandomNum([0, 1])));
    }
    if (_C.MainConfig.ForingExp.onlySameLevel) {
        if (PaperData.限制等级 < _C.PlayerData[player.getName()].level) {
            player.sendMessage("[NWeapon] §7您正在锻造低等级图纸");
            addxp = _C.MainConfig.ForingExp.nonSameLevelGive;
        }
    }
    addxp = Number(addxp.toFixed(2));// 防止浮点数错误
    _C.PlayerData[player.getName()].exp = Math.round((_C.PlayerData[player.getName()].exp + addxp) * 10000) / 10000;
    _C.PlayerData[player.getName()].exp = Number(_C.PlayerData[player.getName()].exp.toFixed(2));// 防止浮点数错误
    _C.PlayerData[player.getName()].level = Math.floor(eval(_C.MainConfig.锻造等级.等级公式.replace(/{经验}/g, _C.PlayerData[player.getName()].exp)));
    if (isNaN(_C.PlayerData[player.getName()].level)) {
        _C.PlayerData[player.getName()].level = 0;
    }
    _C.PlayerData[player.getName()].req = eval(_C.MainConfig.锻造等级.经验公式.replace(/{等级}/g, _C.PlayerData[player.getName()].level + 1)) - _C.PlayerData[player.getName()].exp;
    _C.PlayerData[player.getName()].req = Number(_C.PlayerData[player.getName()].req.toFixed(2));// 防止浮点数错误
    File.writeTo("./plugins/NWeapon/PlayerData.json", JSON.stringify(_C.PlayerData, null, 2));
    player.sendMessage("[NWeapon] 恭喜您获得了 §l" + addxp + " §r点锻造经验");
    if (_C.MainConfig.锻造词条 && itemData.锻造词条) {// 开始
        WeaponToForgeEntry(player, weapon, index, Strength, PaperData, entryConfigToCraft(_C.ForgeEntry[itemData.锻造词条], itemData));
    } else {
        WeaponToForge(player, weapon, index, Strength, PaperData, itemData);
    }
}

/**
 * 获取arr1中不存在于arr2数组内的元素
 * @param arr1 {Array} 数组1
 * @param arr2 {Array} 数组2
 * @return {Array} 返回数组的差集
 * @example
 * minusArray(["a", "b", "c", "aaa"], ["a", "b", "c"]);
 * ["aaa"]
 */
 function minusArray(arr1, arr2) {
    //var temp = arr1.concat(arr3).filter(item => !arr3.includes(item));
    var temp = [], tempArr = JSON.parse(JSON.stringify(arr1));
    tempArr.push.apply(tempArr, arr2);
    tempArr.forEach(item => !(arr2.indexOf(item) > -1) ? temp.push(item) : null);// 在配置文件中不存在的属性
    return temp;
}
/**
 * 通过配置创建 为未拥有词条的装备创建词条属性
 * 返回主词条，次词条 [{name,value}, {...次词条}]
 * @param forgeEntryConfig {Object} forgeEntry文件中的指定方案
 * @param itemConfig {Object} itemConfig.锻造属性
 * @returns {Object} obj对象
 */
 function entryConfigToCraft(forgeEntryConfig, itemConfig) {
    var res = [{ name: null, value: null }, {}];
    // 次词条
    var arr1 = Tool.cloneObjectFn(forgeEntryConfig.ubEntry.list);
    var arr2 = Tool.cloneObjectFn(forgeEntryConfig.ubEntry.p);
    var arr3 = Object.keys(itemConfig.锻造属性);
    var temp = minusArray(arr1, arr3);
    temp.forEach((tempV) => {// 开始重新分配概率
        let index = arr1.indexOf(tempV);
        arr1.splice(index, 1);
        let p = arr2.splice(index, 1);
        let add = p / arr2.length;
        arr2.forEach(function (v, arr2i) {
            arr2[arr2i] = v + add;
        });
    });
    /** 获取共享变量 */
    var _C = contain('NWeapon_C');
    const defaultCount = _C.ForgeEntry.Config.ubEntry.defaultCount;// 次词条默认数量
    let pValue = Tool.getArrayProbabilisticResults(defaultCount.p);
    randChooes(defaultCount.list[pValue], arr1, arr2).forEach(v => {
        res[1][v] = itemConfig.锻造属性[v];
    });
    // 主词条
    let attrMainEntryConfig = itemConfig.锻造属性主词条 || itemConfig.锻造属性;
    var arr1 = Tool.cloneObjectFn(forgeEntryConfig.mainEntry.list);
    var arr2 = Tool.cloneObjectFn(forgeEntryConfig.mainEntry.p);
    var arr3 = Object.keys(attrMainEntryConfig);
    var temp = minusArray(arr1, arr3);
    temp.forEach((tempV) => {// 开始重新分配概率
        let index = arr1.indexOf(tempV);
        arr1.splice(index, 1);
        let p = arr2.splice(index, 1);
        let add = p / arr2.length;
        arr2.forEach(function (v, arr2i) {
            arr2[arr2i] = v + add;
        });
    });
    res[0].name = arr1[Tool.getArrayProbabilisticResults(arr2)];
    res[0].value = attrMainEntryConfig[res[0].name];
    return res;
}
/**
 * 
 * @param {number} value 
 * @returns {number}
 */
function getForgingAttr(value) {
    /** 获取共享变量 */
    var _C = contain('NWeapon_C');
    /*if (_C.MainConfig.AttrDisplayPercent.indexOf(i) > -1) {
        return value;
    }*/
    let arr = [_C.MainConfig.锻造[2][index]];
    if (typeof (arr[0]) === "string") {
        arr = arr[0].split("-");
    }
    return Math.round((value * 1000) * getRandomNum(arr)) / 1000;
}
/**
 * 锻造词条
 * 
 * @param {*} player 
 * @param {Item} item 
 * @param {number} index 
 * @param {number} Strength 
 * @param {*} PaperData 
 * @param {*} data 
 */
function WeaponToForgeEntry(player, item, index, Strength, PaperData, data) {
    /** 获取共享变量 */
    var _C = contain('NWeapon_C');
    const AttrLore = [];
    let ForgingAttrNbt = { mAttr: {}, attr: {}, info: {} };
    let mainAttr = data[0];
    if (typeof (mainAttr.value) === 'string') {
        let arr = mainAttr.value.split("-");
        ForgingAttrNbt.mAttr[mainAttr.name] = [getForgingAttr(arr[0]), getForgingAttr(arr[1])];
    } else {
        ForgingAttrNbt.mAttr[mainAttr.name] = [getForgingAttr(mainAttr.value)];
    }
    AttrLore.push("§r§a□ " + mainAttr.name + ":§d " + valueToString(ForgingAttrNbt.mAttr[mainAttr.name], mainAttr.name));
    let ubAttr = data[1];
    for (var i in ubAttr) {
        if (typeof (ubAttr[i]) === 'string') {
            let arr = ubAttr[i].split("-");
            ForgingAttrNbt.attr[i] = [getForgingAttr(arr[0]), getForgingAttr(arr[1])];
        } else {
            ForgingAttrNbt.attr[i] = [getForgingAttr(ubAttr[i])];
        }
        AttrLore.push("§r§a" + i + ":§d " + valueToString(ForgingAttrNbt.attr[i], i));
    }
    let 强度 = "||||||||||||||||||||".split("");
    强度.splice(Math.ceil(Strength / 5), 0, "§7");
    let oldLore = blockitem.getItemLore(item);
    let oldType = oldLore.substring(0, 14);
    if (oldType === "§r§f[§b武器§f]§r") {
        oldLore = oldLore.replace("§r§f[§b武器§f]§r", "§r§f[§b锻造武器§f]§r");
    } else if (oldType === "§r§f[§e护甲§f]§r") {
        oldLore = oldLore.replace("§r§f[§e护甲§f]§r", "§r§f[§e锻造护甲§f]§r");
    }
    let lore = [
        "§r§4§l一一一一一一一一一一",
        "§r§2锻造属性:",
        AttrLore.join(";"),
        "§r§4§l一一一一一一一一一一",
        "§r§a品质: " + _C.MainConfig.锻造[0][index],
        "§r§a强度: §b[§a" + 强度.join("") + "§b]",
        "§r§7锻造者§6[§a§l" + player.name + "§r§6]"
    ];
    blockitem.setItemLore(item, oldLore + lore.join(";"));
    ForgingAttrNbt.quality = index;
    ForgingAttrNbt.info.player = player.name;
    ForgingAttrNbt.info.intensity = Strength / 100;
    ForgingAttrNbt.info.playerlv = _C.PlayerData[player.name].level;
    item.getNamedTag().putString('forging', JSON.stringify(ForgingAttrNbt));
    item.getNamedTag().putByte('entry', 1);
    item.setNamedTag(item.getNamedTag());
    item = itemBindPlayer(item, player, false, true);
    if (PaperData.可符文) {
        item = Tool.toUnperformedRuneWeapon(item);
    }
    blockitem.addItemToPlayer(player, item);
    player.sendMessage("[NWeapon] 锻造成功");
}
/**
 * 普通装备升级为锻造装备
 * 
 * @param {*} player 
 * @param {Item} item 
 * @param {number} index 
 * @param {number} Strength 
 * @param {*} PaperData 
 * @param {*} data 
 */
function WeaponToForge(player, item, index, Strength, PaperData, data) {
    /** 获取共享变量 */
    var _C = contain('NWeapon_C');
    let AttrLore = [];
    let ForgingAttrNbt = { attr: {}, info: {} };
    let getForgingAttr = function (value) {
        let arr = [_C.MainConfig.锻造[2][index]];
        if (typeof (arr[0]) === "string") {
            arr = arr[0].split("-");
        }
        return Math.round((value * 1000) * getRandomNum(arr)) / 1000;
    }
    for (var i in data.锻造属性) {
        if (typeof (data.锻造属性[i]) === 'string') {
            let arr = data.锻造属性[i].split("-");
            ForgingAttrNbt.attr[i] = [getForgingAttr(arr[0]), getForgingAttr(arr[1])];
        } else {
            ForgingAttrNbt.attr[i] = [getForgingAttr(data.锻造属性[i])];
        }
        AttrLore.push("§r§a" + i + ":§d " + valueToString(ForgingAttrNbt.attr[i], i));
    }
    let 强度 = "||||||||||||||||||||".split("");
    强度.splice(Math.ceil(Strength / 5), 0, "§7");
    let oldLore = blockitem.getItemLore(item);
    let oldType = oldLore.substring(0, 14);
    if (oldType === "§r§f[§b武器§f]§r") {
        oldLore = oldLore.replace("§r§f[§b武器§f]§r", "§r§f[§b锻造武器§f]§r");
    } else if (oldType === "§r§f[§e护甲§f]§r") {
        oldLore = oldLore.replace("§r§f[§e护甲§f]§r", "§r§f[§e锻造护甲§f]§r");
    }
    let lore = [
        "§r§4§l一一一一一一一一一一",
        "§r§2锻造属性:",
        AttrLore.join(";"),
        "§r§4§l一一一一一一一一一一",
        "§r§a品质: " + _C.MainConfig.锻造[0][index],
        "§r§a强度: §b[§a" + 强度.join("") + "§b]",
        "§r§7锻造者§6[§a§l" + player.name + "§r§6]"
    ];
    blockitem.setItemLore(item, oldLore + lore.join(";"));
    ForgingAttrNbt.info.player = player.name;
    ForgingAttrNbt.info.intensity = Strength / 100;
    ForgingAttrNbt.info.playerlv = _C.PlayerData[player.name].level;
    item.setNamedTag(item.getNamedTag().putString('forging', JSON.stringify(ForgingAttrNbt)));
    item = itemBindPlayer(item, player, false, true);
    if (PaperData.可符文) {
        item = Tool.toUnperformedRuneWeapon(item);
    }
    blockitem.addItemToPlayer(player, item);
    player.sendMessage("[NWeapon] 锻造成功");
}