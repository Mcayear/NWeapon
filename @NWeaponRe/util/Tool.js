import { Item as JItem } from "cn.nukkit.item.Item";
import { Util as UtilClass } from 'cn.vusv.njsutil.Util';
import * as blockitem from "./blockitem.js";
import { File } from '@LLSELib';

const Util = new UtilClass();

/**
 * 将数字ID转为字符串id
 * @param {object} config 
 * @param {string} key
 * @returns {[boolean, object]}
*/
export function numberIdToStringId(config, key) {
    if (isNaN(config[key][0])) {
        return [false];
    }
    config[key][0] = JItem.get(config[key][0]).getNamespaceId();
    return [true, config];
}
/**
 * 通过id和damage获取物品
 * @param data {Array<id, damage>} id可为字符串可为数字id，damage仅可为数字
 * @param count {?number} 数量
 * @returns {JItem}
*/
export function getNukkitItem(data, count) {
    let item;
    if (typeof data[0] === 'string') {
        item = JItem.fromString(data[0]);
    } else {
        item = JItem.get(data[0]);
    }
    item.setDamage(data[1])
    item.setCount(count || 1);
    return item;
}

/**
* 获取装备武器物品
* @param name {?string} 装备物品名字
* @param data {object} 配置文件数据
* @returns {JItem} nukkit的物品对象
*/
export function getItem(name, data) {
    const _C = contain('NWeapon_C');
    let item = getNukkitItem(data.外形);
    name = name || data.名字;
    item.setCustomName(name);
    if (data.附魔) {
        for (var i = 0; i < data.附魔.length; i++) {
            let arr = data.附魔[i].split(":");
            blockitem.addItemEnchant(item, arr[0], arr[1]);
        }
    }
    let 属性 = [];
    if (data.属性) {
        for (var i in data.属性) {
            if (typeof (data.属性[i]) == 'string' && data.属性[i].indexOf("-") > -1) {
                属性.push("§r§7" + i + ": §b" + data.属性[i]);
                continue;
            }
            if (_C.MainConfig.AttrDisplayPercent.indexOf(i) > -1) {
                属性.push("§r§7" + i + ": §b" + Math.round(data.属性[i] * 100 * 10000) / 10000 + "%%");
            } else {
                属性.push("§r§7" + i + ": §b" + data.属性[i]);
            }
        }
    }
    if (data.不显示属性) {
        属性 = [data.不显示属性];
    }
    let rune = "", gemInlay = "", lore = "";
    if (data.镶嵌 && data.镶嵌.length > 0) {
        gemInlay += (data.稀有度 != undefined ? ';' : '') + "§r§4§l一一一一一一一一一一";
        for (var i = 0, len = data.镶嵌.length; i < len; i++) {
            gemInlay += ";§r§3[§7可镶嵌<" + data.镶嵌[i] + ">§3]";
        }
        item.getNamedTag().putString('GemList', JSON.stringify({ info: data.镶嵌, inlay: [] }));
    }
    switch (data.类型) {
        case "武器": {
            if (_C.MainConfig["稀有度品阶排序"]) {
                lore = [
                    data.锻造属性 && data.可副手 ? "§r§f[§b" + data.类型 + "§f]§r            §e副手武器" : "§r§f[§b" + (data.可副手 ? "副手" : "") + data.类型 + "§f]§r            " + (data.品阶 != undefined ? _C.MainConfig.品阶[data.品阶] : ''),
                    "§r§4§l一一一一一一一一一一",
                    属性.join(";"),
                    "§r§4§l一一一一一一一一一一",
                    "§r§8装备等级: §b" + data.限制等级 + (data.介绍 ? ";§r" + data.介绍 : ''),
                    "§r" + (data.稀有度 != undefined ? _C.MainConfig.稀有度[data.稀有度] : '') + gemInlay
                ];
            } else {// 默认
                lore = [
                    data.锻造属性 && data.可副手 ? "§r§f[§b" + data.类型 + "§f]§r            §e副手武器" : "§r§f[§b" + (data.可副手 ? "副手" : "") + data.类型 + "§f]§r            " + (data.稀有度 != undefined ? _C.MainConfig.稀有度[data.稀有度] : ''),
                    "§r§4§l一一一一一一一一一一",
                    属性.join(";"),
                    "§r§4§l一一一一一一一一一一",
                    "§r§8装备等级: §b" + data.限制等级 + (data.介绍 ? ";§r" + data.介绍 : ''),
                    "§r" + (data.品阶 != undefined ? _C.MainConfig.品阶[data.品阶] : '') + gemInlay
                ];
            }
            if (lore[lore.length - 1] === "§r") {
                lore.length = lore.length - 1;
            }
            lore = lore.join(";");
            break;
        }
        case "饰品":
        case "护甲": {
            if (_C.MainConfig["稀有度品阶排序"]) {
                lore = [
                    "§r§f[§e" + data.类型 + "§f]§r            " + (data.品阶 != undefined ? _C.MainConfig.品阶[data.品阶] : ''),
                    "§r§4§l一一一一一一一一一一",
                    属性.join(";"),
                    "§r§4§l一一一一一一一一一一",
                    "§r§8装备等级: §b" + data.限制等级 + (data.介绍 ? ";§r" + data.介绍 : ''),
                    "§r" + (data.稀有度 != undefined ? _C.MainConfig.稀有度[data.稀有度] : '') + gemInlay
                ];
            } else {// 默认
                lore = [
                    "§r§f[§e" + data.类型 + "§f]§r            " + (data.稀有度 != undefined ? _C.MainConfig.稀有度[data.稀有度] : ''),
                    "§r§4§l一一一一一一一一一一",
                    属性.join(";"),
                    "§r§4§l一一一一一一一一一一",
                    "§r§8装备等级: §b" + data.限制等级 + (data.介绍 ? ";§r" + data.介绍 : ''),
                    "§r" + (data.品阶 != undefined ? _C.MainConfig.品阶[data.品阶] : '') + gemInlay
                ];
            }
            if (lore[lore.length - 1] === "§r") {
                lore.length = lore.length - 1;
            }
            lore = lore.join(";");
            break;
        }
        case "宝石": {
            lore = [
                "§r§f[" + data.类型 + "]§r            " + data.类别,
                属性.join(";")
            ].join(";");
            break;
        }
        case "图纸": {
            lore = [
                "",
                "§r§5需要锻造师等级:§f " + data.限制等级,
                "§r" + data.介绍,
                "§r§5消耗:§f " + data.消耗
            ].join(";");
            break;
        }
        case "锻造石": {
            lore = "§r" + data.介绍;
            if (data.强度) item.getNamedTag().putString('Strength', data.强度);
            break;
        }
        case "精工石":
        case "宝石券":
        case "强化石": {
            lore = "§r" + data.介绍;
            if (data.直升) item.getNamedTag().putString('StraightUp', data.直升);
            if (data.幸运) item.getNamedTag().putString('Luck', data.幸运);
            if (data.堆叠使用) item.getNamedTag().putString('stacking', "1");
            if (data.失败保护) item.getNamedTag().putString('FailProtect', data.失败保护);
            break;
        }
        case "符文": {
            lore = [
                "§r§7「" + data.符文 + "§r§7」",
                "§r§7§l一一一一一一一一一一",
                "§r§7" + data.符文类型 + "        §9" + data.类别,
                "§r§7§l一一一一一一一一一一",
                "§r" + data.介绍,
                "§r§7§l一一一一一一一一一一"
            ].join(";");
            item.getNamedTag().putString('rune', data.符文);
            item.getNamedTag().putString('runeType', data.符文类型);
            item.getNamedTag().putString('type', data.类别);
            break;
        }
    }
    if (_C.MainConfig.bind && _C.MainConfig.bind.enable && ["武器", "护甲"].indexOf(data.类型) > -1) {
        lore += "\n§r§l§2灵魂绑定§r§2:§r §7未绑定§b§i§n§d§r";
        item.getNamedTag().putString('PlayerBind', JSON.stringify({ name: false, past: false }));
    }
    if (data.可副手) {
        item.getNamedTag().putByte("AllowOffhand", 1);
    }
    if (data.耐久 && data.耐久 > 1) {
        item.getNamedTag().putByte("Unbreakable", 1);
        item.getNamedTag().putInt("Unbreaking", data.耐久);
        lore += "\n§r§l§2耐久§2:§7 " + data.耐久 + "/" + data.耐久 + "§n§j§r";
    } else if (data.无限耐久) {
        item.getNamedTag().putByte("Unbreakable", 1);
    }
    if (data.染色) {
        blockitem.setItemColor(item, data.染色.r, data.染色.g, data.染色.b);
    }
    item.setLore(lore.split(";"));
    item.getNamedTag().putString('NWeaponNameTag', _C.ItemTypeList[data.类型] + ";" + name);
    item.setNamedTag(item.getNamedTag());
    if (data.可符文) {
        item = toUnperformedRuneWeapon(item);
    }
    return item;
}
/**
 * 通过类型和名字获取物品对象
 * @param type {string} 物品类型如：armor,weapon,gem
 * @param itemname {string} 物品名字，文件名或者配置文件中的“名字”项
 * @param count {?number} 数量，返回物品的数量
 * @param sender {?Player} 玩家，会对他发送回执信息
 * @returns {JItem} nukkit的物品对象
 */
export function onlyNameGetItem(type, itemname, count, sender) {
    const _C = contain('NWeapon_C');
    let obj, item = null;
    switch (type) {
        case "护甲":
        case "防具":
        case "armor": {
            obj = _C.ArmorConfig[itemname] || File.readFrom("./plugins/NWeapon/Armor/" + itemname + ".yml");
            break;
        }
        case "武器":
        case "weapon": {
            obj = _C.WeaponConfig[itemname] || File.readFrom("./plugins/NWeapon/Weapon/" + itemname + ".yml");
            break;
        }
        case "宝石":
        case "gem": {
            obj = _C.GemConfig[itemname] || File.readFrom("./plugins/NWeapon/Gem/" + itemname + ".yml");
            break;
        }
        case "符文":
        case "rune": {
            obj = _C.RuneConfig[itemname] || File.readFrom("./plugins/NWeapon/Rune/" + itemname + ".yml");
            break;
        }
        case "饰品":
        case "jewelry": {
            obj = _C.JewelryConfig[itemname] || File.readFrom("./plugins/NWeapon/Jewelry/" + itemname + ".yml");
            break;
        }
        case "锻造图":
        case "paper": {
            obj = _C.PaperConfig[itemname] || File.readFrom("./plugins/NWeapon/锻造图/" + itemname + ".yml");
            break;
        }
        case "宝石券":
        case "精工石":
        case "强化石":
        case "锻造石": {
            const file = File.readFrom("./plugins/NWeapon/OtherItem/" + itemname + ".yml");
            if (file != "FILE NOT FOUND") {
                obj = JSON.parse(Util.YAMLtoJSON(file));
                itemname = obj.名字;
            }
            break;
        }
        default: {
            if (sender) sender.sendMessage("[NWeapon] §cUnknowed Item Type:§7 " + type);
            return null;
        }
    }
    if (obj === undefined || obj === null) {
        if (sender) sender.sendMessage("[NWeapon] " + type + "物品 " + itemname + " §r不存在");
        return null;
    } else {
        if (typeof (obj) === "string") {
            obj = JSON.parse(Util.YAMLtoJSON(obj));
            itemname = obj.名字;
        }
        if (arguments.length === 2) {
            return obj;// 如果只有 type,itemname 参数返回配置文件对象
        }
        item = getItem(itemname, obj);
        if (typeof (item) === "undefined") {
            if (sender) sender.sendMessage("[NWeapon] " + type + "物品 " + itemname + " §r配置文件有误");
            return null;
        }
        if (!isNaN(count)) {
            if (count > 64) {
                count = 64;
            } else if (count < 1) {
                count = 1
            }
            item.setCount(count);
        }
    }
    return item;
}

/**
 * 将数据可视化，输入data,属性输出min-max或x%
 * @param {number[]} data 类似 `[1,2]`
 * @param {string} i 类似 `攻击力`
 * @returns {string} min-max 或 x%
 */
export function valueToString(data, i) {
    const _C = contain('NWeapon_C');
    let back = "";
    if (typeof (data) === "object") {
        if (data[0] == data[1]) {
            data = Number(data[0].toFixed(2));
        } else if (data.length === 1) {
            data = data[0];
        } else {
            return data[0] + " - " + data[1];
        }
    }
    if (_C.MainConfig.AttrDisplayPercent.indexOf(i) > -1) {
        data = (data * 100).toFixed(2) + [];
        if (data.substring(data.length - 3) === ".00") {
            data = (data - 0).toFixed(0);
        }
        back = data + "%%";
    } else {
        back = data;
    }
    if (data == 0) {
        back = 0;
    }
    return new String(back);
}


/**
 * 获取数组概率结果，传入总和为1的数组返回选中概率的下标(下标从0开始)
 * @param {number[]} array 数组
 * @param {number} [index=0] 下标（默认为0）
 * @returns {number} 被选中的下标
 * @example
 *   getArrayProbabilisticResults(['xx', 0.1, 0.2, 0.7], 1);
 */
export function getArrayProbabilisticResults(array, index) {
    if (index) {
        array = JSON.parse(JSON.stringify(array));
        array.splice(0, index);
    }
    if (array.length === 1) {
        return 0;
    }
    let length = 0, total = 0, random;
    array.forEach(function (v) {
        total += Number(v);
        let num = (v + []).length - 2;
        if (length < num) length = num;
    });
    if (total < 0.999 || total > 1.001) {
        console.warning("getArrayProbabilisticResults() has a error data: " + JSON.stringify(array));
        console.info(total)
        return -1;
    }
    total = 0;
    random = Math.random().toFixed(length).substring(2) - 0 + 1;
    for (i = 0; i < array.length; i++) {
        total += array[i] * Math.pow(10, length);
        if (total >= random) return i;
    }
}
/**
 * 对象复制，去除其关联性
 * @param obj {Object} 对象
 * @returns {Object}
 * @example
 *   cloneObjectFn({a:1});
 */
export function cloneObjectFn(obj) {
    return Object.assign({}, obj);
}


const ListTag = Java.type('cn.nukkit.nbt.tag.ListTag');
const StringTag = Java.type('cn.nukkit.nbt.tag.StringTag');
/**
 * 将物品转为 未打孔符文槽 的物品
 * @param {JItem} item 没有符文的物品（必须是NWeapon物品）
 * @returns {JItem}
 */
export function toUnperformedRuneWeapon(item) {
    if (item.getNamedTag().contains('runeBore')) {// 判断是否已经有 符文Tag
        return item;
    }
    let loreArray = blockitem.getItemLore(item).split("§r§4§l一一一一一一一一一一;");
    loreArray[3] = '§f§w§r§e⇨§9§l❁§r§e⇦§f§w§];' + loreArray[3];
    item.getNamedTag().putList(new ListTag('runeBore'));
    item.setNamedTag(item.getNamedTag());
    blockitem.setItemLore(item, loreArray.join("§r§4§l一一一一一一一一一一;"));
    return item;
}
/**
 * 将 未打孔物品 转为 有孔符文槽 的物品
 * 或设置物品符文槽数
 * @param {JItem} item 物品
 * @param {?Number} count 符文槽数量
 * @returns {JItem} 返回物品对象
 */
export function toPerformedRuneWeapon(item, count) {
    let runeBore = item.getNamedTag().getList('runeBore');
    let bore = '';// 孔
    var count = !count ? runeBore.size() : count;// 如果没有传入count
    if (runeBore.size() < count) {
        for (let i = 0, len = count - runeBore.size(); i < len; i++) {
            runeBore.add(new StringTag('', ''));
        }
        item.setNamedTag(item.getNamedTag());
    } else if (runeBore.size() > count) {// TODO: 如果count小于原本的符文槽数量

    }
    for (let i = 0, len = runeBore.size(); i < len; i++) {
        let str = runeBore.get(i).parseValue();// 存储的 符文名（文件名）
        if (str.length) {
            const rune = onlyNameGetItem('rune', str);
            if (rune) {
                str = rune.符文;// 通过文件名获取符文符号
                bore += '§r§7「' + str + '§r§7」';
                if (i != len) {
                    bore += ' ';
                }
                continue;// 下一个
            }
        }
        bore += '§r§7「§8✰§7」';
        if (i != len) {
            bore += ' ';
        }
    }
    let oldLore = blockitem.getItemLore(item);
    oldLore = oldLore.replace(/§f§w§r.+§f§w§]/, '§f§w§r§l' + bore + '§f§w§]');
    blockitem.setItemLore(item, oldLore);
    return item;
}
/**
 * 获取概率结果，传入数值返回布尔值
 * @param value {number} 介于 0,1 之间的浮点数 
 * @returns {Boolean}
 * @example
 *   getProbabilisticResults(0.0012);
 */
export function getProbabilisticResults(value) {
    if (isNaN(value)) {
        return false;
    } else {
        value = Number(value).toFixed(5);
    }
    let length = 0;
    value = value + [];
    if (value <= 0) {
        return false;
    } else if (value < 1) {
        length = value.length - 2;
        value = value * Math.pow(10, length);
    } else if (value >= 1) {
        return true;
    }
    if ((Math.random() + []).substring(3, length + 3) - 0 + 1 > value) return false;
    return true;
}