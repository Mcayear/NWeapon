import * as blockitem from '../../util/blockitem.js';
import * as inventory from '../../util/inventory.js';
import * as Tool from '../../util/Tool.js';

/** 锻造 - 虚拟物品栏物品更改事件处理 */
export function ForgingFakeInvChange(event) {
    var player = event.getPlayer();
    var slot = event.getAction().getSlot();
    var inv = event.getAction().getInventory();
    var newItem = event.getAction().getTargetItem();
    /** 获取共享变量 */
    var _C = contain('NWeapon_C');
    /** 玩家的一些临时数据 */
    var PlayerSmithingTempData = contain('PlayerSmithingTempData');
    if (!PlayerSmithingTempData[player.name]) {
        PlayerSmithingTempData[player.name] = null;
    }
    if (slot == 0) {
        /** 配置文件的图纸数据 */
        let paperData = _C.PaperConfig[newItem.getCustomName()];
        if (paperData) {
            if (!_C.PlayerData[player.getName()]) _C.PlayerData[player.getName()] = { exp: 0, level: 0 };
            if (paperData.限制等级 > _C.PlayerData[player.getName()].level) {
                player.sendMessage("[NWeapon] §c您的锻造师等级不足");
            } else {
                let nameTag = newItem.getNamedTag().getString('NWeaponNameTag');
                if (nameTag && nameTag.slice(0, nameTag.indexOf(";")) === ItemTypeList["图纸"]) {
                    PlayerSmithingTempData[player.name] = Object.assign({}, paperData);//消除对象关联性，这非常重要！！！
                    if (PlayerSmithingTempData[player.name]) return;
                    player.sendMessage("[NWeapon] §c配置文件中没有这个锻造方案");
                } else {
                    player.sendMessage("[NWeapon] §c这不是有效的锻造图纸");
                    event.setCancelled(true);
                }
            }
        } else {
            player.sendMessage("[NWeapon] §c锻造图纸不存在");
        }
        event.setCancelled(true);
    } else {
        if (!PlayerSmithingTempData[player.name]) {
            player.sendMessage("[NWeapon] §c请先在第一格放入图纸");
            event.setCancelled(true);
            return;
        }
        if (_C.MainConfig.锻造模式 == 0) {
            if (slot == 1) {
                let TempData = PlayerSmithingTempData[player.name].方案[1];
                let data = _C.WeaponConfig[data[0]] || _C.ArmorConfig[data[0]];
                if (data === undefined) {
                    player.sendMessage("[NWeapon] §c这不是一个NWeapon装备");
                    event.setCancelled(true);
                    return;
                }
                if (newItem.getCustomName() === TempData[0] && newItem.getId() === TempData[1] && newItem.getDamage() === TempData[2]) {
                    if (TempData[3]) {
                        if (blockitem.getNBTString(newItem) != blockitem.getNBTString(Tool.getItem(TempData[0], data))) {
                            player.sendMessage("[NWeapon] §c你不能为这个NWeapon装备进行锻造");
                            event.setCancelled(true);
                            return;
                        }
                    }
                } else {
                    player.sendMessage("[NWeapon] §c这不是图纸需求的装备");
                    event.setCancelled(true);
                    return;
                }
            } else {
                if (inventory.getInventorySlot(inv, 1).getId() == 0) {
                    player.sendMessage("[NWeapon] §c请先在第2格放入装备");
                    event.setCancelled(true);
                    return;
                }
                if (inventory.getInventorySlot(inv, slot - 1).getId() == 0) {
                    player.sendMessage("[NWeapon] §c请先在第" + (slot - 1) + "格放入材料");
                    event.setCancelled(true);
                    return;
                }
            }
        } else if (_C.MainConfig.锻造模式 === 1) {
            if (inventory.getInventorySlot(inv, slot - 1).getId() == 0) {
                player.sendMessage("[NWeapon] §c请先在第" + (slot - 1) + "格放入材料");
                event.setCancelled(true);
                return;
            }
        }
    }
}