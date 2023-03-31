import { valueToString } from '../../util/Tool.js';
import { mc } from '@LLSELib';

/**
 * 向 玩家 查看属性
 * @param {cn.nukkit.Player} sender 发给对方的表
 * @param {cn.nukkit.Player} p 玩家对象
 * @param {string} type 类型，只有 dz与attr两种
 * @param {object} [data] 玩家属性数据，只有当 /nwe check attr 时传入
 * @returns 
 */
export function checkAttr(sender, p, type, data) {
    try {
        if (type === "dz") {
            if (!PlayerData[p.getName()]) {
                return sender.sendMessage("[NWeapon] 没有玩家§8" + p.getName() + "§f的数据");
            }
            let winx = mc.newCustomForm().
                setTitle('锻造 - 信息 - ' + p.getName()).
                // TODO: 已解锁图纸
                //addLabel("\n§a┏一一一一 §l已解锁的图纸§r§a 一一一一┓§r\n未知...\n§2┗一一一一 §l已解锁的图纸§r§2 一一一一┛§r").
                addLabel("当前等级: §a" + PlayerData[p.getName()].level).
                addLabel("当前经验: §a" + PlayerData[p.getName()].exp).
                addLabel("距离下一级(所需): §6" + PlayerData[p.getName()].req);
            mc.getPlayer(sender.getName()).sendForm(winx, function(){});
        } else if (type === "attr") {
            let str = "";
            if (!data) {
                return sender.sendMessage("[NWeapon] 没有玩家§8" + p.getName() + "§f的数据");
            }
            let winx = mc.newCustomForm();//创建窗口
            winx.setTitle('玩家属性 - ' + p.getName());
            for (let i in data.Main) {
                let value = valueToString(data.Main[i], i);
                if (value == "0") {
                    continue;
                }
                str += " " + i + ": " + value;
                switch (i) {// 主属性中的绿值显示
                    case '血量值': {
                        if (!data.Main['生命加成']) {
                            str += "\n";
                            break;
                        }
                        str += "§a+" + (value * valueToString(data.Main['生命加成'])).toFixed(0) + "§r\n";
                        break;
                    }
                    case '攻击力': {
                        if (!data.Main['攻击加成']) {
                            str += "\n";
                            break;
                        }
                        if (data.Main['攻击力'][0] === data.Main['攻击力'][1]) {
                            str += "§a+" + (data.Main['攻击力'][0] * data.Main['攻击加成'][0]).toFixed(0) + "§r\n";
                        } else {
                            str += "§a+" + (data.Main['攻击力'][0] * data.Main['攻击加成'][0]).toFixed(0) + " - " + (data.Main['攻击力'][1] * data.Main['攻击加成'][1]).toFixed(0) + "§r\n";
                        }
                        break;
                    }
                    case '防御力': {
                        if (!data.Main['防御加成']) {
                            str += "\n";
                            break;
                        }
                        if (data.Main['防御力'][0] === data.Main['防御力'][1]) {
                            str += "§a+" + (data.Main['防御力'][0] * data.Main['防御加成'][0]).toFixed(0) + "§r\n";
                        } else {
                            str += "§a+" + (data.Main['防御力'][0] * data.Main['防御加成'][0]).toFixed(0) + " - " + (data.Main['防御力'][1] * data.Main['防御加成'][1]).toFixed(0) + "§r\n";
                        }
                        break;
                    }
                    default: {
                        str += "\n";
                    }
                }
            }
            winx.addLabel("§l§7### 总属性§r\n" + str);
            for (let i in data) {
                if (["Effect", "EffectSuit", "Main"].indexOf(i) > -1) {
                    continue;
                }
                str = "";
                for (let n in data[i]) {
                    let value = valueToString(data[i][n], n);
                    if (value == 0) {
                        continue;
                    }
                    str += "  " + n + ": " + value + "\n";
                }
                winx.addLabel(" §7# " + i + "§r\n" + str);
            }
            str = "";
            let nowTime = (new Date().getTime() / 1000).toFixed(0);
            for (let i in data.Effect) {
                str += "  " + i + " (" + (data.Effect[i].time - nowTime) + "s): " + data.Effect[i].level + "\n";
            }
            if (str) {
                winx.addLabel(" §7# 临时效果§r\n" + str);
            }
            mc.getPlayer(sender.getName()).sendForm(winx, function(){});
        }
    } catch (err) {
        console.error(err.stack);
    }
}