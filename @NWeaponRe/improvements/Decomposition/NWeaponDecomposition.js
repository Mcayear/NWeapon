import * as blockitem from '../../util/blockitem.js';
import { Player } from "cn.nukkit.Player";
import { Item as JItem } from "cn.nukkit.item.Item";
import { Server } from 'cn.nukkit.Server';

const server = Server.getInstance();
/**
 * 分解NWeapon物品
 * @param {Player} player 玩家对象
 * @param {JItem[]} list 待分解的物品列表
 */
export function NWeaponDecomposition(player, list) {
    for (let i = 0; i < list.length; i++) {
        const name = list[i].getCustomName() || list[i].getName();
        if (list[i].getNamedTag() == null) {
            player.sendMessage("[NWeapon] " + name + " §r不是NWeapon装备");
            continue;
        }
        const obj = getNWeaponConfig(list[i].getNamedTag().getString('NWeaponNameTag'));
        if (!obj) {
            player.sendMessage("[NWeapon] " + name + " §r不是NWeapon装备");
            continue;
        }
        if (obj.不可分解) {
            player.sendMessage("[NWeapon] " + name + " §r不可分解");
            continue;
        }
        if (list[i].getNamedTag().getString('lock') != "") {
            player.sendMessage("[NWeapon] " + name + " §r已被锁定，用§7/nwe unlock§r解锁后尝试");
            continue;
        }
        if (Config.bind) {
            let bindObj = list[i].getNamedTag().getString('PlayerBind');
            if (bindObj) {
                bindObj = JSON.parse(bindObj);
                if (bindObj.name && bindObj.name != player.name) {
                    player.sendMessage("[NWeapon] " + name + " §r是 " + bindObj.name + " 的灵魂绑定装备");
                    continue;
                }
            }
        }
        let cmdlist1 = obj.分解所得;
        let cmdlist2 = Config.分解所得[1] ? Config.分解所得[1][obj.品阶] : null;
        if (cmdlist1) {
            cmdlist1 = Config.分解所得[0][cmdlist1];
            for (let n in cmdlist1) {
                server.dispatchCommand(server.getConsoleSender(), cmdlist1[n].replace("{player}", player.name));
            }
            blockitem.removeItemFromPlayer(player, list[i]);
        } else if (cmdlist2) {
            cmdlist2 = cmdlist2.split("\n");
            for (let n in cmdlist2) {
                server.dispatchCommand(server.getConsoleSender(), cmdlist2[n].replace("{player}", player.name));
            }
            blockitem.removeItemFromPlayer(player, list[i]);
        } else {
            player.sendMessage("[NWeapon] " + name + " §r没有分解方案");
        }
    }
}