import { Player } from "cn.nukkit.Player";
import { Item as JItem } from "cn.nukkit.item.Item";
import { CompoundTag } from "cn.nukkit.nbt.tag.CompoundTag";
import { ListTag } from "cn.nukkit.nbt.tag.ListTag";
import { Enchantment } from "cn.nukkit.item.enchantment.Enchantment";

/**
 * makeenchant
 * @param {JItem} item - 要添加附魔的物品。
 * @param {number} level - 附魔的等级。
 * @param {...Enchantment} enchantments - 要添加的附魔。
*/
function addEnchantment(item, level, ...enchantments) {
    let tag;
    if (!item.hasCompoundTag()) {
        tag = new CompoundTag();
    } else {
        tag = item.getNamedTag();
    }

    let ench;
    if (!tag.contains("ench")) {
        ench = new ListTag("ench");
        tag.putList(ench);
    } else {
        ench = tag.getList("ench", CompoundTag);
    }

    for (const enchantment of enchantments) {
        let found = false;

        for (let k = 0; k < ench.size(); k++) {
            const entry = ench.get(k);
            if (entry.getShort("id") === enchantment.getId()) {
                ench.add(k, new CompoundTag()
                    .putShort("id", enchantment.getId())
                    .putShort("lvl", level)
                );
                found = true;
                break;
            }
        }

        if (!found) {
            ench.add(new CompoundTag()
                .putShort("id", enchantment.getId())
                .putShort("lvl", level)
            );
        }
    }

    item.setNamedTag(tag);
}

/**
 * 给物品附魔
 * @param {JItem} item 物品对象
 * @param {number} id 附魔id
 * @param {number} level 附魔等级
*/
export function addItemEnchant(item, id, level) {
    var enchantment = Enchantment.getEnchantment(id);
    enchantment.setLevel(level);
    addEnchantment(item, level, enchantment);
}

/**
 * 设置物品的颜色
 * @param {JItem} item - 物品对象。
 * @param {number} r - 红色分量。
 * @param {number} g - 绿色分量。
 * @param {number} b - 蓝色分量。
 */
export function setItemColor(item, r, g, b) {
    const compoundTag = item.hasCompoundTag() ? item.getNamedTag() : new CompoundTag();
    compoundTag.putInt("customColor", r * 65536 + g * 256 + b);
    item.setCompoundTag(compoundTag);
}

/**
 * 将指定物品对象添加到创造模式物品栏中
 * @param {JItem} item - 物品对象
 */
export function addToCreativeBar(item) {
    if (!JItem.isCreativeItem(item)) {
        JItem.addCreativeItem(item);
    }
}

/**
 * 获取物品对象的 nbt 字符串。
 *
 * @param {JItem} item - 物品对象。
 * @returns {string} 物品的 nbt 字符串。
 */
export function getNBTString(item) {
    return Utils.bytesToHexString(item.getCompoundTag());
}

/**
 * 把 nbt 字符串包含的物品信息注入到物品对象上。
 *
 * @param {JItem} item - 物品对象。
 * @param {string} str - nbt 字符串。
 */
export function putinNBTString(item, str) {
    item.setCompoundTag(Utils.hexStringToBytes(str));
}
/**
 * 获取玩家手中物品。
 *
 * @param {Player} player - 要获取物品的玩家。
 * @returns {JItem} 玩家手中的物品。
 */
export function getItemInHand(player) {
    return player.getInventory().getItemInHand();
}
/**
 * 设置玩家手中物品
 * @param {Player} player 要设置物品的玩家
 * @param {JItem} item 要被设置到玩家手中的物品
 */
export function setItemInHand(player, item) {
    player.getInventory().setItemInHand(item);
}
/** 
 * 向玩家背包添加物品 
 * @param {Player} player 要添加物品的玩家
 * @param {JItem} item 要添加到玩家背包的物品
 */
export function addItemToPlayer(player, item) {
    if (player.getInventory().canAddItem(item)) {
        player.getInventory().addItem(item);
    } else {
        player.sendPopup("你有一些" + item.getName() + "装不下掉到了地上");
        player.getLevel().dropItem(player, item);
    }
}
/**
 * 获取方块ID
 * 
 * @param {number} id 物品数字id
 * @param {number} data 物品特殊值
 * @param {number} count 数量
 * @returns {JItem} nk的物品对象
 */
export function buildItem(id, data, count) {
    // 构建物品
    return JItem.get(id, data, count);
}

/**
 * 检测玩家背包中是否有指定物品。
 * 
 * @param {Player} player - 要检测物品的玩家。
 * @param {JItem} item - 要检测是否存在的物品。
 * @returns {boolean} - 玩家背包中是否有指定物品。
 */
export function hasItemInPlayer(player, item) {
    return player.getInventory().contains(item);
}

/**
 * 检测玩家背包中是否有指定数量的物品。
 * 
 * @param {Player} player - 要检测物品的玩家。
 * @param {number} x - 要检测的物品数量。
 * @param {...JItem} item - 要检测的物品。
 * @returns {boolean} - 玩家背包中是否有指定数量的物品。
 */
export function playerContainsItem(player, x, ...item) {
    let tmp = item;
    let have = true;
    if (x !== 1) {
        for (let each of tmp) {
            each.setCount(each.getCount() * x);
        }
    }
    for (let each of tmp) {
        if (!have) return false;
        if (!player.getInventory().contains(each)) {
            have = false;
        }
    }
    return true;
}

/**
 * 从玩家的背包中移除指定物品。
 * 
 * @param {Player} player - 要从其背包中移除物品的玩家。
 * @param {JItem} item - 要从玩家背包中移除的物品。
 */
export function removeItemFromPlayer(player, item) {
    if (playerContainsItem(player, 1, item)) {
        player.getInventory().removeItem(item);
    }
}
/**
 * 获取物品的Lore标签内容，多行用;分割
 * @param {JItem} item - 物品对象
 * @returns {string}  Lore标签内容
 */
export function getItemLore(item){
    var string = "";
    for(var a of item.getLore()){
        string+=a+";";
    }
    return string;
}
/**
 * 设置物品的lore标签内容，多行;分割
 * @param {JItem} item - 物品对象
 * @param {string} string - 要设置的lore内容
 */
export function setItemLore(item, string) {
    item.setLore(string.split(";"));
  }
  

/**
 * 将字节数组转换为十六进制字符串。
 *
 * @param {Uint8Array} src - 字节数组。
 * @returns {string} 十六进制字符串。
 */
function bytesToHexString(src) {
    const stringBuilder = [];
    if (!src || src.length <= 0) {
        return null;
    }
    for (const byte of src) {
        const v = byte & 0xff;
        const hv = v.toString(16);
        if (hv.length < 2) {
            stringBuilder.push(0);
        }
        stringBuilder.push(hv);
    }
    return stringBuilder.join('');
}

/**
 * 将十六进制字符串转换为字节数组。
 *
 * @param {string} hexString - 十六进制字符串。
 * @returns {Uint8Array} 字节数组。
 */
function hexStringToBytes(hexString) {
    if (hexString === null || hexString === "") {
        return null;
    }
    hexString = hexString.toUpperCase();
    const length = hexString.length / 2;
    /** @type {number[]} */
    const d = [];
    for (let i = 0; i < length; i++) {
        const pos = i * 2;
        d[i] = toByte((charToByte(hexString.charAt(pos)) << 4) | charToByte(hexString.charAt(pos + 1)));
    }
    return Java.to(d, "byte[]");
}

/**
 * 将字符转换为字节。
 *
 * @param {string} c - 字符。
 * @returns {number} 字节。
 */
function charToByte(c) {
    return "0123456789ABCDEF".indexOf(c);
}

function toByte(x) {
    return ((((x | 0) & 0xff) + 128) % 256) - 128;
}
var Utils = {
    bytesToHexString,
    hexStringToBytes
}