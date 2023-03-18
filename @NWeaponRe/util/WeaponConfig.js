import { File, logger } from '@LLSELib';
import { File as jFile } from 'java.io.File';
import { Util as UtilClass } from 'cn.vusv.njsutil.Util';
import * as Tool from './Tool.js';
import * as blockitem from './blockitem.js';

const Util = new UtilClass();

export var version = "2022-09-23";
//★ ☆ ≛ ⋆ ⍟ ⍣ ★ ☆ ✡ ✦ ✧ ✪ ✫ ✬ ✨ ✯ ✰ ✴ ✵ ✶ ✷ ✸ ✹ ❂ ⭐ ⭑ ⭒ 🌟 🌠 🔯
//▲ ✶ ✹
//✶ ✸ ✹ ❂
//3 6 9 12
File.createDir("./plugins/NWeapon/")
export function isExistDir(path) {
    const dir = new jFile(path);
    if (!dir.exists()) {
        dir.mkdir();
        if (File.exists("./plugins/NWeapon/帮助help.txt")) {
            File.writeTo("./plugins/NWeapon/帮助help.txt", "默认配置文件会过大增加插件体积。\n\r您可以加Q群 1022801913 并前往 https://gitee.com/ayear/nweapon/tree/master/NWeapon 查看。\n\r或者前往此链接下载 https://gitee.com/ayear/nweapon/repository/archive/master.zip");
        }
    }
}
isExistDir('./plugins/NWeapon/Armor');
isExistDir('./plugins/NWeapon/Weapon');
isExistDir('./plugins/NWeapon/Gem');
isExistDir('./plugins/NWeapon/Rune');
isExistDir('./plugins/NWeapon/Jewelry');
isExistDir('./plugins/NWeapon/锻造图');
isExistDir('./plugins/NWeapon/OtherItem');
isExistDir('./plugins/NWeapon/PlayerAttrData');

if (!File.readFrom('./plugins/NWeapon/Config.yml')) {
    File.copy("./plugins/@NWeaponRe/resource/Config.yml", "./plugins/NWeapon/Config.yml");
}
File.writeTo("./plugins/NWeapon/PlayerData.json", "{}");// 创建玩家数据存储文件
//manager.bStats("NWeapon", version, "Mcayear", 8611);// 插件状态接口 - bStats
export const __EntityRegainHealthEvent = Java.type("cn.nukkit.event.entity.EntityRegainHealthEvent");

// 载入前置插件 - Start

// NWeapon_MagicItem
// NWeapon_LittleNpc
// NWeapon_RSHealthAPI

// End
var MainConfig = JSON.parse(Util.YAMLtoJSON(File.readFrom("./plugins/NWeapon/Config.yml")));

var ItemTypeList = {
    "武器": "Weapon",
    "护甲": "Armor",
    "饰品": "Jewelry",
    "宝石": "Gem",
    "图纸": "Paper",
    "符文": "Rune",
    "锻造石": "FStone",// Forging Stone
    "精工石": "SeikoStone",// Seiko Stone
    "宝石券": "GemTicket",// Gem Inlay Ticket
    "强化石": "Strengthen"// Strengthen Stone
};
// 配置文件校验
if (MainConfig.version != version) {
    MainConfig.version.AttrDisplayPercent = ["暴击倍率", "吸血倍率", "护甲强度", "反伤倍率", "经验加成", "暴击率", "吸血率", "破防率", "反伤率", "闪避率", "暴击抵抗", "吸血抵抗", "命中率", "伤害加成", "攻击加成", "防御加成", "生命加成"];
    if (!MainConfig.Seiko) {
        MainConfig.Seiko = {// 装备精工
            enable: true,
            needMoney: [1e5, 1e5, 1e5, 1e6, 1e6, 1e6, 1e7, 1e7, 1e7, 1e8, 1e8, 1e8],
            chance: [1, .7, .7, .7, .5, .5, .5, .3, .3, .3, .1, .1, .1],// 成功概率
            failed: [[3, .5, .15, .5, .3], [12, .5, .15, .5, .3]],// 失败掉等级及概率 [如果<设置的精工等级, 掉1级概率, 掉2级概率, ...]
            broadcastMessage: [6, "§6§l[精工系统] §r§a%p §f欧皇附体！成功打造出§e %lv §f级 %weapon §r！！"],
            attr: [// 0武器, 1护甲
                [{
                    攻击力: 300
                }, {
                    攻击力: 600
                }, {
                    攻击力: 900
                }], [{
                    防御力: 300
                }, {
                    防御力: 600
                }, {
                    防御力: 900
                }]
            ]
        }
    }
    if (MainConfig.Seiko.failedAddition === undefined) {
        MainConfig.Seiko.failedAddition = 0;
    }
    if (!MainConfig.GradeSymbol) {
        MainConfig.GradeSymbol = {// 等级图标
            enable: true,
            list: [
                [9, 6, 3, 1],
                ["❂", "✹", "✸", "✶"]
            ]
        };
    }
    if (!MainConfig.bind) {
        MainConfig.bind = {
            enable: false,
            defaultBind: false
        };
    }
    if (!MainConfig.unbind) {
        MainConfig.unbind = {// 装备解绑
            enable: true,
            onlyOp: false,
            failExec: [],
            succExec: ["uie exec 解除灵魂绑定 \"%p\" true"]
        };
    }
    if (!MainConfig.Rune) {// 符文
        MainConfig.Rune = { enable: false };
    }
    if (!MainConfig.Strengthen) {
        MainConfig.Strengthen = {// 装备强化(淬炼)
            enable: true,
            failedAddition: 0.005,
            need: ["nbt@淬炼石:1||money@1e5", "nbt@淬炼石:2||money@2e5", "nbt@淬炼石:4||money@4e5"],
            chance: [.85, .8, .75],// 成功概率
            failed: [[5, 0], [16, .5, .5]],// 失败掉等级及概率 [如果<设置的强化等级, 破坏装备概率, 掉1级概率, 掉2级概率, ...]
            style: {
                icon: "●",
                firstList: [
                    "§f§l", "§f§l", "§a§l", "§a§l", "§b§l", "§b§l", "§9§l", "§9§l", "§5§l", "§5§l", "§6§l", "§6§l", "§d§l", "§d§l", "§1§l"
                ]
            },
            broadcastMessage: [6, "§c§l[淬炼系统] §r§a%p §f欧皇附体！成功打造出§e %lv §f级 %weapon §r！！"],
            attr: [// 0武器, 1护甲
                [{
                    攻击加成: .01,
                    暴击率: .01
                }, {
                    攻击加成: .04,
                    暴击率: .02
                }, {
                    攻击加成: .09,
                    暴击率: .03
                }], [{
                    生命加成: .01,
                    防御加成: .01
                }, {
                    生命加成: .04,
                    防御加成: .04
                }, {
                    生命加成: .09,
                    防御加成: .09
                }]
            ]
        }
    }
    if (!MainConfig.Strengthen.style) {
        MainConfig.Strengthen.style = {
            icon: "●",
            firstList: [
                "§f§l", "§f§l", "§a§l", "§a§l", "§b§l", "§b§l", "§9§l", "§9§l", "§5§l", "§5§l", "§6§l", "§6§l", "§d§l", "§d§l", "§1§l"
            ]
        };
    }
    if (!MainConfig.NeedFailedTips) {
        MainConfig.NeedFailedTips = "§c=== 需求未满足 ===\n缺少：§7%1";
    }
    if (!MainConfig["worlds-disabled"]) {
        MainConfig["worlds-disabled"] = "world1, world2";
    }
    if (!MainConfig["EffectSuit"]) {
        MainConfig["EffectSuit"] = {
            "新手套装:2": {
                "attr": { "血量值": 50 }
            }
        };
    }
    if (!MainConfig["稀有度品阶排序"]) {// 武器和护甲的 lore 显示
        MainConfig["稀有度品阶排序"] = false;// false 稀有度在上 品阶在下，true 相反
    }
    File.writeTo("./plugins/NWeapon/Config.yml", Util.JSONtoYAML(JSON.stringify(Config)));
    if (new Date(MainConfig.version).getTime() < new Date("2020-01-31").getTime()) {
        logger.warning("配置文件过低，无法完成自动更新 §c请手动更新配置文件§r");
    }
}

// 集中的延时任务调度
export var TaskExecList = {};
function __NWeaponExecTaskList() {
    const nowtimestamp = new Date().getTime();
    for (let i in TaskExecList) {
        if (nowtimestamp > i) {
            let obj = TaskExecList[i];
            try {
                obj["func"].apply(this, obj["args"]);
                delete TaskExecList[i];
            } catch (err) {
                logger.info("§4NWeapon 的延时任务出现了错误, tag: " + (obj && obj["tag"]) + "，timestamp: " + i);
                logger.info(err.stack);
                delete TaskExecList[i];
            }
        }
    }
}
setInterval(() => {
    __NWeaponExecTaskList();
}, 500);

var PlayerData = {}, GemConfig = {}, RuneConfig = {}, WeaponConfig = {}, ArmorConfig = {}, JewelryConfig = {}, PaperConfig = {},
    NbtItem = JSON.parse(Util.YAMLtoJSON(File.readFrom("./plugins/ItemNbt/NbtItem.yml") || '{}')),
    ForgeEntry;
getItData();
getGemConfig();
getRuneConfig();
getWeaponConfig();
getArmorConfig();
getJewelryConfig();
getPaperConfig();

// 读取玩家&NBT物品数据
export function getItData() {
    PlayerData = JSON.parse(File.readFrom("./plugins/NWeapon/PlayerData.json"));
    NbtItem = JSON.parse(Util.YAMLtoJSON(File.readFrom("./plugins/ItemNbt/NbtItem.yml") || '{}'));
    ForgeEntry = JSON.parse(Util.YAMLtoJSON(File.readFrom("./plugins/NWeapon/ForgeEntry.yml") || '{}'));
}
// 读取宝石配置文件
export function getGemConfig() {
    let trdirl = File.getFilesList('./plugins/NWeapon/Gem');
    for (var i = 0; i < trdirl.length; i++) {
        let path = './plugins/NWeapon/Gem/'+trdirl[i];
        let temp = JSON.parse(Util.YAMLtoJSON(File.readFrom(path)));
        // tran
        let res = Tool.numberIdToStringId(temp, "外形");
        if (res[0]) {
            File.writeTo(path, Util.JSONtoYAML(JSON.stringify(res[1])));
        }
        // tran - end
        for (let k in temp.属性) if (temp.属性[k] === 0) delete temp.属性[k];
        GemConfig[temp.名字] = temp;
        if (temp.添加到创造背包) blockitem.addToCreativeBar(Tool.getItem(temp.名字, temp));
        delete GemConfig[temp.名字].名字;
    }
    logger.info('读取了 ' + trdirl.length + ' 个 宝石 配置文件');
}
// 读取符文配置文件
export function getRuneConfig() {
    let trdirl = File.getFilesList('./plugins/NWeapon/Rune');
    for (var i = 0; i < trdirl.length; i++) {
        let path = './plugins/NWeapon/Rune/'+trdirl[i];
        let temp = JSON.parse(Util.YAMLtoJSON(File.readFrom(path)));
        // tran
        let res = Tool.numberIdToStringId(temp, "外形");
        if (res[0]) {
            File.writeTo(path, Util.JSONtoYAML(JSON.stringify(res[1])));
        }
        // tran - end
        for (let k in temp.属性) if (temp.属性[k] === 0) delete temp.属性[k];
        RuneConfig[temp.名字] = temp;
        if (temp.添加到创造背包) blockitem.addToCreativeBar(Tool.getItem(temp.名字, temp));
        delete RuneConfig[temp.名字].名字;
    }
    logger.info('读取了 ' + trdirl.length + ' 个 符文 配置文件');
}
// 读取武器配置文件
export function getWeaponConfig() {
    let trdirl = File.getFilesList('./plugins/NWeapon/Weapon');
    for (var i = 0; i < trdirl.length; i++) {
        let path = './plugins/NWeapon/Weapon/'+trdirl[i];
        let temp = JSON.parse(Util.YAMLtoJSON(File.readFrom(path)));
        // tran
        let res = Tool.numberIdToStringId(temp, "外形");
        if (res[0]) {
            File.writeTo(path, Util.JSONtoYAML(JSON.stringify(res[1])));
        }
        // tran - end
        for (let k in temp.属性) if (temp.属性[k] === 0) delete temp.属性[k];
        WeaponConfig[temp.名字] = temp;
        if (temp.添加到创造背包) blockitem.addToCreativeBar(Tool.getItem(temp.名字, temp));
        delete WeaponConfig[temp.名字].名字;
    }
    logger.info('读取了 ' + trdirl.length + ' 个 武器 配置文件');
}
// 读取护甲配置文件
export function getArmorConfig() {
    let trdirl = File.getFilesList('./plugins/NWeapon/Armor');
    for (var i = 0; i < trdirl.length; i++) {
        let path = './plugins/NWeapon/Armor/'+trdirl[i];
        let temp = JSON.parse(Util.YAMLtoJSON(File.readFrom(path)));
        // tran
        let res = Tool.numberIdToStringId(temp, "外形");
        if (res[0]) {
            File.writeTo(path, Util.JSONtoYAML(JSON.stringify(res[1])));
        }
        // tran - end
        for (let k in temp.属性) if (temp.属性[k] === 0) delete temp.属性[k];
        ArmorConfig[temp.名字] = temp;
        if (temp.添加到创造背包) blockitem.addToCreativeBar(Tool.getItem(temp.名字, temp));
        delete ArmorConfig[temp.名字].名字;
    }
    logger.info('读取了 ' + trdirl.length + ' 个 护甲 配置文件');
}
// 读取饰品配置文件
export function getJewelryConfig() {
    let trdirl = File.getFilesList('./plugins/NWeapon/Jewelry');
    for (var i = 0; i < trdirl.length; i++) {
        let path = './plugins/NWeapon/Jewelry/'+trdirl[i];
        let temp = JSON.parse(Util.YAMLtoJSON(File.readFrom(path)));
        // tran
        let res = Tool.numberIdToStringId(temp, "外形");
        if (res[0]) {
            File.writeTo(path, Util.JSONtoYAML(JSON.stringify(res[1])));
        }
        // tran - end
        for (let k in temp.属性) if (temp.属性[k] === 0) delete temp.属性[k];
        JewelryConfig[temp.名字] = temp;
        if (temp.添加到创造背包) blockitem.addToCreativeBar(Tool.getItem(temp.名字, temp));
        delete JewelryConfig[temp.名字].名字;
    }
    logger.info('读取了 ' + trdirl.length + ' 个 饰品 配置文件');
}
// 读取锻造图配置文件
export function getPaperConfig() {
    let trdirl = File.getFilesList('./plugins/NWeapon/锻造图');
    for (var i = 0; i < trdirl.length; i++) {
        let path = './plugins/NWeapon/锻造图/'+trdirl[i];
        let temp = JSON.parse(Util.YAMLtoJSON(File.readFrom(path)));
        // tran
        let res = Tool.numberIdToStringId(temp, "外形");
        if (res[0]) {
            File.writeTo(path, Util.JSONtoYAML(JSON.stringify(res[1])));
        }
        // tran - end
        PaperConfig[temp.名字] = temp;
        if (temp.添加到创造背包) {
            blockitem.addToCreativeBar(Tool.getItem(temp.名字, temp));
        }
        delete PaperConfig[temp.名字].名字;
    }
    logger.info('读取了 ' + trdirl.length + ' 个 锻造 配置文件');
}
/**
 * 配置文件对象
 */
export var _C = {
    ItemTypeList,
    MainConfig,

    PlayerData,
    NbtItem,
    ForgeEntry,

    GemConfig,
    RuneConfig,
    WeaponConfig,
    ArmorConfig,
    JewelryConfig,
    PaperConfig
}